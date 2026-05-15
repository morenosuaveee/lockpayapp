ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'pending_invite';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'awaiting_recipient';
ALTER TYPE public.transaction_status ADD VALUE IF NOT EXISTS 'recipient_confirmed';