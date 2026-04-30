-- Enums
CREATE TYPE public.transaction_status AS ENUM ('locked','awaiting_confirmation','completed','expired','cancelled');
CREATE TYPE public.payment_provider AS ENUM ('paypal','venmo','bank');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  paypal_email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to look up other users' paypal_email when sending money
CREATE POLICY "profiles_select_lookup" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Payment methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL DEFAULT 'paypal',
  account_identifier TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_select_own" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pm_insert_own" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_update_own" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pm_delete_own" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_paypal_email TEXT,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_identifier TEXT NOT NULL, -- email/phone/username they sent to
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  provider public.payment_provider NOT NULL DEFAULT 'paypal',
  status public.transaction_status NOT NULL DEFAULT 'locked',
  unlock_code_hash TEXT NOT NULL,
  sender_confirmed BOOLEAN NOT NULL DEFAULT false,
  receiver_confirmed BOOLEAN NOT NULL DEFAULT false,
  sender_attempts INT NOT NULL DEFAULT 0,
  receiver_attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  note TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user a party to the txn?
CREATE OR REPLACE FUNCTION public.is_txn_party(_txn public.transactions)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _txn.sender_id
    OR auth.uid() = _txn.recipient_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.paypal_email = _txn.recipient_identifier OR p.phone = _txn.recipient_identifier)
    );
$$;

CREATE POLICY "tx_select_party" ON public.transactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
        AND (p.paypal_email = recipient_identifier OR p.phone = recipient_identifier)));

CREATE POLICY "tx_insert_sender" ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "tx_update_party" ON public.transactions FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
        AND (p.paypal_email = recipient_identifier OR p.phone = recipient_identifier)));

-- Unlock attempts log
CREATE TABLE public.unlock_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sender','receiver')),
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unlock_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua_select_party" ON public.unlock_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id
    AND (auth.uid() = t.sender_id OR auth.uid() = t.recipient_id)));
CREATE POLICY "ua_insert_party" ON public.unlock_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, paypal_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER transactions_updated BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-expire trigger (set status to expired when reading if past expiry)
-- We'll handle that in app logic too, but provide a helper:
CREATE OR REPLACE FUNCTION public.expire_old_transactions()
RETURNS void LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.transactions
  SET status = 'expired'
  WHERE status IN ('locked','awaiting_confirmation')
    AND expires_at < now();
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;