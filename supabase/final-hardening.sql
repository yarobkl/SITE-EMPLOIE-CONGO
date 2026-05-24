create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  session_key text not null,
  created_at timestamptz not null default now(),
  unique(job_id, session_key)
);

drop policy if exists "public can create companies for demo" on public.companies;
drop policy if exists "public can publish jobs for demo" on public.jobs;
drop policy if exists "public demo upload cv pdf" on storage.objects;
drop policy if exists "public demo read cv pdf" on storage.objects;

drop policy if exists "recruiters create own companies" on public.companies;
drop policy if exists "recruiters update own companies" on public.companies;
drop policy if exists "recruiters publish own jobs" on public.jobs;
drop policy if exists "recruiters update own jobs" on public.jobs;
drop policy if exists "recruiters delete own jobs" on public.jobs;
drop policy if exists "recruiters read received applications" on public.applications;
drop policy if exists "recruiters update received applications" on public.applications;
drop policy if exists "recruiters read candidate cv pdf" on storage.objects;
drop policy if exists "quick applicants upload cv pdf" on storage.objects;
drop policy if exists "quick applicants read cv pdf" on storage.objects;
drop policy if exists "recruiters read saved jobs for own jobs" on public.saved_jobs;
drop policy if exists "job views insert public" on public.job_views;
drop policy if exists "job views read public" on public.job_views;

alter table public.job_views enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.companies, public.jobs to anon, authenticated;
grant insert on public.applications to anon, authenticated;
grant insert on public.companies, public.jobs, public.profiles to authenticated;
grant update, delete on public.jobs to authenticated;
grant update on public.companies to authenticated;
grant select, update on public.applications to authenticated;
grant select, insert, update, delete on public.saved_jobs, public.notifications to authenticated;
grant insert, select on public.job_views to anon, authenticated;
grant select, update on public.profiles to authenticated;

create policy "recruiters create own companies" on public.companies
  for insert with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('recruteur', 'admin')
    )
  );

create policy "recruiters update own companies" on public.companies
  for update using (auth.uid() = owner_id);

create policy "recruiters publish own jobs" on public.jobs
  for insert with check (
    status = 'published'
    and exists (
      select 1 from public.companies
      join public.profiles on profiles.id = companies.owner_id
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
      and profiles.role in ('recruteur', 'admin')
    )
  );

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

create policy "recruiters read received applications" on public.applications
  for select using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = applications.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters update received applications" on public.applications
  for update using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = applications.job_id
      and companies.owner_id = auth.uid()
    )
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

create policy "quick applicants upload cv pdf" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = 'public'
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
