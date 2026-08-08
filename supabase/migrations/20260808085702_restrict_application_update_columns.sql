revoke update on public.applications from authenticated;

grant update (
  status,
  application_opened,
  application_seen_at,
  cv_opened,
  cv_opened_at
) on public.applications to authenticated;
