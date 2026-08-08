# Nzela — garde-fous d’architecture

## Pourquoi ce document existe

Nzela a évolué rapidement : emploi, candidatures, talents, immobilier, messagerie, onboarding, statistiques et navigation mobile. Plusieurs couches d’amélioration ont été ajoutées autour d’`App.jsx`.

Le risque principal n’est plus le manque de fonctionnalités, mais la multiplication de sources de vérité qui peuvent se désynchroniser.

Ce document fixe les règles à respecter pendant la phase de stabilisation.

## Navigation primaire : source de vérité

Les quatre sections primaires sont, dans cet ordre :

1. Accueil (`home`)
2. Offres (`jobs`)
3. Immobilier (`immobilier`)
4. Profil (`profile`)

### Responsabilités actuelles

- `App.jsx` possède l’état de l’écran et décide de la section primaire active.
- `MobilePlatformShell.jsx` est l’unique propriétaire du pager tactile et de la bottom navigation mobile.
- `NavigationExperience.jsx` reste temporairement chargé des URLs profondes, du bouton retour et de plusieurs améliorations historiques. Il ne doit pas intercepter la bottom navigation du pager.
- `RealEstateExperienceStable.jsx` peut bloquer une sortie uniquement lorsqu’un formulaire immobilier non sauvegardé l’exige.

## Règle absolue

Ne jamais ajouter :

- une deuxième bottom navigation primaire ;
- un deuxième pager horizontal ;
- une nouvelle liste parallèle des quatre sections ;
- un routeur DOM supplémentaire qui clique artificiellement sur la bottom bar ;
- un `window.location.href` pour naviguer entre Accueil, Offres, Immobilier et Profil.

Toute nouvelle navigation primaire doit passer par le shell existant.

## État du swipe

Le swipe type application mobile existe déjà dans `MobilePlatformShell.jsx` :

- suivi direct du doigt ;
- verrouillage horizontal/vertical ;
- seuil de distance ;
- prise en compte de la vélocité ;
- rebond aux extrémités ;
- panneaux persistants ;
- synchronisation avec la bottom navigation ;
- exclusion des champs et zones horizontales interactives.

Le prochain travail sur le swipe doit donc être un travail de fiabilisation et de simplification, pas une nouvelle implémentation.

## Dette technique prioritaire

### P0 — navigation

`App.jsx` et `NavigationExperience.jsx` contiennent encore chacun leur registre de routes. C’est toléré temporairement pour préserver les deep links, mais la cible est un module de navigation partagé.

`NavigationExperience.jsx` utilise encore de la détection DOM et des clics synthétiques pour plusieurs parcours historiques. Il faut réduire progressivement son rôle aux URLs, métadonnées, historique et deep links.

### P0 — état métier

Supabase doit rester la source de vérité pour :

- profils ;
- offres ;
- candidatures ;
- messages ;
- annonces immobilières ;
- vues ;
- demandes de contact ;
- notifications persistantes.

Aucune nouvelle fonctionnalité critique ne doit être simulée uniquement avec un état React/localStorage.

### P1 — composants globaux

Les composants montés globalement dans `main.jsx` doivent être réévalués un par un. Une couche globale n’est conservée que si elle possède une responsabilité claire et non dupliquée.

Cible : diminuer progressivement le nombre de composants qui observent ou modifient le DOM global.

## Méthode de refactor

1. Ajouter un test/garde-fou avant de déplacer une responsabilité critique.
2. Déplacer une seule responsabilité à la fois.
3. Construire et tester les parcours concernés.
4. Déployer en preview.
5. Tester mobile et desktop.
6. Fusionner uniquement si aucun parcours critique ne régresse.

## Parcours critiques à protéger

- inscription → onboarding → reconnexion ;
- offre → candidature → suivi ;
- recruteur → candidature reçue → messagerie ;
- demande d’emploi → recherche talent → invitation ;
- annonce immobilière → vue → favori → demande → conversation ;
- navigation swipe → bottom bar → retour navigateur ;
- déconnexion/reconnexion sans perte de données.

## Contrôle automatique

`scripts/check-platform-architecture.mjs` vérifie actuellement que :

- `App` monte un seul `MobilePlatformShell` ;
- une seule bottom navigation primaire existe ;
- l’ordre Accueil → Offres → Immobilier → Profil reste stable ;
- `App` transmet bien l’état et la navigation au shell ;
- le routeur legacy ignore la bottom navigation du shell ;
- aucun troisième registre de routes primaires n’apparaît silencieusement.

Ce contrôle doit s’exécuter avant chaque build de production.
