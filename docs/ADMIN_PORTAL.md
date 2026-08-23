# Nzela Admin

Nzela Admin est une application d’administration séparée de l’expérience publique Nzela Jobs.

## Architecture

- même dépôt GitHub afin de partager les types, le client Supabase et les règles métier ;
- même projet Supabase afin que les KPI, offres, candidatures, utilisateurs et actions de modération soient les données réelles de la plateforme ;
- deux projets/déploiements Vercel distincts ;
- le site public ne monte aucun composant d’administration ;
- le déploiement admin rend uniquement `AdminPortal` lorsque `VITE_APP_MODE=admin`.

## Variables du projet Vercel Admin

```text
VITE_APP_MODE=admin
VITE_SUPABASE_URL=<même URL Supabase que Nzela Jobs>
VITE_SUPABASE_ANON_KEY=<même clé publique que Nzela Jobs>
```

Ne jamais exposer une clé `service_role` dans Vite ou dans le navigateur.

## Authentification et autorisation

Le portail utilise Supabase Auth. L’interface vérifie le rôle `admin` du profil ; les RPC administratifs et les politiques de base de données restent la frontière de sécurité côté serveur.

Le domaine du second déploiement doit être ajouté aux URL de redirection autorisées de Supabase Auth avant d’utiliser Google OAuth.

## Sources de données

Le tableau de bord consomme les RPC déjà utilisés par Nzela Jobs :

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

Les écrans n’utilisent donc pas de jeux de données de démonstration.

## Sections

- Vue d’ensemble
- Marketplace
- Utilisateurs
- Offres
- Vérifications recruteurs
- Trust & Safety
- Activité plateforme

## Vérification avant mise en production

1. Build public sans `VITE_APP_MODE`.
2. Build admin avec `VITE_APP_MODE=admin`.
3. Vérifier la connexion avec un compte admin.
4. Vérifier que les RPC renvoient les données du projet Supabase de production.
5. Tester une vérification recruteur et une décision Trust & Safety.
6. Vérifier que le site public ne contient aucun déclencheur ou overlay admin.
7. Lancer les contrôles sécurité et performance du dépôt.
