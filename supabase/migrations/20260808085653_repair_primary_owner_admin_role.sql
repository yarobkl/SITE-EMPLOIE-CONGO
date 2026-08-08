set local session_replication_role = replica;

update public.profiles p
set role='admin',
    role_confirmed_at=coalesce(role_confirmed_at,now()),
    updated_at=now()
where public.is_nzela_admin(p.id)
  and p.role <> 'admin'
  and exists (
    select 1 from public.companies c where c.owner_id=p.id
  );

set local session_replication_role = origin;
