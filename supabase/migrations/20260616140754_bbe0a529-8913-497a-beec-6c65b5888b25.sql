
-- Tighten SECURITY DEFINER function exposure
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

revoke execute on function public.claim_admin_if_first(uuid) from public;
-- Only signed-in users may attempt to claim admin
grant execute on function public.claim_admin_if_first(uuid) to authenticated;

-- Fix mutable search_path on trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Replace permissive "true" insert checks with light validation
drop policy if exists "Anyone can submit application" on public.applications;
create policy "Anyone can submit application" on public.applications for insert
  to anon, authenticated
  with check (
    char_length(doctor_name) between 2 and 200
    and char_length(phone) between 5 and 30
    and char_length(email) between 5 and 200
    and confirmed_female = true
  );

drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message" on public.contact_messages for insert
  to anon, authenticated
  with check (
    char_length(name) between 2 and 200
    and char_length(email) between 5 and 200
    and char_length(message) between 5 and 5000
  );

-- Storage policies for buckets created via tool (doctor-images, doctor-licenses)
create policy "Public read doctor images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'doctor-images');

create policy "Anyone can upload doctor image"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'doctor-images');

create policy "Admins manage doctor images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'doctor-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'doctor-images' and public.has_role(auth.uid(), 'admin'));

create policy "Anyone can upload license"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'doctor-licenses');

create policy "Admins read licenses"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'doctor-licenses' and public.has_role(auth.uid(), 'admin'));

create policy "Admins manage licenses"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'doctor-licenses' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'doctor-licenses' and public.has_role(auth.uid(), 'admin'));
