REVOKE ALL ON FUNCTION public.admin_list_users(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.sync_my_verification() FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_my_verification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;