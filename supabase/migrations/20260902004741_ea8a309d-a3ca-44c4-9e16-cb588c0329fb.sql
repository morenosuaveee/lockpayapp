-- Activity flags for suspicious sender behaviour
CREATE TABLE public.activity_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_flags_severity_check CHECK (severity IN ('low','medium','high')),
  CONSTRAINT activity_flags_status_check CHECK (status IN ('open','resolved','dismissed'))
);

GRANT SELECT, INSERT, UPDATE ON public.activity_flags TO authenticated;
GRANT ALL ON public.activity_flags TO service_role;

ALTER TABLE public.activity_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_flags" ON public.activity_flags
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_create_flags" ON public.activity_flags
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "admins_update_flags" ON public.activity_flags
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER activity_flags_updated BEFORE UPDATE ON public.activity_flags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX activity_flags_user_idx ON public.activity_flags(user_id, status);

-- Sender summary (admin only)
CREATE OR REPLACE FUNCTION public.admin_sender_summary(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'display_name', p.display_name,
        'email', COALESCE(p.email, p.paypal_email),
        'phone_number', COALESCE(p.phone_number, p.phone),
        'date_of_birth', p.date_of_birth,
        'email_verified', p.email_verified,
        'phone_verified', p.phone_verified,
        'created_at', p.created_at,
        'onboarding_completed_at', p.onboarding_completed_at,
        'identity_status', (SELECT k.identity_status FROM public.kyc_profiles k WHERE k.user_id = p.id),
        'is_admin', public.has_role(p.id, 'admin')
      ) FROM public.profiles p WHERE p.id = _user_id
    ),
    'totals', (
      SELECT jsonb_build_object(
        'sent_count', COUNT(*),
        'sent_amount', COALESCE(SUM(t.amount), 0),
        'unlocked_count', COUNT(*) FILTER (WHERE t.status IN ('unlocked','completed')),
        'unlocked_amount', COALESCE(SUM(t.amount) FILTER (WHERE t.status IN ('unlocked','completed')), 0),
        'in_flight_amount', COALESCE(SUM(t.amount) FILTER (WHERE t.status IN ('locked','awaiting_confirmation','pending','pending_payment','pending_invite','awaiting_recipient','recipient_confirmed')), 0),
        'refunded_amount', COALESCE(SUM(t.amount) FILTER (WHERE t.status IN ('refunded','expired','cancelled')), 0),
        'fees_amount', COALESCE(SUM(t.fee_amount), 0),
        'claims_count', COUNT(*) FILTER (WHERE t.recipient_confirmed_at IS NOT NULL),
        'invites_count', COUNT(*) FILTER (WHERE t.claim_token IS NOT NULL),
        'distinct_recipients', COUNT(DISTINCT lower(t.recipient_identifier)),
        'failed_unlock_attempts', (
          SELECT COUNT(*) FROM public.unlock_attempts ua
          JOIN public.transactions t2 ON t2.id = ua.transaction_id
          WHERE t2.sender_id = _user_id AND ua.success = false
        ),
        'first_sent_at', MIN(t.created_at),
        'last_sent_at', MAX(t.created_at)
      ) FROM public.transactions t WHERE t.sender_id = _user_id
    ),
    'open_flags', (
      SELECT COUNT(*) FROM public.activity_flags f
      WHERE f.user_id = _user_id AND f.status = 'open'
    )
  ) INTO _res;

  RETURN _res;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sender_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_sender_summary(uuid) TO authenticated;

-- Sender transfers with recipient claim state (admin only)
CREATE OR REPLACE FUNCTION public.admin_sender_transfers(_user_id uuid, _limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  amount numeric,
  fee_amount numeric,
  currency text,
  status transaction_status,
  recipient_identifier text,
  recipient_channel text,
  recipient_id uuid,
  recipient_name text,
  recipient_claimed boolean,
  recipient_confirmed_at timestamptz,
  invite_sent_at timestamptz,
  released_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  failed_attempts bigint,
  flag_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT t.id, t.amount, t.fee_amount, t.currency, t.status,
         t.recipient_identifier, t.recipient_channel, t.recipient_id,
         COALESCE(rp.first_name || ' ' || rp.last_name, rp.display_name) AS recipient_name,
         (t.recipient_confirmed_at IS NOT NULL) AS recipient_claimed,
         t.recipient_confirmed_at, t.invite_sent_at, t.released_at, t.expires_at, t.created_at,
         (SELECT COUNT(*) FROM public.unlock_attempts ua WHERE ua.transaction_id = t.id AND ua.success = false) AS failed_attempts,
         (SELECT COUNT(*) FROM public.activity_flags f WHERE f.transaction_id = t.id AND f.status = 'open') AS flag_count
  FROM public.transactions t
  LEFT JOIN public.profiles rp ON rp.id = t.recipient_id
  WHERE t.sender_id = _user_id
  ORDER BY t.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 100), 500);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sender_transfers(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_sender_transfers(uuid, integer) TO authenticated;

-- Flags for one sender (admin only)
CREATE OR REPLACE FUNCTION public.admin_sender_flags(_user_id uuid)
RETURNS TABLE(
  id uuid,
  transaction_id uuid,
  reason text,
  severity text,
  notes text,
  status text,
  created_at timestamptz,
  resolved_at timestamptz,
  created_by_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT f.id, f.transaction_id, f.reason, f.severity, f.notes, f.status,
         f.created_at, f.resolved_at,
         COALESCE(cp.first_name || ' ' || cp.last_name, cp.display_name, 'Administrator') AS created_by_name
  FROM public.activity_flags f
  LEFT JOIN public.profiles cp ON cp.id = f.created_by
  WHERE f.user_id = _user_id
  ORDER BY (f.status = 'open') DESC, f.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sender_flags(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_sender_flags(uuid) TO authenticated;

-- Open flag counts per sender for the directory list (admin only)
CREATE OR REPLACE FUNCTION public.admin_flag_counts()
RETURNS TABLE(user_id uuid, open_flags bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT f.user_id, COUNT(*) AS open_flags
  FROM public.activity_flags f
  WHERE f.status = 'open'
  GROUP BY f.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_flag_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_flag_counts() TO authenticated;