# CONGOEMPLOI

Plateforme mobile-first de recrutement pour le Congo: recherche d'offres, candidature avec CV PDF, suivi candidat et espace recruteur.

## Production

- Site: https://site-emploie-congo.vercel.app
- Frontend: React, Vite, Tailwind CSS
- Backend: Supabase Auth, Database, Storage
- Deploiement: Vercel

## Fonctionnalites

- Offres chargees depuis Supabase.
- Inscription et connexion reelles par email/mot de passe.
- Profil candidat ou recruteur.
- Candidature suivie avec compte connecte.
- Candidature rapide avec CV PDF, sans suivi temps reel.
- CV PDF limite a 2 Mo via Supabase Storage.
- Favoris synchronises par utilisateur connecte.
- Tableau recruteur base sur les offres publiees par le recruteur.
- Candidatures recues visibles par le recruteur proprietaire de l'offre.
- Ouverture du CV via URL signee Supabase.
- Notifications candidat quand une demande ou un CV est ouvert.

## Installation

```bash
npm ci
npm run dev
```

## Build

```bash
npm run check
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` en local, puis renseigner les memes variables dans Vercel:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Base de donnees

Les fichiers SQL situes directement dans `supabase/` documentent l'historique du
projet. Ils ne doivent pas etre rejoues individuellement sur une base existante.

Les changements de production sont versionnes dans `supabase/migrations/` et
doivent etre appliques dans l'ordre. Les migrations maintiennent notamment:

- les droits d'ecriture limites par les politiques RLS;
- la confidentialite des CV du bucket prive `cvs`;
- l'immutabilite des informations d'une candidature apres son envoi;
- les limites de taille des contenus publics;
- les index necessaires aux parcours candidat et recruteur.

Avant toute migration, executer `npm run check` et valider le SQL dans une
transaction annulee ou sur une branche Supabase.
