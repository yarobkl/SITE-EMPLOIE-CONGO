-- Allow recruiters to open CV PDFs attached to applications received on their own jobs.
-- Run this in Supabase SQL Editor for the production project.

drop policy if exists "recruiters read candidate cv pdf" on storage.objects;

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
