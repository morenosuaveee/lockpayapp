-- Columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS claim_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS recipient_channel text,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recipient_confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_transactions_claim_token ON public.transactions(claim_token);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;

-- Sanitized claim lookup
CREATE OR REPLACE FUNCTION public.claim_lookup(_token text)
RETURNS TABLE (
  id uuid,
  amount numeric,
  fee_amount numeric,
  currency text,
  recipient_identifier text,
  recipient_channel text,
  note text,
  status public.transaction_status,
  expires_at timestamptz,
  invite_sent_at timestamptz,
  recipient_confirmed_at timestamptz,
  sender_display_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.amount, t.fee_amount, t.currency,
         t.recipient_identifier, t.recipient_channel, t.note,
         t.status, t.expires_at, t.invite_sent_at, t.recipient_confirmed_at,
         COALESCE(p.display_name, 'A LockPay user') AS sender_display_name
  FROM public.transactions t
  LEFT JOIN public.profiles p ON p.id = t.sender_id
  WHERE t.claim_token = _token
    AND t.claim_token IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.claim_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_lookup(text) TO anon, authenticated;

-- Recipient confirm claim
CREATE OR REPLACE FUNCTION public.recipient_confirm_claim(
  _token text,
  _code_hash text
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.transactions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO _t FROM public.transactions
  WHERE claim_token = _token AND claim_token IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF _t.expires_at < now() THEN RAISE EXCEPTION 'Invite expired'; END IF;
  IF _t.status NOT IN ('pending_invite', 'awaiting_recipient') THEN
    RAISE EXCEPTION 'Invite no longer claimable (current: %)', _t.status;
  END IF;

  UPDATE public.transactions
  SET receiver_attempts = receiver_attempts + 1, updated_at = now()
  WHERE id = _t.id
  RETURNING * INTO _t;

  IF _t.receiver_attempts > _t.max_attempts THEN
    RAISE EXCEPTION 'Too many attempts';
  END IF;

  IF _t.unlock_code_hash <> _code_hash THEN
    INSERT INTO public.unlock_attempts(transaction_id, user_id, role, success)
    VALUES (_t.id, auth.uid(), 'receiver', false);
    RAISE EXCEPTION 'Incorrect code';
  END IF;

  INSERT INTO public.unlock_attempts(transaction_id, user_id, role, success)
  VALUES (_t.id, auth.uid(), 'receiver', true);

  UPDATE public.transactions
  SET status = 'recipient_confirmed',
      recipient_id = auth.uid(),
      receiver_confirmed = true,
      recipient_confirmed_at = now(),
      updated_at = now()
  WHERE id = _t.id
  RETURNING * INTO _t;

  RETURN _t;
END;
$$;

REVOKE ALL ON FUNCTION public.recipient_confirm_claim(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recipient_confirm_claim(text, text) TO authenticated;

-- Sender transitions to pending_payment
CREATE OR REPLACE FUNCTION public.mark_invite_pending_payment(_txn_id uuid)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.transactions;
BEGIN
  SELECT * INTO _t FROM public.transactions WHERE id = _txn_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF _t.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _t.status <> 'recipient_confirmed' THEN
    RAISE EXCEPTION 'Transaction not in recipient_confirmed state';
  END IF;
  UPDATE public.transactions
  SET status = 'pending_payment', updated_at = now()
  WHERE id = _txn_id
  RETURNING * INTO _t;
  RETURN _t;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_invite_pending_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_invite_pending_payment(uuid) TO authenticated;

-- Update expire function to include new states
CREATE OR REPLACE FUNCTION public.expire_old_transactions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH refunded AS (
    UPDATE public.transactions
    SET status = 'refunded', updated_at = now()
    WHERE status IN ('locked','awaiting_confirmation','pending')
      AND expires_at < now()
      AND stripe_payment_intent IS NOT NULL
    RETURNING id
  )
  UPDATE public.transactions
  SET status = 'expired', updated_at = now()
  WHERE status IN ('locked','awaiting_confirmation','pending','pending_payment','pending_invite','awaiting_recipient','recipient_confirmed')
    AND expires_at < now()
    AND id NOT IN (SELECT id FROM refunded);
$$;