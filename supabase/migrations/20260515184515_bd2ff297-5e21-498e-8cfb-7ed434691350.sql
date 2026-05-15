insert into storage.buckets (id, name, public) values ('compliance-proof', 'compliance-proof', true) on conflict (id) do nothing;

create policy "Public read compliance-proof"
on storage.objects for select
using (bucket_id = 'compliance-proof');

create policy "Auth upload compliance-proof"
on storage.objects for insert to authenticated
with check (bucket_id = 'compliance-proof');