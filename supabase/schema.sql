create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'candidat' check (role in ('candidat', 'recruteur', 'admin')),
  nom text,
  prenom text,
  phone text,
  city text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  logo_url text,
  sector text,
  city text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text not null,
  location text not null,
  contract_type text not null,
  salary_range text,
  sector text,
  requirements text[] not null default '{}',
  status text not null default 'published' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete set null,
  nom text not null,
  email text not null,
  phone text not null,
  message text,
  cv_url text,
  cv_name text,
  cv_size integer,
  tracking_enabled boolean not null default false,
  application_opened boolean not null default false,
  cv_opened boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.notifications enable row level security;

create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

create policy "jobs are public" on public.jobs
  for select using (status = 'published');

create policy "companies are public" on public.companies
  for select using (true);

create policy "candidates create applications" on public.applications
  for insert with check (auth.uid() = candidate_id or candidate_id is null);

create policy "candidates read own applications" on public.applications
  for select using (auth.uid() = candidate_id);

create policy "saved jobs own access" on public.saved_jobs
  for all using (auth.uid() = candidate_id) with check (auth.uid() = candidate_id);

create policy "notifications own access" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 2097152, array['application/pdf'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "candidates upload own cv pdf" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "candidates read own cv pdf" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
