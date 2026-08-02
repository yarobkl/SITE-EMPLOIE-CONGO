# Audit conformité — Nzela Jobs

**Date :** 2 août 2026  
**Responsable du projet :** Rodrin Bakala Mouengue  
**Périmètre :** application React/Vite, dépôt GitHub, authentification Supabase, base PostgreSQL, stockage des CV, candidatures et messagerie.

## 1. Cadre retenu

Le projet est audité au regard de la loi congolaise n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel, de la création de l’autorité nationale de contrôle en 2025, et des obligations sectorielles à clarifier avec l’Agence congolaise pour l’emploi.

Sources officielles principales :

- Journal officiel n° 45-2019 : `https://www.sgg.cg/JO/2019/congo-jo-2019-45.pdf`
- Journal officiel n° 15-2025 : `https://www.sgg.cg/JO/2025/congo-jo-2025-15.pdf`
- ACPE : `https://www.acpe.cg`

## 2. Données effectivement présentes au moment de l’audit

La base n’est plus une base vide de démonstration. Elle contenait au moment du contrôle :

- 12 comptes Supabase Auth ;
- 11 profils ;
- 18 entreprises ;
- 17 offres ;
- 10 candidatures ;
- 15 fichiers dans le bucket privé `cvs` ;
- 2 conversations et 5 messages ;
- 26 notifications ;
- 7 offres sauvegardées.

Aucune donnée n’a été supprimée durant l’audit. Toutes les données sont traitées comme potentiellement réelles.

## 3. État positif déjà constaté

- RLS activée sur toutes les tables métier publiques.
- Bucket `cvs` privé.
- Fichiers limités aux PDF de 2 Mo.
- CV candidats rangés dans un dossier lié à l’identifiant utilisateur.
- Accès recruteur aux CV conditionné à la propriété de l’offre.
- Liens de consultation des CV signés et temporaires.
- Durée technique de conservation des CV déjà fixée à douze mois dans la base.
- Séparation des rôles candidat, recruteur et administrateur.
- Suivi des dates d’ouverture des candidatures et des CV.

## 4. Risques critiques identifiés

### C-01 — Absence de mentions légales et de politique de confidentialité accessibles

**État initial :** aucune page ou composant juridique trouvé dans le dépôt.  
**Action :** ajout d’un centre juridique intégré comprenant confidentialité, CGU, mentions légales, cookies et exercice des droits.

### C-02 — Absence de preuve de prise de connaissance et de consentement

**État initial :** création de compte et candidature possibles sans dispositif juridique visible.  
**Action :** ajout de cases obligatoires séparées pour la création de compte et la transmission du CV, plus une option marketing facultative et décochée.

### C-03 — Absence de procédure d’exercice des droits

**État initial :** aucun mécanisme structuré d’accès, rectification, suppression, opposition ou portabilité.  
**Action :** création des tables `privacy_requests` et `consent_records`, d’un formulaire utilisateur et d’un export JSON des données accessibles par le compte.

### C-04 — Politique RLS de création de conversations incorrecte

La politique `participants create message threads` contenait plusieurs comparaisons d’une colonne avec elle-même, par exemple `a.job_id = a.job_id`. Cette rédaction réduisait la valeur du contrôle relationnel.

**Action appliquée en production :** remplacement par une vérification stricte entre la candidature, l’offre, l’entreprise, le candidat et le propriétaire recruteur.

### C-05 — Fonction trigger exposée comme RPC

La fonction `notify_primary_recruiter_on_application()` était exécutable par les rôles `anon` et `authenticated` alors qu’elle doit uniquement être appelée par un trigger.

**Action appliquée en production :** révocation du droit `EXECUTE` pour `public`, `anon` et `authenticated`.

## 5. Risques importants encore ouverts

### I-01 — Protection contre les mots de passe compromis désactivée

Le conseiller sécurité Supabase signale que la protection contre les mots de passe compromis est désactivée. Cette option doit être activée dans Supabase Auth avant une ouverture large.

### I-02 — Fonctions `SECURITY DEFINER` exposées aux utilisateurs connectés

