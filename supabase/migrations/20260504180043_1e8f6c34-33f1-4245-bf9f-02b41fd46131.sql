ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'locked';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON public.transactions(stripe_session_id);