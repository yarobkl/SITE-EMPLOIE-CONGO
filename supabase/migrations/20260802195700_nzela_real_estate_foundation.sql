-- Nzela Immobilier: annonces ouvertes, photos, favoris, contacts, signalements et vues uniques.
begin;
create extension if not exists pgcrypto;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 140),
  description text not null check (char_length(description) between 20 and 5000),
  listing_type text not null default 'rent' check (listing_type in ('rent','sale')),
  property_type text not null check (property_type in ('room','studio','apartment','house','villa','commercial')),
  city text not null check (char_length(city) between 2 and 100),
  district text not null check (char_length(district) between 2 and 120),
  address_details text,
  price bigint not null check (price > 0),
  currency text not null default 'XAF' check (currency = 'XAF'),
  deposit_amount bigint not null default 0 check (deposit_amount >= 0),
  monthly_charges bigint not null default 0 check (monthly_charges >= 0),
  rooms smallint not null default 1 check (rooms between 1 and 50),
  bedrooms smallint not null default 0 check (bedrooms between 0 and 30),
  bathrooms smallint not null default 0 check (bathrooms between 0 and 20),
  area_sqm numeric(10,2) check (area_sqm is null or area_sqm > 0),
  furnished boolean not null default false,
  water_available boolean not null default false,
  electricity_available boolean not null default false,
  parking boolean not null default false,
  fenced boolean not null default false,
  security_available boolean not null default false,
  available_from date,
  contact_phone text,
  whatsapp_available boolean not null default false,
  show_phone boolean not null default false,
  status text not null default 'published' check (status in ('draft','published','rented','sold','expired','suspended','archived')),
  moderation_status text not null default 'unreviewed' check (moderation_status in ('unreviewed','approved','flagged','blocked')),
  moderation_note text,
  published_at timestamptz,
  expires_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_public_feed_idx on public.properties (status, moderation_status, expires_at, created_at desc);
create index if not exists properties_owner_idx on public.properties (owner_id, created_at desc);
create index if not exists properties_location_idx on public.properties (city, district, property_type, listing_type);
create index if not exists properties_price_idx on public.properties (price);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order smallint not null default 0 check (sort_order between 0 and 50),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists property_images_property_idx on public.property_images (property_id, is_cover desc, sort_order, created_at);

create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);
create index if not exists saved_properties_user_idx on public.saved_properties (user_id, created_at desc);

create table if not exists public.property_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text check (email is null or char_length(email) between 3 and 320),
  phone text check (phone is null or char_length(phone) between 5 and 40),
  message text not null check (char_length(message) between 5 and 2000),
  request_visit boolean not null default false,
  preferred_visit_at timestamptz,
  status text not null default 'new' check (status in ('new','contacted','visit_scheduled','closed','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_inquiry_contact_required check (email is not null or phone is not null)
);
create index if not exists property_inquiries_property_idx on public.property_inquiries (property_id, status, created_at desc);
create index if not exists property_inquiries_sender_idx on public.property_inquiries (sender_id, created_at desc) where sender_id is not null;

create table if not exists public.property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  session_key text not null check (char_length(session_key) between 32 and 128),
  created_at timestamptz not null default now(),
  unique (property_id, session_key)
);
create index if not exists property_views_property_idx on public.property_views (property_id, created_at desc);

