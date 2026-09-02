CREATE TABLE public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  withdrawal_id uuid,
  kind text NOT NULL CHECK (kind IN ('transfer_credit','withdrawal_debit','withdrawal_reversal','adjustment')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX wallet_ledger_txn_kind_uidx ON public.wallet_ledger (transaction_id, kind);
CREATE INDEX wallet_ledger_user_idx ON public.wallet_ledger (user_id, created_at DESC);

GRANT SELECT ON public.wallet_ledger TO authenticated;
GRANT ALL ON public.wallet_ledger TO service_role;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_select_own ON public.wallet_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ledger_service_all ON public.wallet_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE public.payout_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_accounts TO authenticated;
GRANT ALL ON public.payout_accounts TO service_role;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_accounts_select_own ON public.payout_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY payout_accounts_service_all ON public.payout_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER payout_accounts_updated_at BEFORE UPDATE ON public.payout_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','reversed')),
  stripe_account_id text,
  stripe_transfer_id text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX withdrawals_user_idx ON public.withdrawals (user_id, created_at DESC);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY withdrawals_select_own ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY withdrawals_service_all ON public.withdrawals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.my_wallet_balance()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::numeric
  FROM public.wallet_ledger
  WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.my_wallet_balance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_wallet_balance() TO authenticated;

CREATE OR REPLACE FUNCTION public.unlock_transaction(_txn_id uuid)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _t public.transactions;
BEGIN
  SELECT * INTO _t FROM public.transactions WHERE id = _txn_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  IF NOT public.is_txn_party(_t) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _t.status NOT IN ('locked','awaiting_confirmation') THEN
    RAISE EXCEPTION 'Transaction not in unlockable state (current: %)', _t.status;
  END IF;
  IF _t.expires_at < now() THEN
    RAISE EXCEPTION 'Transaction expired';
  END IF;
  UPDATE public.transactions
  SET status = 'unlocked', released_at = now(), updated_at = now()
  WHERE id = _txn_id
  RETURNING * INTO _t;

  IF _t.recipient_id IS NOT NULL THEN
    INSERT INTO public.wallet_ledger (user_id, transaction_id, kind, amount, currency, description)
    VALUES (_t.recipient_id, _t.id, 'transfer_credit', _t.amount, _t.currency, 'Unlocked transfer')
    ON CONFLICT (transaction_id, kind) DO NOTHING;
  END IF;

  RETURN _t;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.unlock_transaction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_transaction(uuid) TO authenticated;

INSERT INTO public.wallet_ledger (user_id, transaction_id, kind, amount, currency, description)
SELECT t.recipient_id, t.id, 'transfer_credit', t.amount, t.currency, 'Unlocked transfer'
FROM public.transactions t
WHERE t.recipient_id IS NOT NULL AND t.status IN ('unlocked','completed')
ON CONFLICT (transaction_id, kind) DO NOTHING;