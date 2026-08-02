# Audit conformité — Nzela Jobs

**Date :** 2 août 2026  
**Responsable du projet :** Rodrin Bakala Mouengue  
**Périmètre :** application React/Vite, dépôt GitHub, Supabase Auth, PostgreSQL, stockage des CV, candidatures et messagerie.

## Cadre retenu

Le projet est audité au regard de la loi congolaise n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel, des textes créant l’autorité nationale de contrôle en 2025 et des obligations sectorielles à clarifier avec l’Agence Congolaise Pour l’Emploi.

Sources officielles :

- `https://www.sgg.cg/JO/2019/congo-jo-2019-45.pdf`
- `https://www.sgg.cg/JO/2025/congo-jo-2025-15.pdf`
- `https://www.acpe.cg`

## Données présentes au moment de l’audit

La base contenait :

- 12 comptes Supabase Auth ;
- 11 profils ;
- 18 entreprises ;
- 17 offres ;
- 10 candidatures ;
- 15 fichiers dans le bucket privé `cvs` ;
- 2 conversations et 5 messages ;
- 26 notifications ;
- 7 offres sauvegardées.

Aucune donnée n’a été supprimée. Toutes les données sont considérées comme potentiellement réelles.

## Protections déjà en place

- RLS activée sur les tables métier publiques ;
- bucket `cvs` privé ;
- PDF uniquement, taille maximale 2 Mo ;
- accès candidat à son propre CV ;
- accès recruteur conditionné à la propriété de l’offre ;
- liens de consultation signés et temporaires ;
- échéance technique de conservation des CV fixée à douze mois ;
- séparation candidat, recruteur et administrateur.

## Corrections critiques appliquées

### Politique de création des conversations

L’ancienne politique comportait des comparaisons réflexives telles que `a.job_id = a.job_id`. Elle a été remplacée par une vérification stricte entre la candidature, l’offre, l’entreprise, le candidat et le propriétaire recruteur.

### Fonction trigger exposée comme RPC

`notify_primary_recruiter_on_application()` était exécutable par `anon` et `authenticated`. Les droits d’exécution publique ont été révoqués.

### Preuve juridique et exercice des droits

Création de :

- `consent_records` ;
- `privacy_requests` avec échéance de trente jours ;
- champs de version juridique et de consentement sur `profiles` ;
- politiques RLS dédiées ;
- politique de confidentialité, CGU, mentions légales et information cookies ;
- consentement obligatoire à l’inscription et à la transmission d’un CV ;
- consentement marketing séparé et facultatif ;
- export des données accessibles au compte ;
- formulaire d’accès, rectification, suppression, opposition, portabilité et retrait.

Migration appliquée en production : `data_protection_compliance`.

## Risques encore ouverts

1. **Protection contre les mots de passe compromis désactivée** dans Supabase Auth : activation manuelle nécessaire.
2. **Fonctions `SECURITY DEFINER` accessibles au rôle connecté** : elles possèdent des contrôles internes, mais doivent être testées et revues régulièrement.
3. **Candidatures rapides anonymes** : prévoir anti-robot, limitation de fréquence et nettoyage des fichiers `quick/` orphelins.
4. **Transferts internationaux** : Supabase est en `eu-west-3` et Vercel utilise une infrastructure distribuée ; les contrats, sous-traitants et flux doivent être documentés et déclarés selon la procédure officielle.
5. **Exploitant non encore immatriculé** : compléter RCCM, NIU, adresse professionnelle et contact juridique avant commercialisation générale.
6. **Statut auprès de l’ACPE** : obtenir une réponse écrite sur l’agrément, la déclaration, l’interconnexion et la qualification éventuelle d’intermédiaire privé de placement.
7. **Autorité des données** : confirmer l’adresse officielle et déposer le dossier de déclaration/autorisation et de transfert.

## Conditions avant fusion et ouverture large

- compilation automatique réussie ;
- contrôle visuel ordinateur et mobile ;
- tests RLS avec candidat, recruteur et utilisateur anonyme ;
- activation de la protection des mots de passe compromis ;
- création d’une adresse professionnelle dédiée à la protection des données ;
- finalisation de l’identité juridique de l’exploitant ;
- saisine de l’ACPE ;
- saisine de l’autorité de protection des données ;
- documentation des accords Supabase et Vercel ;
- automatisation de la purge des CV anonymes orphelins et des CV expirés.

## Statut global

**Bêta contrôlée — conformité en cours.**

Le projet dispose d’un socle technique et documentaire renforcé, mais ne doit pas être présenté comme définitivement conforme ou officiellement agréé avant l’achèvement des formalités et des tests.
