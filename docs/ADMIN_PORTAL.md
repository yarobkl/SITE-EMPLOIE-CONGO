# Nzela Admin

Nzela Admin est l’espace d’administration séparé de l’expérience publique Nzela Jobs.

## Architecture

- même dépôt GitHub afin de partager le client Supabase et les règles métier ;
- même projet Supabase `congoemploi` afin que les KPI, offres, candidatures, utilisateurs et actions de modération utilisent les données réelles de la plateforme ;
- projet Vercel public : `site-emploie-congo` ;
- projet Vercel admin dédié : `site-emploie-congo-6cqj` ;
- le projet admin monte automatiquement `NzelaAdminPortal` grâce à son hostname ;
- `VITE_APP_MODE=admin` reste disponible comme mode explicite ;
- `/admin` sert de route de contrôle/QA et monte également le portail admin ;
- le domaine public à la racine reste l’expérience Nzela Jobs normale.

## Authentification et autorisation

Le portail utilise Supabase Auth. Après authentification, l’interface appelle `is_nzela_admin` pour déterminer l’accès au centre de contrôle.

`is_nzela_admin` est durci côté base : l’identifiant fourni doit être celui de la session (`auth.uid()`) et le profil correspondant doit avoir le rôle `admin`. Les rôles `anon` et `public` n’ont pas le droit d’exécuter cette fonction.

Les RPC administratifs et les politiques de base de données restent la frontière de sécurité côté serveur. Aucun mot de passe, aucune clé `service_role` et aucun secret administrateur ne doivent être stockés dans le dépôt ou dans le bundle Vite.

Le domaine du déploiement admin doit être autorisé dans les redirect URLs Supabase Auth avant d’utiliser Google OAuth.

## Sources de données

Le tableau de bord consomme les RPC de production :

- `admin_platform_snapshot`
- `admin_marketplace_kpis`
- `admin_users_overview`
- `admin_jobs_overview`
- `admin_recent_activity`
- `admin_marketplace_jobs_at_risk`
- `admin_recruiter_verifications`
- `admin_job_moderation_queue`
- `admin_review_recruiter_verification`
- `admin_review_job_moderation`

Les écrans n’utilisent pas de jeux de données de démonstration.

## Sections

- Vue d’ensemble : KPI, activité sur 7 jours, état temps réel, pipeline candidatures, santé marketplace et offres les plus performantes ;
- Marketplace : couverture des offres, conversion, entreprises vérifiées et offres à risque ;
- Utilisateurs ;
- Offres ;
- Vérifications recruteurs ;
- Trust & Safety ;
- Activité plateforme.

## Synchronisation

Le centre de contrôle combine :

- chargement initial des RPC ;
- écoute Realtime sur les tables métier principales ;
- rafraîchissement de secours toutes les 30 secondes ;
- rafraîchissement manuel depuis l’en-tête ;
- affichage de l’heure de dernière synchronisation.

## Déploiement

Le script `scripts/vercel-ignore-build.mjs` laisse construire :

- le projet public principal ;
- le projet admin `site-emploie-congo-6cqj`.

Le projet historique `site-emploie-congo-v6d3` reste ignoré afin d’éviter les déploiements dupliqués inutiles.

Le build admin doit produire un chunk `NzelaAdminPortal-*` et passer l’audit npm, le contrôle d’architecture et le budget de bundle avant déploiement.

## Vérification avant production

1. Build public et admin réussis.
2. Vérifier que le projet admin dédié est `READY` et non `CANCELED`.
3. Vérifier la connexion avec un compte Supabase dont le profil est `admin`.
4. Vérifier que les RPC renvoient les données du projet `congoemploi`.
5. Vérifier que les comptes non administrateurs sont refusés.
6. Tester les actions de vérification/modération uniquement lorsqu’un cas de test contrôlé existe.
7. Vérifier que le domaine public racine n’ouvre pas l’admin.
8. Ajouter le domaine admin aux redirect URLs Supabase avant Google OAuth.
