create or replace function public.is_nzela_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$$;

revoke all on function public.is_nzela_admin(uuid) from public, anon;
grant execute on function public.is_nzela_admin(uuid) to authenticated;
