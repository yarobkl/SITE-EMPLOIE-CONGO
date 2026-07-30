-- Restore the minimum Data API privileges required by the Nzela Jobs UI.
-- Row-level security remains the authorization boundary for every write.

grant insert, update on table public.profiles to authenticated;
grant insert, update on table public.companies to authenticated;
grant insert, update, delete on table public.jobs to authenticated;
grant insert on table public.applications to anon, authenticated;
grant update on table public.applications to authenticated;
grant insert, delete on table public.saved_jobs to authenticated;
grant insert on table public.job_views to anon, authenticated;
grant update on table public.notifications to authenticated;
grant insert, update on table public.boost_requests to authenticated;

-- A private helper avoids recursive jobs/applications RLS evaluation while
-- checking both the authenticated owner and the absence of applications.
create or replace function private.can_delete_owned_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.jobs
    join public.companies on companies.id = jobs.company_id
    where jobs.id = target_job_id
      and companies.owner_id = (select auth.uid())
      and not exists (
        select 1
        from public.applications
        where applications.job_id = jobs.id
      )
  );
$function$;

revoke all on function private.can_delete_owned_job(uuid) from public;
grant execute on function private.can_delete_owned_job(uuid) to authenticated;

-- A recruiter may permanently delete only an owned offer with no applications.
-- Offers that already received applications must be closed instead so candidate
-- records and CV references are preserved.
drop policy if exists "recruiters delete own jobs" on public.jobs;

create policy "recruiters delete own jobs"
on public.jobs
for delete
to authenticated
using ((select private.can_delete_owned_job(jobs.id)));

-- Let a user move between candidate and recruiter modes while preventing
-- self-promotion to admin. Existing admin accounts keep their role.
create or replace function private.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.role is distinct from old.role
    and (
      old.role = 'admin'
      or new.role not in ('candidat', 'recruteur')
    )
  then
    raise exception 'invalid profile role change';
  end if;

  return new;
end;
$function$;

revoke all on function private.prevent_profile_role_change() from public;
