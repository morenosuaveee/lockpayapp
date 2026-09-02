-- PUBLIC (i.e. anon) still had EXECUTE via the default grant; revoke it explicitly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.sync_my_verification() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_my_verification() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_sender_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sender_summary(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_sender_transfers(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sender_transfers(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_sender_flags(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sender_flags(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_flag_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_flag_counts() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recipient_confirm_claim(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recipient_confirm_claim(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_invite_pending_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_invite_pending_payment(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_recipient(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_recipient(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unlock_transaction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_transaction(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

-- claim_lookup stays anon-callable: the public invite/claim landing page needs it.
REVOKE EXECUTE ON FUNCTION public.claim_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_lookup(text) TO anon, authenticated;