CREATE OR REPLACE FUNCTION public.lookup_recipient(_identifier text, _channel text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'exists', EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE (_channel = 'email' AND lower(p.paypal_email) = lower(_identifier))
         OR (_channel = 'phone' AND p.phone = _identifier)
    ),
    'verified', EXISTS(
      SELECT 1 FROM public.profiles p
      WHERE p.phone_verified_at IS NOT NULL
        AND ((_channel = 'email' AND lower(p.paypal_email) = lower(_identifier))
          OR (_channel = 'phone' AND p.phone = _identifier))
    )
  );
$$;

REVOKE ALL ON FUNCTION public.lookup_recipient(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_recipient(text, text) TO authenticated;