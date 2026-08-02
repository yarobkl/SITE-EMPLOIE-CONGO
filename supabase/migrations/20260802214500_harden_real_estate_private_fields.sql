begin;

revoke select on public.properties from anon, authenticated;
grant select (
  id, owner_id, title, description, listing_type, property_type, city, district,
  price, currency, deposit_amount, monthly_charges, rooms, bedrooms, bathrooms,
  area_sqm, furnished, water_available, electricity_available, parking, fenced,
  security_available, available_from, whatsapp_available, show_phone, status,
  moderation_status, published_at, expires_at, created_at, updated_at
) on public.properties to anon, authenticated;

create or replace function public.get_owned_properties()
returns setof jsonb
language sql
stable
security definer
set search_path = public, private
as $$
  select to_jsonb(p) || jsonb_build_object(
    'property_images',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'storage_path', pi.storage_path,
            'alt_text', pi.alt_text,
            'sort_order', pi.sort_order,
            'is_cover', pi.is_cover,
            'created_at', pi.created_at
          )
          order by pi.is_cover desc, pi.sort_order, pi.created_at
        )
        from public.property_images pi
        where pi.property_id = p.id
      ),
      '[]'::jsonb
    )
  )
  from public.properties p
  where p.owner_id = auth.uid() or private.is_primary_recruiter()
  order by p.created_at desc;
$$;

create or replace function public.get_property_public_contact(p_property_id uuid)
returns table(contact_phone text, whatsapp_available boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    case when p.show_phone then p.contact_phone else null end,
    case when p.show_phone then p.whatsapp_available else false end
  from public.properties p
  where p.id = p_property_id
    and p.status = 'published'
    and p.moderation_status <> 'blocked'
    and coalesce(p.expires_at, now() + interval '1 day') > now();
$$;

revoke all on function public.get_owned_properties() from public;
revoke all on function public.get_property_public_contact(uuid) from public;
grant execute on function public.get_owned_properties() to authenticated;
grant execute on function public.get_property_public_contact(uuid) to anon, authenticated;

commit;
