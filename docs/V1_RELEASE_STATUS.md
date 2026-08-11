# Nzela — état de préparation V1

## Validé

- architecture/navigation protégée contre les systèmes parallèles ;
- onboarding unique et persistant ;
- téléphone Congo +242 par défaut et validation E.164 ;
- candidatures uniques par candidat/offre ;
- droits de mise à jour des candidatures restreints ;
- messagerie Jobs + Immobilier testée sous RLS ;
- Nzela Talents : règle 30 jours, recherche recruteur vérifié, invitation ;
- Immobilier : vues uniques, favoris/demandes, messagerie ;
- dépendances npm : 0 vulnérabilité high lors du dernier build ;
- budget de performance initiale bloquant ;
- Trust & Safety backend actif ;
- KPI de santé marketplace backend actif ;
- aucune table publique sans RLS lors du dernier audit ;
- privilèges TRUNCATE / REFERENCES / TRIGGER retirés aux rôles Data API ;
- tâche d’expiration Talents retirée de l’API utilisateur.

## Tests release

- Jobs + Trust & Safety : 8/8 ;
- Talents : 7/7 ;
- Immobilier : 10/10 ;
- tests exécutés en transaction avec rollback.

## À publier côté frontend

- PR #29 : interface Trust & Safety ;
- PR #30 : onglet Marketplace du Centre de contrôle.

Les previews sont actuellement bloqués par la limite Vercel `api-deployments-free-per-day` (>100 déploiements gratuits sur la journée). Ne pas fusionner ces interfaces tant qu'un déploiement de contrôle n'est pas disponible.

## Point de sécurité externe restant

Le linter Supabase signale la protection contre les mots de passe compromis désactivée. La documentation Supabase indique que cette protection est réservée au plan Pro et supérieur. Ce point n'est donc pas un correctif SQL gratuit à activer sur le plan actuel ; maintenir au minimum une politique de mot de passe forte côté Auth/frontend.

## Priorité produit après publication V1

La dette principale devient la liquidité du marketplace : au dernier baseline, 4 offres publiques sur 17 avaient reçu au moins une candidature (23,5 %), et 13 offres n'en avaient reçu aucune. Le prochain travail prioritaire doit donc porter sur acquisition recruteurs/offres et candidats ciblés, pas sur l'ajout de nouvelles fonctionnalités.
