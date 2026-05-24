-- Enable recruiter offer management and offer analytics in production.
-- Run this in Supabase SQL Editor after the base schema is installed.

create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  session_key text not null,
  created_at timestamptz not null default now(),
  unique(job_id, session_key)
);

drop policy if exists "recruiters update own jobs" on public.jobs;
drop policy if exists "recruiters delete own jobs" on public.jobs;
drop policy if exists "recruiters update own companies" on public.companies;
drop policy if exists "recruiters read saved jobs for own jobs" on public.saved_jobs;
drop policy if exists "job views insert public" on public.job_views;
drop policy if exists "job views read public" on public.job_views;

alter table public.job_views enable row level security;

grant update, delete on public.jobs to authenticated;
grant update on public.companies to authenticated;
grant insert, select on public.job_views to anon, authenticated;

create policy "recruiters update own companies" on public.companies
  for update using (auth.uid() = owner_id);

create policy "recruiters update own jobs" on public.jobs
  for update using (
    exists (
      select 1 from public.companies
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters delete own jobs" on public.jobs
  for delete using (
    exists (
      select 1 from public.companies
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters read saved jobs for own jobs" on public.saved_jobs
  for select using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = saved_jobs.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "job views insert public" on public.job_views
  for insert with check (true);

create policy "job views read public" on public.job_views
  for select using (true);
