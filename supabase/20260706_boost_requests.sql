create table if not exists public.boost_requests (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  reference text not null unique,
  plan text not null,
  amount integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.boost_requests enable row level security;
grant select, insert, update on public.boost_requests to authenticated;
