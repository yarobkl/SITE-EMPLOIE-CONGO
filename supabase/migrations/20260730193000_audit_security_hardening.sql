-- Security and data-integrity hardening found during the 2026-07-30 audit.
-- This migration does not update or delete application data or CV objects.

-- Remove privileges that are not used by the Data API.
revoke truncate, references, trigger
on table
  public.profiles,
  public.companies,
  public.jobs,
  public.applications,
  public.saved_jobs,
  public.job_views,
  public.notifications,
  public.boost_requests
from anon, authenticated;

-- Recruiters may update only workflow fields on applications. Candidate
-- identity, contact details, job ownership and CV paths stay immutable.
revoke update on table public.applications from authenticated;
grant update (
  status,
  application_opened,
  application_seen_at,
  cv_opened,
  cv_opened_at
) on table public.applications to authenticated;

-- Admin review is the only supported update to a boost request.
revoke update on table public.boost_requests from authenticated;
grant update (status, reviewed_by, reviewed_at)
on table public.boost_requests to authenticated;

create or replace function private.prevent_application_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if row(
    new.job_id,
    new.candidate_id,
    new.nom,
    new.email,
    new.phone,
    new.message,
    new.cv_url,
    new.cv_name,
    new.cv_size,
    new.tracking_enabled,
    new.tracking_number,
    new.created_at
  ) is distinct from row(
    old.job_id,
    old.candidate_id,
    old.nom,
    old.email,
    old.phone,
    old.message,
    old.cv_url,
    old.cv_name,
    old.cv_size,
    old.tracking_enabled,
    old.tracking_number,
    old.created_at
  ) then
    raise exception 'application identity fields are immutable';
  end if;

  if old.application_opened and not new.application_opened then
    raise exception 'application_opened cannot be reversed';
  end if;

  if old.cv_opened and not new.cv_opened then
    raise exception 'cv_opened cannot be reversed';
  end if;

  if new.application_opened and new.application_seen_at is null then
    raise exception 'application_seen_at is required when an application is opened';
  end if;

  if new.cv_opened and new.cv_opened_at is null then
    raise exception 'cv_opened_at is required when a CV is opened';
  end if;

  if old.application_seen_at is not null
    and new.application_seen_at is distinct from old.application_seen_at then
    raise exception 'application_seen_at is immutable once set';
  end if;

  if old.cv_opened_at is not null
    and new.cv_opened_at is distinct from old.cv_opened_at then
    raise exception 'cv_opened_at is immutable once set';
  end if;

  return new;
end;
$function$;

revoke all on function private.prevent_application_identity_change() from public;

drop trigger if exists applications_prevent_identity_change on public.applications;
create trigger applications_prevent_identity_change
before update on public.applications
for each row execute function private.prevent_application_identity_change();

-- Keep the role-protection trigger reproducible in fresh environments.
drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
before update of role on public.profiles
for each row execute function private.prevent_profile_role_change();

-- Merge equivalent permissive policies so PostgreSQL evaluates one policy per
-- action while preserving both quick and tracked application flows.
drop policy if exists "quick applications can be created" on public.applications;
drop policy if exists "tracked applications can be created" on public.applications;
drop policy if exists "applications can be created" on public.applications;

create policy "applications can be created"
on public.applications
for insert
to anon, authenticated
with check (
  (
    candidate_id is null
    and tracking_enabled = false
    and tracking_number ~ '^NZJ-[A-Z0-9-]{12,64}$'
    and application_opened = false
    and cv_opened = false
    and status = 'pending'
    and cv_url ~ '^quick/[0-9a-f-]{36}\.pdf$'
    and exists (
      select 1
      from public.jobs
      where jobs.id = applications.job_id
        and jobs.status = 'published'
    )
  )
  or
  (
    candidate_id = (select auth.uid())
    and tracking_enabled = true
    and tracking_number ~ '^NZJ-[A-Z0-9-]{12,64}$'
    and application_opened = false
    and cv_opened = false
    and status = 'pending'
    and cv_url ~ (
      '^'
      || (select auth.uid())::text
      || '/[0-9a-f-]{36}\.pdf$'
    )
    and exists (
      select 1
      from public.jobs
      where jobs.id = applications.job_id
        and jobs.status = 'published'
    )
  )
);

drop policy if exists "candidates read own applications" on public.applications;
drop policy if exists "recruiters read received applications" on public.applications;
drop policy if exists "users read permitted applications" on public.applications;

create policy "users read permitted applications"
on public.applications
for select
to authenticated
using (
  candidate_id = (select auth.uid())
  or exists (
    select 1
    from public.jobs
    join public.companies on companies.id = jobs.company_id
    where jobs.id = applications.job_id
      and companies.owner_id = (select auth.uid())
  )
);

-- Per-record limits protect the public application endpoint from oversized
-- payloads. Existing production rows were checked before this migration.
do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.applications'::regclass
      and conname = 'applications_content_limits'
  ) then
    alter table public.applications
      add constraint applications_content_limits check (
        length(btrim(nom)) between 1 and 120
        and length(btrim(email)) between 3 and 254
        and (phone is null or length(phone) <= 40)
        and (message is null or length(message) <= 4000)
        and (cv_name is null or length(cv_name) <= 255)
        and (cv_size is null or cv_size between 0 and 2097152)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_content_limits'
  ) then
    alter table public.jobs
      add constraint jobs_content_limits check (
        length(btrim(title)) between 1 and 160
        and length(btrim(description)) between 1 and 20000
        and length(btrim(location)) between 1 and 120
        and length(btrim(contract_type)) between 1 and 80
        and (salary_range is null or length(salary_range) <= 120)
        and (sector is null or length(sector) <= 120)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.companies'::regclass
      and conname = 'companies_content_limits'
  ) then
    alter table public.companies
      add constraint companies_content_limits check (
        length(btrim(name)) between 1 and 160
        and (city is null or length(city) <= 120)
        and (sector is null or length(sector) <= 120)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_content_limits'
  ) then
    alter table public.profiles
      add constraint profiles_content_limits check (
        (nom is null or length(nom) <= 120)
        and (prenom is null or length(prenom) <= 120)
        and (email is null or length(email) <= 254)
        and (phone is null or length(phone) <= 40)
        and (city is null or length(city) <= 120)
        and (title is null or length(title) <= 160)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.boost_requests'::regclass
      and conname = 'boost_requests_values_check'
  ) then
    alter table public.boost_requests
      add constraint boost_requests_values_check check (
        plan in ('standard', 'premium', 'urgent')
        and status in ('pending', 'approved', 'rejected')
        and amount >= 0
        and (message is null or length(message) <= 1000)
      ) not valid;
  end if;
end;
$constraints$;

alter table public.applications validate constraint applications_content_limits;
alter table public.jobs validate constraint jobs_content_limits;
alter table public.companies validate constraint companies_content_limits;
alter table public.profiles validate constraint profiles_content_limits;
alter table public.boost_requests validate constraint boost_requests_values_check;

create index if not exists boost_requests_reviewed_by_idx
  on public.boost_requests (reviewed_by)
  where reviewed_by is not null;

create unique index if not exists boost_requests_one_pending_per_job_idx
  on public.boost_requests (job_id)
  where status = 'pending' and job_id is not null;

create index if not exists job_views_viewer_id_idx
  on public.job_views (viewer_id)
  where viewer_id is not null;
