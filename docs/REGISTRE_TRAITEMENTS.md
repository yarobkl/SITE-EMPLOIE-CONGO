# Registre des activités de traitement — Nzela Jobs

**Version :** 2026-08-02-v1  
**Responsable du traitement pendant la phase de structuration :** Rodrin Bakala Mouengue, fondateur et porteur du projet Nzela Jobs.

## Prestataires techniques identifiés

| Prestataire | Service | Localisation principale connue | Données concernées |
|---|---|---|---|
| Supabase | Authentification, PostgreSQL, stockage CV, API | Projet en `eu-west-3`, Paris | Comptes, profils, CV, candidatures, messages, journaux |
| Vercel | Hébergement et diffusion de l’application | Infrastructure distribuée | Requêtes web, IP et journaux techniques |
| GitHub | Code source et gestion des changements | Infrastructure GitHub | Code et documentation, sans stockage volontaire de CV |

Pour chaque prestataire, archiver les conditions contractuelles, le DPA, la liste des sous-traitants, les régions utilisées, les mesures de sécurité et les règles de suppression.

## T-01 — Comptes et authentification

- **Personnes :** candidats, recruteurs et administrateurs.
- **Données :** UUID, email, rôle, dates de création/connexion, sessions et facteurs d’authentification.
- **Finalité :** créer, authentifier et sécuriser les comptes.
- **Base :** exécution du service et sécurité.
- **Destinataires :** utilisateur, administrateurs habilités, Supabase.
- **Conservation :** durée du compte, puis suppression/anonymisation sous réserve des obligations de preuve.

## T-02 — Profils

- **Données :** nom, prénom, email, téléphone, ville, titre professionnel, rôle.
- **Finalité :** personnaliser le compte et préremplir les parcours.
- **Destinataires :** personne concernée, recruteur dans le cadre autorisé, administrateur habilité.
- **Droits :** accès, rectification, export, suppression et opposition.

## T-03 — Entreprises et offres

- **Données :** entreprise, propriétaire du compte, secteur, ville, logo, contenu et statistiques des offres.
- **Finalité :** publier, gérer, modérer et mesurer les offres.
- **Destinataires :** public pour les offres publiées, propriétaire et administrateur habilité.

## T-04 — Candidatures et CV

- **Données :** nom, email, téléphone, message, CV PDF, offre, statut, référence et dates de consultation.
- **Finalité :** transmettre la candidature au recruteur concerné et assurer son suivi.
- **Base :** mesures précontractuelles demandées par le candidat et accord explicite de transmission.
- **Destinataires :** candidat, recruteur propriétaire de l’offre, administrateur strictement habilité.
- **Conservation :** CV douze mois à compter de la candidature ; autres données selon le suivi et les obligations de preuve.
- **Sécurité :** bucket privé, PDF 2 Mo, chemin contrôlé, URL signée cinq minutes et RLS.

## T-05 — Favoris et vues

- **Données :** candidat ou session aléatoire, offre et date.
- **Finalité :** favoris et mesure de l’intérêt.
- **Destinataires :** utilisateur ; recruteur pour les statistiques de ses offres ; administrateur habilité.
- **Action restante :** définir l’anonymisation des historiques anciens.

## T-06 — Messagerie

- **Données :** participants, candidature, offre, contenu, date et lecture.
- **Finalité :** échange candidat–recruteur au sujet d’une candidature.
- **Destinataires :** participants ; administrateur uniquement pour sécurité ou assistance documentée.
- **Sécurité :** RLS par participant et vérification stricte du lien candidature/offre/entreprise.

## T-07 — Notifications et présence

- **Données :** utilisateur, notification, statut lu, dernière présence et contexte de navigation.
- **Finalité :** informer et assurer le fonctionnement du service.
- **Action restante :** formaliser une durée de purge de la présence.

## T-08 — Consentements et preuve juridique

- **Données :** utilisateur ou email, référence de candidature, type de consentement, version, date et source.
- **Finalité :** prouver l’acceptation des CGU, la lecture de la confidentialité, l’accord de transmission du CV et le choix marketing.
- **Base :** obligation de preuve et consentement lorsque requis.

## T-09 — Exercice des droits

- **Données :** email, utilisateur, référence, type de demande, précisions, statut, échéance et gestionnaire.
- **Finalité :** traiter l’accès, la rectification, la suppression, l’opposition, la portabilité et le retrait.
- **Délai interne :** trente jours.

## T-10 — Sécurité et incidents

- **Données :** journaux, erreurs, événements d’authentification, accès et actions administratives.
- **Finalité :** prévenir les abus, enquêter, restaurer le service et gérer les notifications d’incident.
- **Destinataires :** équipe habilitée, prestataires, autorité et personnes concernées lorsque nécessaire.

## Mesures organisationnelles à formaliser

- liste nominative des administrateurs habilités ;
- procédure d’attribution et retrait des accès ;
- engagement de confidentialité ;
- procédure d’exercice des droits ;
- procédure de violation de données ;
- registre des incidents ;
- revue trimestrielle des politiques RLS ;
- revue des sous-traitants et transferts ;
- procédure de suppression des comptes et CV ;
- analyse d’impact avant tout profilage automatisé significatif.
