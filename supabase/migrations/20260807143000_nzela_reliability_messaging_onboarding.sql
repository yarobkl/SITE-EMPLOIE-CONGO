begin;

create or replace function public.complete_nzela_profile(
  p_phone text,
  p_phone_country text,
  p_city text,
  p_location_id bigint,
  p_other_quarter_name text,
  p_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_phone text := btrim(coalesce(p_phone, ''));
  v_country text := upper(btrim(coalesce(p_phone_country, '')));
  v_valid boolean := false;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_phone = '' then raise exception 'PHONE_REQUIRED'; end if;
  if v_country !~ '^[A-Z]{2}$' then raise exception 'PHONE_COUNTRY_INVALID'; end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'PHONE_INVALID'; end if;

  v_valid := case v_country
    when 'CG' then v_phone ~ '^\+2420[0-9]{8}$'
    when 'CD' then v_phone ~ '^\+243[0-9]{9}$'
    when 'CM' then v_phone ~ '^\+237[0-9]{9}$'
    when 'CI' then v_phone ~ '^\+225[0-9]{10}$'
    when 'SN' then v_phone ~ '^\+221[0-9]{9}$'
    when 'ML' then v_phone ~ '^\+223[0-9]{8}$'
    when 'BF' then v_phone ~ '^\+226[0-9]{8}$'
    when 'TG' then v_phone ~ '^\+228[0-9]{8}$'
    when 'BJ' then v_phone ~ '^\+229[0-9]{10}$'
    when 'AO' then v_phone ~ '^\+244[0-9]{9}$'
    when 'RW' then v_phone ~ '^\+250[0-9]{9}$'
    when 'KE' then v_phone ~ '^\+254[0-9]{9}$'
    when 'GH' then v_phone ~ '^\+233[0-9]{9}$'
    when 'NG' then v_phone ~ '^\+234[0-9]{10}$'
    when 'ZA' then v_phone ~ '^\+27[0-9]{9}$'
    when 'MA' then v_phone ~ '^\+212[0-9]{9}$'
    when 'DZ' then v_phone ~ '^\+213[0-9]{9}$'
    when 'TN' then v_phone ~ '^\+216[0-9]{8}$'
    when 'FR' then v_phone ~ '^\+33[0-9]{9}$'
    when 'BE' then v_phone ~ '^\+32[0-9]{9}$'
    when 'PT' then v_phone ~ '^\+351[0-9]{9}$'
    when 'ES' then v_phone ~ '^\+34[0-9]{9}$'
    when 'GB' then v_phone ~ '^\+44[0-9]{10}$'
    when 'US' then v_phone ~ '^\+1[0-9]{10}$'
    when 'CA' then v_phone ~ '^\+1[0-9]{10}$'
    else true
  end;

  if not v_valid then raise exception 'PHONE_INVALID'; end if;
  if coalesce(btrim(p_city), '') = '' then raise exception 'CITY_REQUIRED'; end if;
  if p_location_id is null and coalesce(btrim(p_other_quarter_name), '') = '' then raise exception 'QUARTER_REQUIRED'; end if;
  if p_role not in ('candidat', 'recruteur') then raise exception 'INVALID_ROLE'; end if;
  if p_location_id is not null and not exists (
    select 1 from public.locations l where l.id = p_location_id and l.active = true
  ) then raise exception 'INVALID_LOCATION'; end if;

  update public.profiles
  set phone = v_phone,
      phone_country = v_country,
      city = btrim(p_city),
      location_id = p_location_id,
      other_quarter_name = case when p_location_id is null then nullif(btrim(p_other_quarter_name), '') else null end,
      role = case when role = 'admin' then role else p_role end,
      role_confirmed_at = coalesce(role_confirmed_at, now()),
      updated_at = now()
  where id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then raise exception 'PROFILE_NOT_FOUND'; end if;
  return v_profile;
end;
$$;

grant execute on function public.complete_nzela_profile(text,text,text,bigint,text,text) to authenticated;

create or replace function private.sync_property_inquiry_messaging()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_property public.properties;
  v_thread public.message_threads;
  v_owner_name text;
begin
  if new.sender_id is null then return new; end if;

  select * into v_property from public.properties p where p.id = new.property_id;
  if v_property.id is null or v_property.owner_id is null or v_property.owner_id = new.sender_id then return new; end if;

  select coalesce(nullif(btrim(concat_ws(' ', p.prenom, p.nom)), ''), nullif(btrim(p.email), ''), 'Propriétaire')
    into v_owner_name
  from public.profiles p
  where p.id = v_property.owner_id;

  insert into public.message_threads (
    application_id, job_id, company_id, candidate_id, recruiter_id,
    candidate_name, company_name, job_title, context_type, property_id
  ) values (
    null, null, null, new.sender_id, v_property.owner_id,
    coalesce(nullif(btrim(new.full_name), ''), 'Visiteur'),
    coalesce(v_owner_name, 'Propriétaire'),
    coalesce(nullif(btrim(v_property.title), ''), 'Annonce immobilière'),
    'property', v_property.id
  )
  on conflict (property_id, candidate_id, recruiter_id) where context_type = 'property'
  do update set
    candidate_name = excluded.candidate_name,
    company_name = excluded.company_name,
    job_title = excluded.job_title,
    updated_at = now()
  returning * into v_thread;

  insert into public.messages (thread_id, sender_id, body, property_inquiry_id)
  values (v_thread.id, new.sender_id, btrim(new.message), new.id)
  on conflict (property_inquiry_id) where property_inquiry_id is not null do nothing;

  return new;
end;
$$;

revoke all on function private.sync_property_inquiry_messaging() from public, anon, authenticated;

drop trigger if exists property_inquiries_sync_messaging on public.property_inquiries;
create trigger property_inquiries_sync_messaging
after insert on public.property_inquiries
for each row execute function private.sync_property_inquiry_messaging();

create or replace function public.send_property_inquiry(
  p_property_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_request_visit boolean,
  p_preferred_visit_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_property public.properties;
  v_inquiry public.property_inquiries;
  v_thread_id uuid;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'FULL_NAME_INVALID'; end if;
  if nullif(btrim(p_email), '') is null and nullif(btrim(p_phone), '') is null then raise exception 'CONTACT_REQUIRED'; end if;
  if nullif(btrim(p_email), '') is not null and char_length(btrim(p_email)) not between 3 and 320 then raise exception 'EMAIL_INVALID'; end if;
  if nullif(btrim(p_phone), '') is not null and char_length(btrim(p_phone)) not between 5 and 40 then raise exception 'PHONE_INVALID'; end if;
  if char_length(v_message) < 5 or char_length(v_message) > 2000 then raise exception 'MESSAGE_INVALID'; end if;

  select * into v_property
  from public.properties p
  where p.id = p_property_id
    and p.status = 'published'
    and p.moderation_status <> 'blocked'
    and coalesce(p.expires_at, now() + interval '1 day') > now();
  if v_property.id is null then raise exception 'PROPERTY_UNAVAILABLE'; end if;
  if v_property.owner_id = v_user_id then raise exception 'PROPERTY_OWNER_CANNOT_INQUIRE'; end if;

  insert into public.property_inquiries (
    property_id, sender_id, full_name, email, phone, message, request_visit, preferred_visit_at
  ) values (
    p_property_id, v_user_id, v_name, nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''),
    v_message, coalesce(p_request_visit, false),
    case when coalesce(p_request_visit, false) then p_preferred_visit_at else null end
  ) returning * into v_inquiry;

  select t.id into v_thread_id
  from public.message_threads t
  where t.context_type = 'property'
    and t.property_id = p_property_id
    and t.candidate_id = v_user_id
    and t.recruiter_id = v_property.owner_id
  order by t.created_at desc
  limit 1;

  return v_thread_id;
end;
$$;

grant execute on function public.send_property_inquiry(uuid,text,text,text,text,boolean,timestamptz) to authenticated;

-- Rattrape les demandes authentifiées créées avant le trigger, sans dupliquer celles déjà liées.
alter table public.messages disable trigger messages_prepare_insert;

do $$
declare
  r record;
  v_thread public.message_threads;
  v_owner_name text;
begin
  for r in
    select pi.*, p.owner_id, p.title
    from public.property_inquiries pi
    join public.properties p on p.id = pi.property_id
    where pi.sender_id is not null
      and pi.sender_id <> p.owner_id
      and not exists (select 1 from public.messages m where m.property_inquiry_id = pi.id)
  loop
    select coalesce(nullif(btrim(concat_ws(' ', pr.prenom, pr.nom)), ''), nullif(btrim(pr.email), ''), 'Propriétaire')
      into v_owner_name from public.profiles pr where pr.id = r.owner_id;

    insert into public.message_threads (
      application_id, job_id, company_id, candidate_id, recruiter_id,
      candidate_name, company_name, job_title, context_type, property_id
    ) values (
      null, null, null, r.sender_id, r.owner_id,
      coalesce(nullif(btrim(r.full_name), ''), 'Visiteur'),
      coalesce(v_owner_name, 'Propriétaire'),
      coalesce(nullif(btrim(r.title), ''), 'Annonce immobilière'),
      'property', r.property_id
    )
    on conflict (property_id, candidate_id, recruiter_id) where context_type = 'property'
    do update set
      candidate_name = excluded.candidate_name,
      company_name = excluded.company_name,
      job_title = excluded.job_title,
      updated_at = now()
    returning * into v_thread;

    insert into public.messages (thread_id, sender_id, body, property_inquiry_id)
    values (v_thread.id, r.sender_id, btrim(r.message), r.id)
    on conflict (property_inquiry_id) where property_inquiry_id is not null do nothing;
  end loop;
end;
$$;

alter table public.messages enable trigger messages_prepare_insert;

commit;
