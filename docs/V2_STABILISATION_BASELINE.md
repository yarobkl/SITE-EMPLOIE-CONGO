# Nzela V2 — baseline de stabilisation

Date de départ : 2026-10-01

## Objectif

Stabiliser la plateforme existante avant toute nouvelle fonctionnalité. La V2 ne repart pas de zéro : elle consolide les parcours déjà présents et réduit les responsabilités parallèles.

## Sources de vérité confirmées

- Navigation primaire : `App.jsx` + `MobilePlatformShell.jsx`.
- Swipe mobile et bottom navigation : `MobilePlatformShell.jsx` uniquement.
- Onboarding : `OnboardingReliabilityExperience.jsx` uniquement.
- Données métier persistantes : Supabase.
- Améliorations différées : `DeferredPlatformEnhancements.jsx`.
- Administration : `NzelaAdminPortal.jsx`, chargée séparément du site public.

## Implémentations actives à conserver pendant la stabilisation

- `MessagingCenterV2.jsx`
- `GlobalApplicationsCenterV2.jsx`
- `JobViewCounterExperience.jsx`
- `RealEstateExperienceStable.jsx`
- `OnboardingReliabilityExperience.jsx`
- `MobilePlatformShell.jsx`

Les anciennes variantes ne doivent pas être supprimées avant vérification de toutes leurs références et d'un build/test de non-régression.

## Ordre de travail

1. Navigation, swipe et deep links.
2. Authentification et onboarding unique.
3. Messagerie et candidatures.
4. Compteur de vues et publications.
5. Immobilier.
6. Admin et permissions.
7. Tests mobile, desktop et iOS.
8. Suppression contrôlée du code legacy devenu réellement inutilisé.

## Parcours de recette obligatoires

- inscription → onboarding → reconnexion ;
- connexion Google/Apple/email → profil ;
- accueil → offre → candidature → suivi ;
- recruteur → candidatures reçues → conversation ;
- emploi ↔ immobilier ↔ profil par tap et swipe ;
- annonce immobilière → favori → demande → conversation ;
- déconnexion → reconnexion ;
- accès admin séparé du site public.

## Règle de livraison

Aucun nettoyage destructif ni nouvelle fonctionnalité ne doit être fusionné dans `main` tant que les parcours concernés n'ont pas passé le build, les garde-fous d'architecture et une recette fonctionnelle.
