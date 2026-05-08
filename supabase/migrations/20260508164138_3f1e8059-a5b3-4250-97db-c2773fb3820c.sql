
-- Add escrow-style status values (additive, non-breaking)
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'unlocked';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'refunded';
