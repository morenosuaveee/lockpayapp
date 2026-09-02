-- 1. Basic profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamptz;

UPDATE public.profiles SET email = COALESCE(email, paypal_email);
UPDATE public.profiles SET phone_number = COALESCE(phone_number, phone);
UPDATE public.profiles SET phone_verified = true WHERE phone_verified_at IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Roles (never stored on profiles)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS user_roles_service_all ON public.user_roles;
CREATE POLICY user_roles_service_all ON public.user_roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. KYC data kept apart from everyday profile data
CREATE TABLE IF NOT EXISTS public.kyc_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name text,
  country text,
  identity_status text NOT NULL DEFAULT 'unverified',
  identity_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.kyc_profiles TO authenticated;
GRANT ALL ON public.kyc_profiles TO service_role;

ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kyc_select_own ON public.kyc_profiles;
CREATE POLICY kyc_select_own ON public.kyc_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS kyc_insert_own ON public.kyc_profiles;
CREATE POLICY kyc_insert_own ON public.kyc_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS kyc_update_own ON public.kyc_profiles;
CREATE POLICY kyc_update_own ON public.kyc_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS kyc_admin_select ON public.kyc_profiles;
CREATE POLICY kyc_admin_select ON public.kyc_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS kyc_profiles_updated ON public.kyc_profiles;
CREATE TRIGGER kyc_profiles_updated BEFORE UPDATE ON public.kyc_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.kyc_profiles (user_id, legal_name, country, identity_status, identity_verified_at)
SELECT p.id, p.legal_name, p.country,
       CASE WHEN p.identity_verified_at IS NOT NULL THEN 'verified' ELSE 'unverified' END,
       p.identity_verified_at
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS legal_name,
  DROP COLUMN IF EXISTS country;

-- 4. Admins can read profiles (read-only)
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. New signups populate the split fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, paypal_email, email, first_name, last_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.kyc_profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Let a signed-in person refresh their own verification flags
CREATE OR REPLACE FUNCTION public.sync_my_verification()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  UPDATE public.profiles p
  SET email_verified = (u.email_confirmed_at IS NOT NULL),
      phone_verified = (u.phone_confirmed_at IS NOT NULL) OR p.phone_verified_at IS NOT NULL,
      email = COALESCE(p.email, u.email),
      updated_at = now()
  FROM auth.users u
  WHERE u.id = auth.uid() AND p.id = auth.uid();
END;
$$;

-- 7. Admin-only user directory
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _limit integer DEFAULT 100, _offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid, first_name text, last_name text, display_name text, email text,
  phone_number text, email_verified boolean, phone_verified boolean,
  date_of_birth date, created_at timestamptz, identity_status text,
  onboarding_completed_at timestamptz, terms_accepted_at timestamptz,
  privacy_policy_accepted_at timestamptz, is_admin boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.display_name, p.email,
         p.phone_number, p.email_verified, p.phone_verified,
         p.date_of_birth, p.created_at, COALESCE(k.identity_status,'unverified'),
         p.onboarding_completed_at, p.terms_accepted_at, p.privacy_policy_accepted_at,
         public.has_role(p.id, 'admin')
  FROM public.profiles p
  LEFT JOIN public.kyc_profiles k ON k.user_id = p.id
  WHERE _search IS NULL OR _search = '' OR (
        p.email ILIKE '%' || _search || '%'
     OR p.display_name ILIKE '%' || _search || '%'
     OR p.first_name ILIKE '%' || _search || '%'
     OR p.last_name ILIKE '%' || _search || '%'
     OR p.phone_number ILIKE '%' || _search || '%')
  ORDER BY p.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500)) OFFSET GREATEST(0, _offset);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_my_verification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;