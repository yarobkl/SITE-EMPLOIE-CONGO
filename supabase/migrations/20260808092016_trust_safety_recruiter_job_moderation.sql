-- Nzela Trust & Safety: recruiter verification integrity, job moderation and reporting.

create or replace function private.protect_company_trust_fields()
returns trigger language plpgsql security definer
set search_path = public, private, pg_temp
as $$
begin
  if public.is_nzela_admin(auth.uid())
     or coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified := false;
  else
    new.verified := old.verified;
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;
revoke all on function private.protect_company_trust_fields() from public;
drop trigger if exists companies_protect_trust_fields on public.companies;
create trigger companies_protect_trust_fields before insert or update on public.companies
for each row execute function private.protect_company_trust_fields();
revoke update on public.companies from authenticated;
grant update(name, logo_url, sector, city) on public.companies to authenticated;

alter table public.jobs add column if not exists moderation_status text;
alter table public.jobs add column if not exists moderation_reason text;
alter table public.jobs add column if not exists moderation_reviewed_at timestamptz;
alter table public.jobs add column if not exists moderation_reviewed_by uuid references public.profiles(id) on delete set null;
update public.jobs set moderation_status='approved' where moderation_status is null;
alter table public.jobs alter column moderation_status set default 'pending';
alter table public.jobs alter column moderation_status set not null;
alter table public.jobs drop constraint if exists jobs_moderation_status_check;
alter table public.jobs add constraint jobs_moderation_status_check check (moderation_status in ('pending','approved','blocked'));

create or replace function private.prepare_job_moderation()
returns trigger language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare v_owner uuid; v_trusted boolean := false; v_content_changed boolean := false;
begin
  select c.owner_id, public.is_verified_recruiter(c.owner_id) into v_owner, v_trusted
  from public.companies c where c.id=new.company_id;
  if v_owner is null then raise exception 'COMPANY_REQUIRED'; end if;
  if public.is_nzela_admin(auth.uid()) or coalesce(current_setting('request.jwt.claim.role', true), '')='service_role' then
    if tg_op='INSERT' and new.moderation_status is null then new.moderation_status:='approved'; end if;
    return new;
  end if;
  if tg_op='INSERT' then
    new.moderation_status:=case when v_trusted then 'approved' else 'pending' end;
    new.moderation_reason:=case when v_trusted then null else 'Nouvelle offre d’une entreprise non vérifiée.' end;
    new.moderation_reviewed_at:=null; new.moderation_reviewed_by:=null;
    return new;
  end if;
  new.moderation_status:=old.moderation_status; new.moderation_reason:=old.moderation_reason;
  new.moderation_reviewed_at:=old.moderation_reviewed_at; new.moderation_reviewed_by:=old.moderation_reviewed_by;
  v_content_changed:=new.company_id is distinct from old.company_id or new.title is distinct from old.title
    or new.description is distinct from old.description or new.location is distinct from old.location
    or new.contract_type is distinct from old.contract_type or new.salary_range is distinct from old.salary_range
    or new.sector is distinct from old.sector or new.requirements is distinct from old.requirements
    or new.location_id is distinct from old.location_id or new.skills is distinct from old.skills
    or new.experience_min_years is distinct from old.experience_min_years
    or new.education_level is distinct from old.education_level
    or new.availability_required is distinct from old.availability_required;
  if v_content_changed and not v_trusted then
    new.moderation_status:='pending'; new.moderation_reason:='Offre modifiée par une entreprise non vérifiée.';
    new.moderation_reviewed_at:=null; new.moderation_reviewed_by:=null;
  end if;
  return new;
end;
$$;
revoke all on function private.prepare_job_moderation() from public;
drop trigger if exists jobs_prepare_moderation on public.jobs;
create trigger jobs_prepare_moderation before insert or update on public.jobs
for each row execute function private.prepare_job_moderation();

drop policy if exists "jobs are public or owned" on public.jobs;
create policy "jobs are approved public or owned" on public.jobs for select to anon,authenticated
using ((status='published' and moderation_status='approved') or exists(
  select 1 from public.companies c where c.id=jobs.company_id and c.owner_id=(select auth.uid())
));

create table if not exists public.job_reports(
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  unique(job_id,reporter_id),
  constraint job_reports_reason_check check(reason in ('scam','payment_request','identity','misleading','discrimination','other')),
  constraint job_reports_status_check check(status in ('open','reviewed','resolved','dismissed')),
  constraint job_reports_details_length check(details is null or char_length(details)<=1200)
);
alter table public.job_reports enable row level security;
revoke all on public.job_reports from anon,authenticated;
grant select,insert on public.job_reports to authenticated;
create policy "users read own job reports" on public.job_reports for select to authenticated
using(reporter_id=(select auth.uid()) or public.is_nzela_admin((select auth.uid())));
create policy "users report approved public jobs" on public.job_reports for insert to authenticated
with check(reporter_id=(select auth.uid()) and status='open' and exists(
  select 1 from public.jobs j join public.companies c on c.id=j.company_id
  where j.id=job_reports.job_id and j.status='published' and j.moderation_status='approved'
    and c.owner_id is distinct from (select auth.uid())
));

