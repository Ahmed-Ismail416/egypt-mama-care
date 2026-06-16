drop policy if exists "Anyone can upload doctor image" on storage.objects;
create policy "Anyone can upload doctor image"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'doctor-images'
    and (storage.foldername(name))[1] = 'applications'
    and char_length(name) < 256
  );

drop policy if exists "Anyone can upload license" on storage.objects;
create policy "Anyone can upload license"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'doctor-licenses'
    and (storage.foldername(name))[1] = 'applications'
    and char_length(name) < 256
  );