create table if not exists public.property_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  reason text not null check (reason in ('fraud','already_unavailable','wrong_price','stolen_photos','prohibited','other')),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'new' check (status in ('new','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists property_reports_status_idx on public.property_reports (status, created_at desc);

create or replace function public.set_property_lifecycle() returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at := now();
  if new.status='published' and (tg_op='INSERT' or new.published_at is null or (tg_op='UPDATE' and new.status is distinct from old.status)) then
    new.published_at := now(); new.expires_at := now()+interval '30 days'; new.closed_at := null;
  end if;
  if new.status in ('rented','sold','archived') and (tg_op='INSERT' or new.closed_at is null or (tg_op='UPDATE' and new.status is distinct from old.status)) then new.closed_at := now(); end if;
  return new;
end; $$;
drop trigger if exists set_property_lifecycle_trigger on public.properties;
create trigger set_property_lifecycle_trigger before insert or update on public.properties for each row execute function public.set_property_lifecycle();

create or replace function public.set_property_inquiry_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at:=now(); return new; end; $$;
drop trigger if exists set_property_inquiry_updated_at_trigger on public.property_inquiries;
create trigger set_property_inquiry_updated_at_trigger before update on public.property_inquiries for each row execute function public.set_property_inquiry_updated_at();

create or replace function public.protect_property_moderation_fields() returns trigger language plpgsql security definer set search_path=public,private as $$
begin
  if auth.uid() is not null and not private.is_primary_recruiter() and (new.moderation_status is distinct from old.moderation_status or new.moderation_note is distinct from old.moderation_note) then raise exception 'moderation fields are reserved to administrators'; end if;
  return new;
end; $$;
drop trigger if exists protect_property_moderation_fields_trigger on public.properties;
create trigger protect_property_moderation_fields_trigger before update on public.properties for each row execute function public.protect_property_moderation_fields();

alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.saved_properties enable row level security;
alter table public.property_inquiries enable row level security;
alter table public.property_views enable row level security;
alter table public.property_reports enable row level security;

grant select on public.properties to anon,authenticated;
grant insert,update,delete on public.properties to authenticated;
grant select on public.property_images to anon,authenticated;
grant insert,update,delete on public.property_images to authenticated;
grant select,insert,delete on public.saved_properties to authenticated;
grant insert on public.property_inquiries to anon,authenticated;
grant select,update on public.property_inquiries to authenticated;
revoke all on public.property_views from anon,authenticated;
grant insert on public.property_reports to anon,authenticated;
grant select,update on public.property_reports to authenticated;

create policy "published properties are public and owners read theirs" on public.properties for select to anon,authenticated using (((status='published' and moderation_status<>'blocked' and coalesce(expires_at,now()+interval '1 day')>now())) or owner_id=(select auth.uid()) or (select private.is_primary_recruiter()));
create policy "authenticated users publish properties" on public.properties for insert to authenticated with check (owner_id=(select auth.uid()) and status in ('draft','published') and moderation_status='unreviewed');
create policy "owners update their properties" on public.properties for update to authenticated using (owner_id=(select auth.uid()) or (select private.is_primary_recruiter())) with check ((owner_id=(select auth.uid()) and status in ('draft','published','rented','sold','expired','archived')) or (select private.is_primary_recruiter()));
create policy "owners delete their properties" on public.properties for delete to authenticated using (owner_id=(select auth.uid()) or (select private.is_primary_recruiter()));

create policy "property images follow property visibility" on public.property_images for select to anon,authenticated using (exists(select 1 from public.properties p where p.id=property_images.property_id and ((p.status='published' and p.moderation_status<>'blocked' and coalesce(p.expires_at,now()+interval '1 day')>now()) or p.owner_id=(select auth.uid()) or (select private.is_primary_recruiter()))));
create policy "owners add property images" on public.property_images for insert to authenticated with check (owner_id=(select auth.uid()) and exists(select 1 from public.properties p where p.id=property_images.property_id and p.owner_id=(select auth.uid())));
create policy "owners update property images" on public.property_images for update to authenticated using (owner_id=(select auth.uid()) or (select private.is_primary_recruiter())) with check (owner_id=(select auth.uid()) or (select private.is_primary_recruiter()));
create policy "owners delete property images" on public.property_images for delete to authenticated using (owner_id=(select auth.uid()) or (select private.is_primary_recruiter()));

create policy "users and owners read saved properties" on public.saved_properties for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.properties p where p.id=saved_properties.property_id and p.owner_id=(select auth.uid())) or (select private.is_primary_recruiter()));
create policy "users save published properties" on public.saved_properties for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.properties p where p.id=saved_properties.property_id and p.status='published' and p.moderation_status<>'blocked' and coalesce(p.expires_at,now()+interval '1 day')>now()));
create policy "users delete saved properties" on public.saved_properties for delete to authenticated using (user_id=(select auth.uid()));