create or replace function private.prepare_job_report()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp
as $$ begin
  if not public.is_nzela_admin(auth.uid()) and coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then
    new.reporter_id:=auth.uid(); new.status:='open'; new.reviewed_at:=null; new.reviewed_by:=null; new.review_note:=null;
  end if; return new;
end; $$;
revoke all on function private.prepare_job_report() from public;
drop trigger if exists job_reports_prepare_insert on public.job_reports;
create trigger job_reports_prepare_insert before insert on public.job_reports for each row execute function private.prepare_job_report();

create or replace function private.quarantine_job_after_reports()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp
as $$
declare v_open_reports bigint; v_owner uuid; v_title text; v_changed boolean:=false;
begin
  select count(*) into v_open_reports from public.job_reports r where r.job_id=new.job_id and r.status='open';
  if v_open_reports>=3 then
    update public.jobs j set moderation_status='pending', moderation_reason='Mise en attente automatique après plusieurs signalements.',
      moderation_reviewed_at=null,moderation_reviewed_by=null,updated_at=now()
    where j.id=new.job_id and j.moderation_status='approved';
    v_changed:=found;
    if v_changed then
      select c.owner_id,j.title into v_owner,v_title from public.jobs j join public.companies c on c.id=j.company_id where j.id=new.job_id;
      if v_owner is not null then insert into public.notifications(user_id,title,body) values(
        v_owner,'Offre mise en vérification',concat('L’offre « ',coalesce(v_title,'Offre'),' » a reçu plusieurs signalements et est temporairement masquée pendant son examen.'));
      end if;
    end if;
  end if; return new;
end; $$;
revoke all on function private.quarantine_job_after_reports() from public;
drop trigger if exists job_reports_quarantine_job on public.job_reports;
create trigger job_reports_quarantine_job after insert on public.job_reports for each row execute function private.quarantine_job_after_reports();

create or replace function public.admin_job_moderation_queue()
returns table(job_id uuid,job_title text,job_status text,moderation_status text,moderation_reason text,created_at timestamptz,
  company_id uuid,company_name text,company_verified boolean,owner_id uuid,owner_name text,owner_email text,
  open_report_count bigint,latest_report_at timestamptz,report_reasons jsonb)
language plpgsql security definer set search_path=public,pg_temp
as $$ begin
  if not public.is_nzela_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  return query select j.id,j.title,j.status,j.moderation_status,j.moderation_reason,j.created_at,c.id,c.name,c.verified,c.owner_id,
    trim(concat_ws(' ',p.prenom,p.nom)),p.email,coalesce(r.open_count,0),r.latest_at,coalesce(r.reasons,'{}'::jsonb)
  from public.jobs j join public.companies c on c.id=j.company_id left join public.profiles p on p.id=c.owner_id
  left join lateral(
    select count(*) filter(where jr.status='open') open_count,max(jr.created_at) filter(where jr.status='open') latest_at,
      jsonb_object_agg(jr.reason,jr.reason_count) filter(where jr.status='open') reasons
    from(select reason,status,max(created_at) created_at,count(*) reason_count from public.job_reports where job_id=j.id group by reason,status) jr
  ) r on true
  where j.moderation_status<>'approved' or coalesce(r.open_count,0)>0
  order by case j.moderation_status when 'pending' then 0 when 'blocked' then 1 else 2 end,coalesce(r.latest_at,j.created_at) desc;
end; $$;
revoke all on function public.admin_job_moderation_queue() from public,anon;
grant execute on function public.admin_job_moderation_queue() to authenticated;

create or replace function public.admin_job_reports(p_job_id uuid)
returns table(report_id uuid,reason text,details text,report_status text,created_at timestamptz,reporter_name text,reporter_email text)
language plpgsql security definer set search_path=public,pg_temp
as $$ begin
  if not public.is_nzela_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  return query select r.id,r.reason,r.details,r.status,r.created_at,trim(concat_ws(' ',p.prenom,p.nom)),p.email
  from public.job_reports r left join public.profiles p on p.id=r.reporter_id where r.job_id=p_job_id order by r.created_at desc;
end; $$;
revoke all on function public.admin_job_reports(uuid) from public,anon;
grant execute on function public.admin_job_reports(uuid) to authenticated;

