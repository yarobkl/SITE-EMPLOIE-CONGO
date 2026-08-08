-- Production contained one historical duplicate pair before this migration.
-- The production migration kept the latest row before creating this index.
-- Fresh environments do not contain that historical data, so only the durable
-- schema invariant is required here.

create unique index if not exists applications_candidate_job_uidx
  on public.applications(candidate_id, job_id)
  where candidate_id is not null;
