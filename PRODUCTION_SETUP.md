# CONGOEMPLOI - verification production

Ce document sert a remettre la connexion Google, Supabase et les fichiers CV au propre en production.

## 1. Variables Vercel obligatoires

Dans Vercel, projet `site-emploie-congo`, verifier que ces variables existent en Production, Preview et Development :

```txt
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Sans ces deux valeurs, la connexion, les candidatures, les CV et les offres de
production sont indisponibles. L'application ne simule pas ces donnees en local.

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

Verifier que les migrations de `supabase/migrations/` sont appliquees dans
l'ordre. Ne pas rejouer les anciens scripts SQL situes directement dans
`supabase/` sur une base de production existante.

Le bucket Storage `cvs` doit exister. Les CV doivent etre des PDF et respecter la limite affichee dans l'application.

Dans Authentication > Attack Protection, activer la protection contre les mots
de passe compromis quand elle est disponible sur le forfait du projet.

## 5. Test de recette

1. Connexion Google candidat.
2. Connexion Google recruteur.
3. Creation d'une offre recruteur.
4. Candidature avec CV PDF.
5. Ouverture et telechargement du CV cote recruteur.
6. Decision recruteur: en etude, retenue et refusee.
7. Verification du suivi et des notifications cote candidat.

Si l'un de ces points echoue, verifier d'abord les variables Vercel puis les URLs Supabase/Google.
