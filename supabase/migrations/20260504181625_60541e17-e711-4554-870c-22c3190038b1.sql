-- Track fee charged per transfer
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fee_amount numeric NOT NULL DEFAULT 0;

-- Platform fees ledger
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  stripe_payment_intent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_fees_sender ON public.platform_fees(sender_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_created ON public.platform_fees(created_at DESC);

ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Senders can see their own fee rows
CREATE POLICY "fees_select_own_sender"
  ON public.platform_fees FOR SELECT
  USING (auth.uid() = sender_id);

-- Only service role can insert/update/delete (backend webhook)
CREATE POLICY "fees_service_role_all"
  ON public.platform_fees FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');