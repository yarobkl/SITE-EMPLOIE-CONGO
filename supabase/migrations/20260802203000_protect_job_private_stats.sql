begin;

create or replace function public.get_job_public_stats(p_job_ids uuid[])
returns table(job_id uuid, view_count bigint, application_count bigint, favorite_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    j.id as job_id,
    (select count(*) from public.job_views jv where jv.job_id = j.id) as view_count,
    case
      when exists (
        select 1 from public.companies c
        where c.id = j.company_id and c.owner_id = auth.uid()
      ) or private.is_primary_recruiter()
      then (select count(*) from public.applications a where a.job_id = j.id)
      else 0
    end as application_count,
    case
      when exists (
        select 1 from public.companies c
        where c.id = j.company_id and c.owner_id = auth.uid()
      ) or private.is_primary_recruiter()
      then (select count(*) from public.saved_jobs sj where sj.job_id = j.id)
      else 0
    end as favorite_count
  from public.jobs j
  where j.id = any(p_job_ids)
    and (
      j.status = 'published'
      or exists (
        select 1 from public.companies c
        where c.id = j.company_id and c.owner_id = auth.uid()
      )
      or private.is_primary_recruiter()
    );
$$;

revoke all on function public.get_job_public_stats(uuid[]) from public;
grant execute on function public.get_job_public_stats(uuid[]) to anon, authenticated;

commit;
