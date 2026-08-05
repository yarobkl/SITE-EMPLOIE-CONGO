# Nzela Talents — marché de l’emploi à double sens

## Fonctionnement livré

### Candidat

- connexion obligatoire ;
- onboarding bloquant après connexion Google ou email si le téléphone et le quartier ne sont pas complétés ;
- quartier sélectionné dans une liste structurée de Brazzaville, classée par arrondissement ;
- option `Autre quartier` avec saisie libre ;
- une seule demande d’emploi publiée par période de 30 jours ;
- modification autorisée pendant la période active ;
- archivage automatique après expiration ;
- historique des demandes ;
- candidatures aux offres d’emploi toujours illimitées ;
- visibilité du téléphone choisie par le candidat ;
- réception des invitations envoyées par les recruteurs.

### Recruteur

- accès aux demandes d’emploi réservé aux recruteurs vérifiés ;
- recherche libre par métier, compétence, secteur et quartier ;
- rapprochement automatique entre une offre publiée et les demandes actives ;
- affichage des dix meilleurs profils compatibles ;
- score détaillé : métier, compétences, expérience, localisation, contrat, disponibilité et formation ;
- invitation directe d’un candidat sur une offre ;
- notification automatique du candidat.

### Administrateur

- nombre de demandeurs actifs ;
- profils complets ;
- recruteurs vérifiés ;
- invitations envoyées ;
- répartition des inscrits et demandeurs actifs par quartier ;
- comparaison entre demandes actives et offres actives par métier ;
- données agrégées, sans publication publique des numéros de téléphone.

## Installation Supabase

Exécuter dans l’éditeur SQL Supabase :

```sql
-- supabase/talent-marketplace.sql
```

La migration est additive : elle conserve les tables et parcours existants, puis ajoute les localisations, profils professionnels, demandes d’emploi, scores de matching, vérifications et invitations.

## Règle métier essentielle

La limite mensuelle concerne exclusivement la publication personnelle du candidat :

- `1` demande d’emploi active par candidat sur une période de `30 jours` ;
- nombre de candidatures envoyées aux offres : illimité.

## Expiration

Les demandes dont `expires_at` est dépassé sont exclues immédiatement de toutes les recherches et recommandations. La fonction `expire_job_seeker_posts()` les fait passer au statut `expired` et nettoie leurs anciens rapprochements.

Pour une exécution indépendante de toute visite utilisateur, programmer ensuite dans Supabase Cron :

```sql
select public.expire_job_seeker_posts();
```

Cadence recommandée : une fois par heure.

## Référentiel géographique

La table `locations` contient les arrondissements et principales zones/quartiers de Brazzaville. L’option `Autre quartier` garantit qu’un utilisateur n’est jamais bloqué lorsqu’une appellation locale manque. Les nouvelles appellations saisies peuvent ensuite être vérifiées et ajoutées au référentiel par l’administration Nzela.

## Déploiement progressif

1. appliquer la migration Supabase ;
2. déployer la branche applicative ;
3. vérifier un compte candidat et un compte recruteur ;
4. approuver une entreprise de test avec `companies.verified = true` ;
5. publier une demande candidat ;
6. publier ou sélectionner une offre recruteur ;
7. contrôler le Top 10, l’invitation et la notification ;
8. contrôler les statistiques administrateur.
