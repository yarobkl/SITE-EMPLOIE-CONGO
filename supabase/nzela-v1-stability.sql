-- Nzela Jobs V1 stability migration.
-- Safe to run multiple times in Supabase SQL Editor.

create extension if not exists "pgcrypto";

alter table public.applications
  add column if not exists tracking_number text,
  add column if not exists application_seen_at timestamptz,
  add column if not exists cv_opened_at timestamptz;

create unique index if not exists applications_tracking_number_key
  on public.applications (tracking_number)
  where tracking_number is not null;

create index if not exists applications_job_id_created_at_idx
  on public.applications (job_id, created_at desc);

create index if not exists applications_candidate_id_created_at_idx
  on public.applications (candidate_id, created_at desc);

create index if not exists jobs_company_id_created_at_idx
  on public.jobs (company_id, created_at desc);

create table if not exists public.boost_requests (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  recruiter_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  plan text not null default 'standard' check (plan in ('standard', 'premium', 'urgent')),
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.boost_requests enable row level security;

grant select, insert, update on public.boost_requests to authenticated;

drop policy if exists "recruiters create own boost requests" on public.boost_requests;
drop policy if exists "recruiters read own boost requests" on public.boost_requests;
drop policy if exists "admins manage boost requests" on public.boost_requests;

create policy "recruiters create own boost requests" on public.boost_requests
  for insert with check (
    auth.uid() = recruiter_id
    and exists (
      select 1
      from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = boost_requests.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters read own boost requests" on public.boost_requests
  for select using (
    auth.uid() = recruiter_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "admins manage boost requests" on public.boost_requests
  for update using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  ) with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 2097152, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "candidates upload own cv pdf" on storage.objects;
drop policy if exists "candidates read own cv pdf" on storage.objects;
drop policy if exists "quick applicants upload cv pdf" on storage.objects;
drop policy if exists "recruiters read candidate cv pdf" on storage.objects;

create policy "candidates upload own cv pdf" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
    and lower(right(name, 4)) = '.pdf'
  );

create policy "candidates read own cv pdf" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and auth.uid() is not null
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "quick applicants upload cv pdf" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = 'public'
    and lower(right(name, 4)) = '.pdf'
  );

create policy "recruiters read candidate cv pdf" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and exists (
      select 1
      from public.applications
      join public.jobs on jobs.id = applications.job_id
      join public.companies on companies.id = jobs.company_id
      where applications.cv_url = storage.objects.name
      and companies.owner_id = auth.uid()
    )
  );