create policy "anyone contacts a published property" on public.property_inquiries for insert to anon,authenticated with check ((sender_id is null or sender_id=(select auth.uid())) and exists(select 1 from public.properties p where p.id=property_inquiries.property_id and p.status='published' and p.moderation_status<>'blocked' and coalesce(p.expires_at,now()+interval '1 day')>now()));
create policy "participants read property inquiries" on public.property_inquiries for select to authenticated using (sender_id=(select auth.uid()) or exists(select 1 from public.properties p where p.id=property_inquiries.property_id and p.owner_id=(select auth.uid())) or (select private.is_primary_recruiter()));
create policy "owners update property inquiries" on public.property_inquiries for update to authenticated using (exists(select 1 from public.properties p where p.id=property_inquiries.property_id and p.owner_id=(select auth.uid())) or (select private.is_primary_recruiter())) with check (exists(select 1 from public.properties p where p.id=property_inquiries.property_id and p.owner_id=(select auth.uid())) or (select private.is_primary_recruiter()));
create policy "owners read property views" on public.property_views for select to authenticated using (exists(select 1 from public.properties p where p.id=property_views.property_id and p.owner_id=(select auth.uid())) or (select private.is_primary_recruiter()));
create policy "anyone reports a published property" on public.property_reports for insert to anon,authenticated with check ((reporter_id is null or reporter_id=(select auth.uid())) and exists(select 1 from public.properties p where p.id=property_reports.property_id and p.status='published'));
create policy "administrators review property reports" on public.property_reports for select to authenticated using ((select private.is_primary_recruiter()));
create policy "administrators update property reports" on public.property_reports for update to authenticated using ((select private.is_primary_recruiter())) with check ((select private.is_primary_recruiter()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('property-images','property-images',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "property images are publicly readable" on storage.objects for select to anon,authenticated using (bucket_id='property-images');
create policy "users upload property images in own folder" on storage.objects for insert to authenticated with check (bucket_id='property-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "users update property images in own folder" on storage.objects for update to authenticated using (bucket_id='property-images' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='property-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "users delete property images in own folder" on storage.objects for delete to authenticated using (bucket_id='property-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.record_property_view(p_property_id uuid,p_session_key text) returns bigint language plpgsql security definer set search_path=public as $$
declare v_viewer uuid:=auth.uid(); v_session_hash text; v_count bigint;
begin
  if p_session_key is null or char_length(p_session_key)<16 or char_length(p_session_key)>256 then raise exception 'invalid session key'; end if;
  if not exists(select 1 from public.properties p where p.id=p_property_id and p.status='published' and p.moderation_status<>'blocked' and coalesce(p.expires_at,now()+interval '1 day')>now()) then return 0; end if;
  if v_viewer is not null and exists(select 1 from public.properties p where p.id=p_property_id and p.owner_id=v_viewer) then select count(*) into v_count from public.property_views where property_id=p_property_id; return v_count; end if;
  v_session_hash:=encode(digest(p_session_key,'sha256'),'hex');
  insert into public.property_views(property_id,viewer_id,session_key) values(p_property_id,v_viewer,v_session_hash) on conflict(property_id,session_key) do nothing;
  select count(*) into v_count from public.property_views where property_id=p_property_id; return v_count;
end; $$;

create or replace function public.record_job_view(p_job_id uuid,p_session_key text) returns bigint language plpgsql security definer set search_path=public as $$
declare v_viewer uuid:=auth.uid(); v_session_hash text; v_count bigint;
begin
  if p_session_key is null or char_length(p_session_key)<16 or char_length(p_session_key)>256 then raise exception 'invalid session key'; end if;
  if not exists(select 1 from public.jobs j where j.id=p_job_id and j.status='published') then return 0; end if;
  if v_viewer is not null and exists(select 1 from public.jobs j join public.companies c on c.id=j.company_id where j.id=p_job_id and c.owner_id=v_viewer) then select count(*) into v_count from public.job_views where job_id=p_job_id; return v_count; end if;
  v_session_hash:=encode(digest(p_session_key,'sha256'),'hex');
  insert into public.job_views(job_id,viewer_id,session_key) values(p_job_id,v_viewer,v_session_hash) on conflict(job_id,session_key) do nothing;
  select count(*) into v_count from public.job_views where job_id=p_job_id; return v_count;
end; $$;

create or replace function public.get_property_public_stats(p_property_ids uuid[]) returns table(property_id uuid,view_count bigint,favorite_count bigint,inquiry_count bigint) language sql stable security definer set search_path=public as $$
select p.id,(select count(*) from public.property_views pv where pv.property_id=p.id),(select count(*) from public.saved_properties sp where sp.property_id=p.id),case when p.owner_id=auth.uid() or private.is_primary_recruiter() then (select count(*) from public.property_inquiries pi where pi.property_id=p.id and pi.status<>'spam') else 0 end from public.properties p where p.id=any(p_property_ids) and ((p.status='published' and p.moderation_status<>'blocked' and coalesce(p.expires_at,now()+interval '1 day')>now()) or p.owner_id=auth.uid() or private.is_primary_recruiter()); $$;

create or replace function public.get_job_public_stats(p_job_ids uuid[]) returns table(job_id uuid,view_count bigint,application_count bigint,favorite_count bigint) language sql stable security definer set search_path=public as $$
select j.id,(select count(*) from public.job_views jv where jv.job_id=j.id),(select count(*) from public.applications a where a.job_id=j.id),(select count(*) from public.saved_jobs sj where sj.job_id=j.id) from public.jobs j where j.id=any(p_job_ids) and (j.status='published' or exists(select 1 from public.companies c where c.id=j.company_id and c.owner_id=auth.uid()) or private.is_primary_recruiter()); $$;

revoke all on function public.record_property_view(uuid,text) from public;
revoke all on function public.record_job_view(uuid,text) from public;
revoke all on function public.get_property_public_stats(uuid[]) from public;
revoke all on function public.get_job_public_stats(uuid[]) from public;
grant execute on function public.record_property_view(uuid,text) to anon,authenticated;
grant execute on function public.record_job_view(uuid,text) to anon,authenticated;
grant execute on function public.get_property_public_stats(uuid[]) to anon,authenticated;
grant execute on function public.get_job_public_stats(uuid[]) to anon,authenticated;
commit;
