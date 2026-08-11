revoke truncate, references, trigger on all tables in schema public from public, anon, authenticated;

alter default privileges in schema public
  revoke truncate, references, trigger on tables from public, anon, authenticated;

-- Le client Nzela n'a besoin que des privilèges DML explicitement accordés et contrôlés par RLS.
-- TRUNCATE contourne RLS et ne doit jamais être accessible aux rôles exposés par la Data API.
