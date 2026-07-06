-- Nzela Jobs - preparation des badges, de la mise en avant et de la sponsorisation
-- A executer dans Supabase SQL Editor quand tu veux activer les statuts en base.

alter table public.jobs
  add column if not exists is_urgent boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sponsored_until timestamptz,
  add column if not exists moderation_status text not null default 'published'
    check (moderation_status in ('pending', 'published', 'rejected')),
  add column if not exists published_at timestamptz not null default now();

create index if not exists jobs_public_listing_idx
  on public.jobs (status, moderation_status, is_featured desc, sponsored_until desc, published_at desc);

create index if not exists jobs_sponsored_until_idx
  on public.jobs (sponsored_until)
  where sponsored_until is not null;

comment on column public.jobs.is_urgent is 'Active le badge Urgent sur une offre.';
comment on column public.jobs.is_featured is 'Met une offre a la une, hors paiement ou apres validation admin.';
comment on column public.jobs.sponsored_until is 'Date de fin de sponsorisation payante.';
comment on column public.jobs.moderation_status is 'Statut de moderation avant affichage public.';
comment on column public.jobs.published_at is 'Date de publication utilisee pour le badge Nouveau et le tri.';
