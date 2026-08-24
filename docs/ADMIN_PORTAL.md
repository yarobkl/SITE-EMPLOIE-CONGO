# Nzela Admin

Nzela Admin est une application d’administration séparée de l’expérience publique Nzela Jobs.

## Architecture

- même dépôt GitHub afin de partager le client Supabase et les règles métier ;
- même projet Supabase `congoemploi` afin que les KPI, offres, candidatures, utilisateurs et actions de modération utilisent les données réelles de la plateforme ;
- deux déploiements Vercel distincts ;
- le site public ne monte aucun composant d’administration ;
- le déploiement admin rend uniquement `NzelaAdminPortal` lorsque `VITE_APP_MODE=admin`.

## Variables du projet Vercel Admin

```text
VITE_APP_MODE=admin
VITE_SUPABASE_URL=<même URL Supabase que Nzela Jobs>
VITE_SUPABASE_ANON_KEY=<même clé publique que Nzela Jobs>
```

Ne jamais exposer une clé `service_role` dans Vite ou dans le navigateur.

## Authentification et autorisation

Le portail utilise Supabase Auth. Après authentification, l’interface appelle `is_nzela_admin` pour déterminer l’accès au centre de contrôle. Aucun e-mail administrateur n’est prérempli ni utilisé comme contournement dans le client.

Les RPC administratifs et les politiques de base de données restent la frontière de sécurité côté serveur.

Le domaine du déploiement admin doit être ajouté aux URL de redirection autorisées de Supabase Auth avant d’utiliser Google OAuth.

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

- Vue d’ensemble : KPI, activité sur 7 jours, état temps réel, pipeline candidatures, santé marketplace, offres les plus performantes ;
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

## État production vérifié le 24/08/2026

Le projet Supabase `congoemploi` est `ACTIVE_HEALTHY`.

Baseline lue sans modification de données :

- 12 profils : 7 candidats, 4 recruteurs, 1 administrateur ;
- 18 offres : 17 publiées, 1 fermée ;
- 10 candidatures : 2 en attente, 4 en cours, 1 acceptée, 3 refusées ;
- 19 entreprises, dont 4 vérifiées ;
- 0 vérification recruteur en attente ;
- 0 signalement d’offre ouvert.

## Vérification avant mise en production

1. Build public sans `VITE_APP_MODE`.
2. Build admin avec `VITE_APP_MODE=admin`.
3. Vérifier la connexion avec le compte administrateur.
4. Vérifier que les RPC renvoient les données du projet Supabase de production.
5. Tester une vérification recruteur et une décision Trust & Safety avec un jeu de test contrôlé.
6. Vérifier que le site public ne contient aucun déclencheur ou overlay admin.
7. Lancer les contrôles sécurité et performance du dépôt.
8. Ajouter le domaine du déploiement admin aux redirect URLs Supabase avant Google OAuth.
