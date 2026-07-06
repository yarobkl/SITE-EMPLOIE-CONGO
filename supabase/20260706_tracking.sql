alter table public.applications add column if not exists tracking_number text;
alter table public.applications add column if not exists application_seen_at timestamptz;
alter table public.applications add column if not exists cv_opened_at timestamptz;
alter table public.applications add column if not exists last_candidate_notice_at timestamptz;

create index if not exists applications_tracking_number_idx on public.applications(tracking_number);
