# CONGOEMPLOI - verification production

Ce document sert a remettre la connexion Google, Supabase et les fichiers CV au propre en production.

## 1. Variables Vercel obligatoires

Dans Vercel, projet `site-emploie-congo`, verifier que ces variables existent en Production, Preview et Development :

```txt
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Sans ces deux valeurs, la connexion, les candidatures, les CV et les donnees restent en mode local.

## 2. Supabase Auth

Dans Supabase, aller dans Authentication > URL Configuration :

```txt
Site URL
https://site-emploie-congo.vercel.app

Redirect URLs
https://site-emploie-congo.vercel.app
https://site-emploie-congo.vercel.app/*
http://localhost:5173
http://localhost:5173/*
http://127.0.0.1:5173
http://127.0.0.1:5173/*
```

## 3. Google OAuth

Dans Supabase, Authentication > Providers > Google :

- Google doit etre active.
- Client ID et Client Secret doivent etre renseignes.

Dans Google Cloud Console, client OAuth Web :

```txt
Authorized JavaScript origins
https://site-emploie-congo.vercel.app

Authorized redirect URI
https://<project-ref>.supabase.co/auth/v1/callback
```

Le redirect URI doit pointer vers Supabase, pas directement vers Vercel.

## 4. Base de donnees et CV

Dans Supabase SQL Editor, verifier que les scripts suivants ont bien ete appliques :

```txt
supabase/schema.sql
supabase/final-hardening.sql
supabase/recruiter-cv-access.sql
supabase/recruiter-offer-management.sql
supabase/nzela-v1-stability.sql
```

Le bucket Storage `cvs` doit exister. Les CV doivent etre des PDF et respecter la limite affichee dans l'application.

`supabase/nzela-v1-stability.sql` ajoute les champs de suivi candidat, les dates d'ouverture de demande/CV, la table `boost_requests`, les index utiles et durcit les regles Storage du bucket `cvs`.

## 5. Test de recette

1. Connexion Google candidat.
2. Connexion Google recruteur.
3. Creation d'une offre recruteur.
4. Candidature avec CV PDF.
5. Ouverture et telechargement du CV cote recruteur.
6. Verification du suivi cote candidat.

Si l'un de ces points echoue, verifier d'abord les variables Vercel puis les URLs Supabase/Google.
