
-- =========== ROLES ===========
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- First user to call this becomes admin
create or replace function public.claim_admin_if_first(_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  has_any boolean;
begin
  select exists(select 1 from public.user_roles where role = 'admin') into has_any;
  if not has_any then
    insert into public.user_roles (user_id, role) values (_user_id, 'admin')
    on conflict do nothing;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.claim_admin_if_first(uuid) to authenticated;

-- =========== GOVERNORATES & CITIES ===========
create table public.governorates (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  governorate_id uuid not null references public.governorates(id) on delete cascade,
  name_ar text not null,
  created_at timestamptz not null default now(),
  unique (governorate_id, name_ar)
);

grant select on public.governorates to anon, authenticated;
grant insert, update, delete on public.governorates to authenticated;
grant all on public.governorates to service_role;

grant select on public.cities to anon, authenticated;
grant insert, update, delete on public.cities to authenticated;
grant all on public.cities to service_role;

alter table public.governorates enable row level security;
alter table public.cities enable row level security;

create policy "Public can read governorates" on public.governorates for select to anon, authenticated using (true);
create policy "Admins manage governorates" on public.governorates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Public can read cities" on public.cities for select to anon, authenticated using (true);
create policy "Admins manage cities" on public.cities for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- =========== DOCTORS ===========
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  governorate_id uuid references public.governorates(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  governorate text,
  city text,
  address text,
  specialty text not null default 'نساء وتوليد',
  bio text,
  map_url text,
  image_url text,
  verified boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index doctors_governorate_idx on public.doctors(governorate_id);
create index doctors_city_idx on public.doctors(city_id);
create index doctors_verified_idx on public.doctors(verified);
create index doctors_featured_idx on public.doctors(featured);

grant select on public.doctors to anon, authenticated;
grant insert, update, delete on public.doctors to authenticated;
grant all on public.doctors to service_role;

alter table public.doctors enable row level security;

create policy "Public can read verified doctors" on public.doctors for select
  to anon, authenticated
  using (verified = true);

create policy "Admins read all doctors" on public.doctors for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage doctors" on public.doctors for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =========== APPLICATIONS ===========
create type public.application_status as enum ('pending', 'approved', 'rejected');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  doctor_name text not null,
  phone text not null,
  whatsapp text,
  email text not null,
  governorate_id uuid references public.governorates(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  address text,
  specialty text not null default 'نساء وتوليد',
  bio text,
  map_url text,
  image_url text,
  license_url text,
  confirmed_female boolean not null default false,
  status application_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);

grant insert on public.applications to anon;
grant select, insert, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;

alter table public.applications enable row level security;

create policy "Anyone can submit application" on public.applications for insert
  to anon, authenticated
  with check (true);

create policy "Admins read applications" on public.applications for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update applications" on public.applications for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete applications" on public.applications for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- =========== CONTACT MESSAGES ===========
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

grant insert on public.contact_messages to anon;
grant select, insert, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;

alter table public.contact_messages enable row level security;

create policy "Anyone can send a message" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "Admins read messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete messages" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- =========== updated_at trigger ===========
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger doctors_set_updated_at before update on public.doctors
for each row execute function public.set_updated_at();

-- =========== SEED: 27 Egyptian governorates ===========
insert into public.governorates (name_ar, slug) values
  ('القاهرة','cairo'),
  ('الجيزة','giza'),
  ('الإسكندرية','alexandria'),
  ('القليوبية','qalyubia'),
  ('الشرقية','sharqia'),
  ('الدقهلية','dakahlia'),
  ('المنوفية','monufia'),
  ('الغربية','gharbia'),
  ('كفر الشيخ','kafr-el-sheikh'),
  ('البحيرة','beheira'),
  ('دمياط','damietta'),
  ('بورسعيد','port-said'),
  ('الإسماعيلية','ismailia'),
  ('السويس','suez'),
  ('شمال سيناء','north-sinai'),
  ('جنوب سيناء','south-sinai'),
  ('الفيوم','fayoum'),
  ('بني سويف','beni-suef'),
  ('المنيا','minya'),
  ('أسيوط','assiut'),
  ('سوهاج','sohag'),
  ('قنا','qena'),
  ('الأقصر','luxor'),
  ('أسوان','aswan'),
  ('البحر الأحمر','red-sea'),
  ('الوادي الجديد','new-valley'),
  ('مطروح','matrouh');

-- Seed a starter set of cities for the biggest governorates
insert into public.cities (governorate_id, name_ar)
select g.id, c.name from public.governorates g
join (values
  ('cairo','مدينة نصر'),('cairo','المعادي'),('cairo','مصر الجديدة'),('cairo','وسط البلد'),('cairo','المقطم'),('cairo','حلوان'),('cairo','الزمالك'),('cairo','الشروق'),
  ('giza','المهندسين'),('giza','الدقي'),('giza','فيصل'),('giza','الهرم'),('giza','6 أكتوبر'),('giza','الشيخ زايد'),
  ('alexandria','سموحة'),('alexandria','المنتزه'),('alexandria','سيدي جابر'),('alexandria','العجمي'),('alexandria','محرم بك'),
  ('qalyubia','بنها'),('qalyubia','شبرا الخيمة'),('qalyubia','القناطر الخيرية'),
  ('dakahlia','المنصورة'),('dakahlia','ميت غمر'),('dakahlia','طلخا'),
  ('sharqia','الزقازيق'),('sharqia','بلبيس'),('sharqia','العاشر من رمضان'),
  ('gharbia','طنطا'),('gharbia','المحلة الكبرى'),('gharbia','كفر الزيات'),
  ('monufia','شبين الكوم'),('monufia','منوف'),('monufia','السادات'),
  ('beheira','دمنهور'),('beheira','كفر الدوار'),('beheira','رشيد'),
  ('kafr-el-sheikh','كفر الشيخ'),('kafr-el-sheikh','دسوق'),
  ('damietta','دمياط'),('damietta','رأس البر'),
  ('port-said','بورسعيد'),
  ('ismailia','الإسماعيلية'),('ismailia','فايد'),
  ('suez','السويس'),
  ('fayoum','الفيوم'),
  ('beni-suef','بني سويف'),
  ('minya','المنيا'),('minya','ملوي'),
  ('assiut','أسيوط'),
  ('sohag','سوهاج'),('sohag','أخميم'),
  ('qena','قنا'),
  ('luxor','الأقصر'),
  ('aswan','أسوان'),
  ('red-sea','الغردقة'),('red-sea','مرسى علم'),
  ('new-valley','الخارجة'),
  ('matrouh','مرسى مطروح')
) as c(slug, name) on g.slug = c.slug;
