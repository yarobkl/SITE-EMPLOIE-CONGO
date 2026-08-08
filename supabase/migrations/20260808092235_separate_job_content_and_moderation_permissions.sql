revoke update on public.jobs from authenticated;
grant update(
  company_id,title,description,location,contract_type,salary_range,sector,requirements,
  status,created_at,published_at,expires_at,expiration_warning_sent_at,closed_at,archived_at,
  updated_at,location_id,skills,experience_min_years,education_level,availability_required
) on public.jobs to authenticated;

create or replace function private.prepare_job_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_owner uuid;
  v_trusted boolean := false;
  v_content_changed boolean := false;
begin
  select c.owner_id, public.is_verified_recruiter(c.owner_id)
    into v_owner, v_trusted
  from public.companies c
  where c.id = new.company_id;

  if v_owner is null then raise exception 'COMPANY_REQUIRED'; end if;

  if tg_op = 'INSERT' then
    if public.is_nzela_admin(auth.uid())
       or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
      new.moderation_status := 'approved';
      new.moderation_reason := null;
      new.moderation_reviewed_at := now();
      new.moderation_reviewed_by := auth.uid();
    else
      new.moderation_status := case when v_trusted then 'approved' else 'pending' end;
      new.moderation_reason := case when v_trusted then null else 'Nouvelle offre d’une entreprise non vérifiée.' end;
      new.moderation_reviewed_at := case when v_trusted then now() else null end;
      new.moderation_reviewed_by := null;
    end if;
    return new;
  end if;

  v_content_changed :=
       new.company_id is distinct from old.company_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.location is distinct from old.location
    or new.contract_type is distinct from old.contract_type
    or new.salary_range is distinct from old.salary_range
    or new.sector is distinct from old.sector
    or new.requirements is distinct from old.requirements
    or new.location_id is distinct from old.location_id
    or new.skills is distinct from old.skills
    or new.experience_min_years is distinct from old.experience_min_years
    or new.education_level is distinct from old.education_level
    or new.availability_required is distinct from old.availability_required;

  if v_content_changed
     and not v_trusted
     and not public.is_nzela_admin(auth.uid())
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    new.moderation_status := 'pending';
    new.moderation_reason := 'Offre modifiée par une entreprise non vérifiée.';
    new.moderation_reviewed_at := null;
    new.moderation_reviewed_by := null;
  end if;

  return new;
end;
$$;
