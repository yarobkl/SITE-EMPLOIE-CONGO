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

create table if not exists public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  session_key text not null,
  created_at timestamptz not null default now(),
  unique(job_id, session_key)
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
alter table public.job_views enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.companies, public.jobs to anon, authenticated;
grant insert on public.companies, public.jobs, public.applications to anon, authenticated;
grant insert, select on public.job_views to anon, authenticated;
grant update, delete on public.jobs to authenticated;
grant update on public.companies to authenticated;
grant select, update on public.applications to authenticated;
grant insert on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_jobs, public.notifications to authenticated;
grant select, update on public.profiles to authenticated;

create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

create policy "jobs are public" on public.jobs
  for select using (status = 'published');

create policy "companies are public" on public.companies
  for select using (true);

create policy "recruiters create own companies" on public.companies
  for insert with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('recruteur', 'admin')
    )
  );

create policy "recruiters update own companies" on public.companies
  for update using (auth.uid() = owner_id);

create policy "recruiters publish own jobs" on public.jobs
  for insert with check (
    status = 'published'
    and exists (
      select 1 from public.companies
      join public.profiles on profiles.id = companies.owner_id
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
      and profiles.role in ('recruteur', 'admin')
    )
  );

create policy "recruiters update own jobs" on public.jobs
  for update using (
    exists (
      select 1 from public.companies
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters delete own jobs" on public.jobs
  for delete using (
    exists (
      select 1 from public.companies
      where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "candidates create applications" on public.applications
  for insert with check (auth.uid() = candidate_id or candidate_id is null);

create policy "candidates read own applications" on public.applications
  for select using (auth.uid() = candidate_id);

create policy "recruiters read received applications" on public.applications
  for select using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = applications.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "recruiters update received applications" on public.applications
  for update using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = applications.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "saved jobs own access" on public.saved_jobs
  for all using (auth.uid() = candidate_id) with check (auth.uid() = candidate_id);

create policy "recruiters read saved jobs for own jobs" on public.saved_jobs
  for select using (
    exists (
      select 1 from public.jobs
      join public.companies on companies.id = jobs.company_id
      where jobs.id = saved_jobs.job_id
      and companies.owner_id = auth.uid()
    )
  );

create policy "job views insert public" on public.job_views
  for insert with check (true);

create policy "job views read public" on public.job_views
  for select using (true);

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

create policy "recruiters read candidate cv pdf" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and exists (
      select 1
      from public.applications
      join public.jobs on jobs.id = applications.job_id
      join public.companies on companies.id = jobs.company_id
      where applications.cv_url = storage.objects.name
      and companies.owner_id = auth.uid()
    )
  );

create policy "quick applicants upload cv pdf" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = 'public'
  );
