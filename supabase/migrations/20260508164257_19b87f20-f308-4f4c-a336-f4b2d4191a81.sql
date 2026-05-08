
-- Auto-refund expired locked/pending transactions
CREATE OR REPLACE FUNCTION public.expire_old_transactions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
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
  WHERE status IN ('locked','awaiting_confirmation','pending','pending_payment')
    AND expires_at < now()
    AND id NOT IN (SELECT id FROM refunded);
$$;

-- Mark a transaction as unlocked (escrow release) — callable by parties only
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
  RETURN _t;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.unlock_transaction(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_transaction(uuid) TO authenticated;
