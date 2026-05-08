-- Remove broad profile lookup that exposed all users' email/phone to any signed-in user.
DROP POLICY IF EXISTS profiles_select_lookup ON public.profiles;

-- Ensure RLS is enabled (idempotent safety).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;