create or replace function public.admin_review_job_moderation(p_job_id uuid,p_decision text,p_review_note text default null)
returns public.jobs language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_job public.jobs; v_owner uuid;
begin
  if not public.is_nzela_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_decision not in('approved','blocked') then raise exception 'INVALID_DECISION'; end if;
  update public.jobs set moderation_status=p_decision,moderation_reason=nullif(trim(p_review_note),''),moderation_reviewed_at=now(),
    moderation_reviewed_by=auth.uid(),updated_at=now() where id=p_job_id returning * into v_job;
  if v_job.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  update public.job_reports set status=case when p_decision='approved' then 'dismissed' else 'resolved' end,
    reviewed_at=now(),reviewed_by=auth.uid(),review_note=nullif(trim(p_review_note),'')
  where job_id=p_job_id and status in('open','reviewed');
  select c.owner_id into v_owner from public.companies c where c.id=v_job.company_id;
  if v_owner is not null then insert into public.notifications(user_id,title,body) values(v_owner,
    case when p_decision='approved' then 'Offre validée' else 'Offre bloquée' end,
    case when p_decision='approved' then concat('L’offre « ',v_job.title,' » a été validée et peut être visible publiquement.')
      else concat('L’offre « ',v_job.title,' » a été bloquée après contrôle de sécurité.') end); end if;
  return v_job;
end; $$;
revoke all on function public.admin_review_job_moderation(uuid,text,text) from public,anon;
grant execute on function public.admin_review_job_moderation(uuid,text,text) to authenticated;

create or replace function public.admin_review_recruiter_verification(p_verification_id uuid,p_decision text,p_review_note text default null)
returns public.recruiter_verifications language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_verification public.recruiter_verifications;
begin
  if not public.is_nzela_admin(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_decision not in('approved','rejected','suspended') then raise exception 'INVALID_DECISION'; end if;
  update public.recruiter_verifications set status=p_decision,reviewed_at=now(),reviewed_by=auth.uid(),review_note=nullif(trim(p_review_note),'')
  where id=p_verification_id returning * into v_verification;
  if v_verification.id is null then raise exception 'VERIFICATION_NOT_FOUND'; end if;
  if v_verification.company_id is not null then
    update public.companies set verified=(p_decision='approved') where id=v_verification.company_id;
    if p_decision='approved' then
      update public.jobs set moderation_status='approved',moderation_reason='Entreprise vérifiée.',moderation_reviewed_at=now(),
        moderation_reviewed_by=auth.uid(),updated_at=now() where company_id=v_verification.company_id and moderation_status='pending';
    elsif p_decision='suspended' then
      update public.jobs set moderation_status='blocked',moderation_reason='Vérification recruteur suspendue.',moderation_reviewed_at=now(),
        moderation_reviewed_by=auth.uid(),updated_at=now() where company_id=v_verification.company_id and status='published';
    end if;
  end if;
  insert into public.notifications(user_id,title,body) values(v_verification.recruiter_id,
    case when p_decision='approved' then 'Compte recruteur vérifié' else 'Mise à jour de votre vérification recruteur' end,
    case when p_decision='approved' then 'Votre entreprise est vérifiée. Vos offres en attente peuvent désormais être visibles et vous avez accès aux talents vérifiés par Nzela.'
      when p_decision='rejected' then 'Votre demande de vérification a été refusée. Consultez la note de l’administrateur et corrigez vos informations.'
      else 'Votre accès recruteur vérifié a été suspendu et vos offres sont temporairement masquées.' end);
  return v_verification;
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('verification-documents','verification-documents',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "recruiters upload own verification documents" on storage.objects;
create policy "recruiters upload own verification documents" on storage.objects for insert to authenticated
with check(bucket_id='verification-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and lower(storage.extension(name)) in('pdf','jpg','jpeg','png'));
drop policy if exists "recruiters read own verification documents" on storage.objects;
create policy "recruiters read own verification documents" on storage.objects for select to authenticated
using(bucket_id='verification-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_nzela_admin((select auth.uid()))));
drop policy if exists "recruiters delete own verification documents" on storage.objects;
create policy "recruiters delete own verification documents" on storage.objects for delete to authenticated
using(bucket_id='verification-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.protect_recruiter_verification_moderation()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$ begin
  if new.document_path is not null and split_part(new.document_path,'/',1)<>new.recruiter_id::text then raise exception 'INVALID_VERIFICATION_DOCUMENT_PATH'; end if;
  if new.professional_email is not null and new.professional_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'INVALID_PROFESSIONAL_EMAIL'; end if;
  if public.is_nzela_admin(auth.uid()) or coalesce(current_setting('request.jwt.claim.role',true),'')='service_role' then return new; end if;
  if tg_op='INSERT' then new.status:='pending';new.reviewed_at:=null;new.reviewed_by:=null;new.review_note:=null;
  else new.status:='pending';new.reviewed_at:=null;new.reviewed_by:=null;new.review_note:=null;new.recruiter_id:=old.recruiter_id;new.company_id:=old.company_id; end if;
  return new;
end; $$;
