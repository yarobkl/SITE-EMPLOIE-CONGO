create or replace function public.admin_marketplace_kpis()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_primary_recruiter() then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  with live_jobs as (
    select j.id, coalesce(j.published_at, j.created_at) as live_at
    from public.jobs j
    where j.status = 'published'
      and coalesce(j.moderation_status, 'approved') = 'approved'
  ),
  app_by_job as (
    select a.job_id,
           count(*)::bigint as application_count,
           min(a.created_at) as first_application_at
    from public.applications a
    group by a.job_id
  ),
  live_job_metrics as (
    select lj.id,
           lj.live_at,
           coalesce(abj.application_count, 0)::bigint as application_count,
           abj.first_application_at,
           case when abj.first_application_at is not null
             then extract(epoch from (abj.first_application_at - lj.live_at)) / 3600.0
             else null
           end as hours_to_first_application
    from live_jobs lj
    left join app_by_job abj on abj.job_id = lj.id
  ),
  app_summary as (
    select
      count(*)::bigint as total,
      count(*) filter (where status='accepted')::bigint as accepted,
      count(*) filter (where status in ('reviewed','accepted'))::bigint as progressed
    from public.applications
  ),
  conv_summary as (
    select
      count(*) filter (where application_id is not null)::bigint as threads,
      count(distinct application_id) filter (where application_id is not null)::bigint as applications_with_thread
    from public.message_threads
  ),
  talent_summary as (
    select
      count(*) filter (where status='active')::bigint as active_posts,
      count(*) filter (where status='hired')::bigint as hired_posts
    from public.job_seeker_posts
  ),
  invite_summary as (
    select
      count(*)::bigint as total,
      count(*) filter (where status='accepted')::bigint as accepted
    from public.talent_invitations
  ),
  company_summary as (
    select
      count(*)::bigint as total,
      count(*) filter (where verified=true)::bigint as verified
    from public.companies
  )
  select jsonb_build_object(
    'live_jobs', (select count(*) from live_job_metrics),
    'live_jobs_with_applications', (select count(*) from live_job_metrics where application_count > 0),
    'live_jobs_without_applications', (select count(*) from live_job_metrics where application_count = 0),
    'job_application_coverage_pct', coalesce((select round(100.0 * count(*) filter (where application_count > 0) / nullif(count(*),0),1) from live_job_metrics),0),
    'avg_applications_per_live_job', coalesce((select round(avg(application_count)::numeric,2) from live_job_metrics),0),
    'median_hours_to_first_application', coalesce((select round(percentile_cont(0.5) within group (order by greatest(hours_to_first_application,0))::numeric,1) from live_job_metrics where hours_to_first_application is not null),0),
    'applications_total', (select total from app_summary),
    'applications_accepted', (select accepted from app_summary),
    'application_acceptance_pct', coalesce((select round(100.0 * accepted / nullif(total,0),1) from app_summary),0),
    'applications_progressed', (select progressed from app_summary),
    'application_progress_pct', coalesce((select round(100.0 * progressed / nullif(total,0),1) from app_summary),0),
    'application_threads', (select threads from conv_summary),
    'applications_with_conversation', (select applications_with_thread from conv_summary),
    'application_to_conversation_pct', coalesce((select round(100.0 * applications_with_thread / nullif((select total from app_summary),0),1) from conv_summary),0),
    'active_talent_posts', (select active_posts from talent_summary),
    'hired_talent_posts', (select hired_posts from talent_summary),
    'talent_invitations', (select total from invite_summary),
    'talent_invitations_accepted', (select accepted from invite_summary),
    'talent_invitation_acceptance_pct', coalesce((select round(100.0 * accepted / nullif(total,0),1) from invite_summary),0),
    'companies_total', (select total from company_summary),
    'verified_companies', (select verified from company_summary),
    'verified_company_pct', coalesce((select round(100.0 * verified / nullif(total,0),1) from company_summary),0)
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_marketplace_jobs_at_risk()
returns table(
  job_id uuid,
  title text,
  company_name text,
  published_at timestamptz,
  age_hours numeric,
  application_count bigint,
  first_application_at timestamptz,
  health text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_primary_recruiter() then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  return query
  select
    j.id,
    j.title::text,
    coalesce(c.name,'Entreprise')::text,
    coalesce(j.published_at,j.created_at),
    round((extract(epoch from (now() - coalesce(j.published_at,j.created_at))) / 3600.0)::numeric,1),
    count(a.id)::bigint,
    min(a.created_at),
    case
      when count(a.id)=0 and now() - coalesce(j.published_at,j.created_at) >= interval '7 days' then 'critical'
      when count(a.id)=0 and now() - coalesce(j.published_at,j.created_at) >= interval '72 hours' then 'watch'
      when count(a.id)=0 then 'new'
      else 'healthy'
    end::text
  from public.jobs j
  left join public.companies c on c.id=j.company_id
  left join public.applications a on a.job_id=j.id
  where j.status='published'
    and coalesce(j.moderation_status,'approved')='approved'
  group by j.id,j.title,c.name,j.published_at,j.created_at
  having count(a.id)=0
  order by coalesce(j.published_at,j.created_at) asc;
end;
$$;

revoke all on function public.admin_marketplace_kpis() from public, anon;
revoke all on function public.admin_marketplace_jobs_at_risk() from public, anon;
grant execute on function public.admin_marketplace_kpis() to authenticated;
grant execute on function public.admin_marketplace_jobs_at_risk() to authenticated;
