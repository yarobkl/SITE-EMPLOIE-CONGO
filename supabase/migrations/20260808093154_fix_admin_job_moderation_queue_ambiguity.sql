create or replace function public.admin_job_moderation_queue()
returns table(
  job_id uuid,
  job_title text,
  job_status text,
  moderation_status text,
  moderation_reason text,
  created_at timestamptz,
  company_id uuid,
  company_name text,
  company_verified boolean,
  owner_id uuid,
  owner_name text,
  owner_email text,
  open_report_count bigint,
  latest_report_at timestamptz,
  report_reasons jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_nzela_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;

  return query
  select
    j.id,
    j.title,
    j.status,
    j.moderation_status,
    j.moderation_reason,
    j.created_at,
    c.id,
    c.name,
    c.verified,
    c.owner_id,
    trim(concat_ws(' ', p.prenom, p.nom)),
    p.email,
    coalesce(r.open_count,0),
    r.latest_at,
    coalesce(r.reasons,'{}'::jsonb)
  from public.jobs j
  join public.companies c on c.id = j.company_id
  left join public.profiles p on p.id = c.owner_id
  left join lateral (
    select
      count(*) filter (where grouped.status='open') as open_count,
      max(grouped.latest_created_at) filter (where grouped.status='open') as latest_at,
      jsonb_object_agg(grouped.reason, grouped.reason_count) filter (where grouped.status='open') as reasons
    from (
      select
        jr0.reason,
        jr0.status,
        max(jr0.created_at) as latest_created_at,
        count(*) as reason_count
      from public.job_reports jr0
      where jr0.job_id = j.id
      group by jr0.reason, jr0.status
    ) grouped
  ) r on true
  where j.moderation_status <> 'approved'
     or coalesce(r.open_count,0) > 0
  order by
    case j.moderation_status when 'pending' then 0 when 'blocked' then 1 else 2 end,
    coalesce(r.latest_at, j.created_at) desc;
end;
$$;
