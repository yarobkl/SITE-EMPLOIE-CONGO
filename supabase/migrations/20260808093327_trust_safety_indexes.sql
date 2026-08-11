create index if not exists job_reports_reporter_id_idx
  on public.job_reports(reporter_id);

create index if not exists job_reports_reviewed_by_idx
  on public.job_reports(reviewed_by)
  where reviewed_by is not null;

create index if not exists jobs_moderation_reviewed_by_idx
  on public.jobs(moderation_reviewed_by)
  where moderation_reviewed_by is not null;

create index if not exists job_reports_open_queue_idx
  on public.job_reports(job_id, created_at desc)
  where status = 'open';

create index if not exists jobs_moderation_queue_idx
  on public.jobs(moderation_status, created_at desc)
  where moderation_status <> 'approved';
