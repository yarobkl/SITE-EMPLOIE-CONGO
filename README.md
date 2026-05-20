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
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` en local, puis renseigner les memes variables dans Vercel:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Base de donnees

Pour une nouvelle base Supabase, executer:

```sql
-- supabase/schema.sql
```

Pour durcir une base deja creee pendant le developpement, executer ensuite:

```sql
-- supabase/final-hardening.sql
```

Le fichier `final-hardening.sql` retire les anciennes permissions de demonstration et active les regles finales:

- seules les entreprises du recruteur connecte peuvent publier ses offres;
- seules les candidatures recues sur ses offres sont visibles au recruteur;
- seuls le candidat et les recruteurs autorises peuvent ouvrir les CV selon le flux;
- les candidatures rapides restent possibles sans suivi temps reel.
