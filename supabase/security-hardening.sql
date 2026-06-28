-- Security hardening patch for CONGOEMPLOI.
-- Run this in the Supabase SQL Editor AFTER schema.sql (and final-hardening.sql)
-- on an existing production project. It is idempotent and safe to re-run.

-- 1. Prevent privilege escalation through the profiles table.
--    The "profiles update own" policy lets a user edit their own row, and the
--    role check constraint accepts 'admin'. Without this guard, any signed-in
--    user could PATCH /profiles?id=eq.<own-uuid> and set role = 'admin'.
--    Only the backend (service_role key) may grant the admin role.
create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and new.role = 'admin' then
    if tg_op = 'INSERT' or old.role is distinct from 'admin' then
      new.role := 'candidat';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role on public.profiles;
create trigger enforce_profile_role
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_role();

-- 2. Restrict job view analytics to the recruiter who owns the job.
--    The previous "job views read public" policy (using true) exposed every
--    row of job_views — including each candidate's viewer_id — to anyone,
--    anonymous included.
revoke select on public.job_views from anon;

drop policy if exists "job views read public" on public.job_views;

drop policy if exists "recruiters read own job views" on public.job_views;
create policy "recruiters read own job views" on public.job_views
  for select using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = job_views.job_id
      and companies.owner_id = auth.uid()
    )
  );