Plusieurs fonctions administratives sont appelables par le rôle `authenticated`. Elles contiennent actuellement un contrôle interne `private.is_primary_recruiter()`, ce qui réduit le risque, mais leur exposition doit rester documentée et testée après chaque évolution.

### I-03 — Candidatures rapides anonymes

Le site autorise un dépôt de CV sans compte. Le bucket est privé et limité, mais un utilisateur anonyme peut créer un fichier orphelin s’il abandonne avant l’insertion de la candidature.

Actions nécessaires :

- nettoyage automatique des fichiers `quick/` sans candidature associée ;
- limitation de fréquence côté serveur ;
- protection anti-robot ;
- contrôle des fichiers expirés.

### I-04 — Transferts internationaux

Supabase est actuellement configuré dans la région `eu-west-3` en France et l’application est hébergée par Vercel. La loi congolaise qualifie de pays tiers les États hors CEMAC/CEEAC.

Actions nécessaires :

- documenter les sous-traitants et leurs sous-traitants ultérieurs ;
- conserver les accords de traitement des données ;
- saisir l’autorité congolaise compétente sur le mécanisme applicable ;
- indiquer les transferts dans la déclaration et la politique de confidentialité.

### I-05 — Exploitant non encore immatriculé

Le propriétaire du produit est identifié, mais la forme sociale, le RCCM, le NIU, l’adresse professionnelle et l’adresse électronique juridique ne sont pas encore fournis dans le projet.

Avant commercialisation générale, les mentions légales devront être complétées avec l’entité officiellement immatriculée.

### I-06 — Positionnement sectoriel vis-à-vis de l’ACPE

L’ACPE dispose désormais d’une plateforme complète et annonce une interconnexion avec les plateformes de mise en relation pour centraliser les offres.

Une demande écrite doit préciser :

- si Nzela Jobs relève d’une simple plateforme technologique ou d’un intermédiaire privé de placement ;
- si un agrément ou une déclaration sectorielle est requis ;
- si les offres doivent être transmises ou interconnectées avec l’ACPE ;
- quelles fonctions sont réservées à l’ACPE, notamment validation, visa et contractualisation.

## 6. Modifications techniques réalisées

Migration Supabase `data_protection_compliance` appliquée le 2 août 2026 :

- ajout des champs de version juridique et de consentement aux profils ;
- création de `consent_records` ;
- création de `privacy_requests` avec échéance de trente jours ;
- politiques RLS dédiées ;
- correction de la politique de création des conversations ;
- révocation de l’exécution publique de la fonction trigger de notification.

Branche GitHub : `compliance/nzela-legal-20260802`

Composant ajouté : `src/PrivacyComplianceExperience.jsx`

Fonctions proposées dans l’interface :

- politique de confidentialité ;
- CGU ;
- mentions légales ;
- politique cookies et stockage local ;
- consentement à l’inscription ;
- consentement à la transmission du CV ;
- consentement marketing séparé ;
- enregistrement des versions juridiques ;
- export des données du compte ;
- demande d’accès, rectification, suppression, opposition, portabilité ou retrait.

## 7. Conditions avant fusion et ouverture publique

1. Tester la branche sur une URL de prévisualisation.
2. Vérifier visuellement les formulaires de création de compte et de candidature sur mobile et ordinateur.
3. Tester les politiques RLS avec un candidat, un recruteur et un compte non connecté.
4. Activer la protection Supabase contre les mots de passe compromis.
5. Créer une adresse professionnelle dédiée aux données personnelles.
6. Compléter l’identité juridique de l’exploitant.
7. Déposer la demande d’orientation auprès de l’ACPE.
8. Obtenir la procédure officielle de déclaration auprès de l’autorité des données.
9. Documenter les contrats Supabase et Vercel.
10. Mettre en place le nettoyage des CV anonymes et expirés.

## 8. Statut global

**Statut actuel : bêta contrôlée — conformité en cours.**

Le projet dispose désormais d’un socle technique de conformité, mais il ne doit pas être présenté comme définitivement conforme ou officiellement agréé tant que les formalités administratives, la structure juridique et les tests de la branche ne sont pas achevés.
