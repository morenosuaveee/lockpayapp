CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "del_insert_own" ON public.deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "del_select_own" ON public.deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "del_service_all" ON public.deletion_requests
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');