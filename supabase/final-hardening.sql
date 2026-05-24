drop policy if exists "public can create companies for demo" on public.companies;
drop policy if exists "public can publish jobs for demo" on public.jobs;
drop policy if exists "public demo upload cv pdf" on storage.objects;
drop policy if exists "public demo read cv pdf" on storage.objects;

drop policy if exists "recruiters create own companies" on public.companies;
drop policy if exists "recruiters publish own jobs" on public.jobs;
drop policy if exists "recruiters read received applications" on public.applications;
drop policy if exists "recruiters update received applications" on public.applications;
drop policy if exists "recruiters read candidate cv pdf" on storage.objects;
drop policy if exists "quick applicants upload cv pdf" on storage.objects;
drop policy if exists "quick applicants read cv pdf" on storage.objects;

grant usage on schema public to anon, authenticated;
grant select on public.companies, public.jobs to anon, authenticated;
grant insert on public.applications to anon, authenticated;
grant insert on public.companies, public.jobs, public.profiles to authenticated;
grant select, update on public.applications to authenticated;
grant select, insert, update, delete on public.saved_jobs, public.notifications to authenticated;
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
