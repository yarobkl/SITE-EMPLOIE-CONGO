revoke execute on function public.expire_job_seeker_posts() from public, anon, authenticated;

-- Cette tâche de maintenance reste exécutable par son propriétaire / les traitements serveur.
-- Les fonctions admin SECURITY DEFINER peuvent toujours l’appeler avec les privilèges du propriétaire.
