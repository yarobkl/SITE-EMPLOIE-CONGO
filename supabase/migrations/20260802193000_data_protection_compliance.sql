-- Nzela Jobs — socle de conformité données personnelles
-- Loi congolaise n° 29-2019 du 10 octobre 2019

begin;

alter table public.profiles
  add column if not exists privacy_version text,
  add column if not exists privacy_acknowledged_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz;

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject_email text,
  tracking_number text,
  consent_type text not null check (consent_type in (
    'terms_acceptance',
    'privacy_acknowledgement',
    'application_data_transfer',
    'marketing'
  )),
  document_version text not null,
  source text not null default 'web',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint consent_subject_required check (
    user_id is not null or subject_email is not null or tracking_number is not null
  )
);

create unique index if not exists consent_records_user_active_uidx
  on public.consent_records (user_id, consent_type, document_version)
  where user_id is not null and revoked_at is null;

create unique index if not exists consent_records_tracking_uidx
  on public.consent_records (tracking_number, consent_type, document_version)
  where tracking_number is not null and revoked_at is null;

alter table public.consent_records enable row level security;

revoke all on table public.consent_records from anon, authenticated;
grant insert on table public.consent_records to anon, authenticated;
grant select on table public.consent_records to authenticated;

create policy "users insert own consent records"
  on public.consent_records
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and consent_type in ('terms_acceptance','privacy_acknowledgement','application_data_transfer','marketing')
    and char_length(document_version) between 1 and 40
  );

create policy "anonymous application consent can be recorded"
  on public.consent_records
  for insert
  to anon
  with check (
    user_id is null
    and consent_type = 'application_data_transfer'
    and tracking_number ~ '^NZJ-[A-Z0-9-]{12,64}$'
    and subject_email is not null
    and char_length(subject_email) between 3 and 320
    and char_length(document_version) between 1 and 40
  );

create policy "users read own consent records"
  on public.consent_records
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  tracking_number text,
  request_type text not null check (request_type in (
    'access',
    'rectification',
    'deletion',
    'objection',
    'portability',
    'consent_withdrawal'
  )),
  details text,
  status text not null default 'pending' check (status in ('pending','in_review','completed','rejected')),
  created_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '30 days'),
  closed_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null
);

create index if not exists privacy_requests_user_created_idx
  on public.privacy_requests (user_id, created_at desc);
create index if not exists privacy_requests_status_due_idx
  on public.privacy_requests (status, due_at);

alter table public.privacy_requests enable row level security;

revoke all on table public.privacy_requests from anon, authenticated;
grant insert on table public.privacy_requests to anon, authenticated;
grant select on table public.privacy_requests to authenticated;

create policy "users create own privacy requests"
  on public.privacy_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and char_length(email) between 3 and 320
    and status = 'pending'
  );

create policy "anonymous users create privacy requests"
  on public.privacy_requests
  for insert
  to anon
  with check (
    user_id is null
    and char_length(email) between 3 and 320
    and status = 'pending'
    and (
      tracking_number is null
      or tracking_number ~ '^NZJ-[A-Z0-9-]{12,64}$'
    )
  );

create policy "users read own privacy requests"
  on public.privacy_requests
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Corrige une politique de création de conversation dont plusieurs comparaisons
-- portaient par erreur sur la même colonne.
drop policy if exists "participants create message threads" on public.message_threads;
create policy "participants create message threads"
  on public.message_threads
  for insert
  to authenticated
  with check (
    ((candidate_id = (select auth.uid())) or (recruiter_id = (select auth.uid())))
    and exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.companies c on c.id = j.company_id
      where a.id = message_threads.application_id
        and a.job_id = message_threads.job_id
        and j.id = message_threads.job_id
        and c.id = message_threads.company_id
        and a.candidate_id = message_threads.candidate_id
        and c.owner_id = message_threads.recruiter_id
        and (
          a.candidate_id = (select auth.uid())
          or c.owner_id = (select auth.uid())
        )
    )
  );

-- Une fonction trigger ne doit pas être exposée comme RPC publique.
revoke execute on function public.notify_primary_recruiter_on_application() from public, anon, authenticated;

commit;
