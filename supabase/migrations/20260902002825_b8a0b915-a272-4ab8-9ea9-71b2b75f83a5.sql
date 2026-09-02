-- 1) Fix mutable search_path on queue helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- 2) Revoke EXECUTE on internal, service-only SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

-- 3) Revoke anonymous access to functions that require a signed-in user
REVOKE ALL ON FUNCTION public.recipient_confirm_claim(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.mark_invite_pending_payment(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.lookup_recipient(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.sync_my_verification() FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- 4) Ownership-scoped compliance-proof storage policies
DROP POLICY IF EXISTS "Public read compliance-proof" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload compliance-proof" ON storage.objects;

CREATE POLICY "compliance_proof_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'compliance-proof'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "compliance_proof_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'compliance-proof'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "compliance_proof_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'compliance-proof' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'compliance-proof' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "compliance_proof_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'compliance-proof' AND (storage.foldername(name))[1] = auth.uid()::text);