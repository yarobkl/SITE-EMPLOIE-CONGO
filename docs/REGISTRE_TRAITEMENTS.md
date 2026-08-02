# Registre des activités de traitement — Nzela Jobs

**Version :** 2026-08-02-v1  
**Responsable du traitement :** Rodrin Bakala Mouengue, fondateur et porteur du projet Nzela Jobs  
**Statut :** registre initial à compléter lors de l’immatriculation de la structure juridique.

## Sous-traitants techniques identifiés

| Prestataire | Service | Localisation principale connue | Données concernées | Document à archiver |
|---|---|---|---|---|
| Supabase | Authentification, PostgreSQL, stockage CV, API | Région du projet : `eu-west-3`, Paris | Comptes, profils, CV, candidatures, messages, journaux | DPA, conditions, liste des sous-traitants, mesures de sécurité |
| Vercel | Hébergement et diffusion de l’application | Infrastructure distribuée | Requêtes web, IP, journaux techniques, fichiers publics | DPA, conditions, liste des sous-traitants, durées de journaux |
| GitHub | Dépôt de code et gestion des changements | Infrastructure GitHub | Code, documentation, pas de CV volontairement stocké | Conditions, sécurité du dépôt, accès collaborateurs |

## Traitement T-01 — Comptes et authentification

| Champ | Description |
|---|---|
| Personnes concernées | Candidats, recruteurs, administrateurs |
| Finalité | Créer, authentifier, sécuriser et administrer les comptes |
| Données | Identifiant UUID, email, métadonnées de rôle, dates de création et connexion, facteurs d’authentification |
| Base | Exécution du service demandé et sécurité |
| Destinataires | Utilisateur, administrateurs habilités, Supabase |
| Conservation | Jusqu’à suppression du compte ou procédure d’inactivité, sous réserve des données nécessaires à la preuve et à la sécurité |
| Sécurité | Supabase Auth, sessions PKCE, RLS, séparation des rôles |
| Transfert | France et éventuels sous-traitants hors CEMAC/CEEAC à documenter |

## Traitement T-02 — Profils candidats et recruteurs

| Champ | Description |
|---|---|
| Finalité | Personnaliser le compte, préremplir les candidatures, identifier le rôle |
| Données | Nom, prénom, email, téléphone, ville, intitulé professionnel, rôle |
| Base | Exécution du service et mesures précontractuelles |
| Destinataires | Personne concernée ; recruteur uniquement dans le cadre autorisé ; administrateur principal habilité |
| Conservation | Durée du compte puis suppression ou anonymisation selon la procédure applicable |
| Droits | Accès, rectification, export, suppression, opposition |

## Traitement T-03 — Offres et entreprises

| Champ | Description |
|---|---|
| Personnes concernées | Recruteurs et représentants d’entreprises |
| Finalité | Publier, administrer et mesurer les offres |
| Données | Identité de l’entreprise, propriétaire du compte, secteur, ville, logo, contenu des offres, statistiques |
| Base | Exécution du service et intérêt légitime de sécurité/modération |
| Destinataires | Public pour les offres publiées ; propriétaire de l’entreprise ; administrateur habilité |
| Conservation | Pendant la publication puis archivage selon les besoins de preuve et de statistiques |

## Traitement T-04 — Candidatures et CV

| Champ | Description |
|---|---|
| Personnes concernées | Candidats, y compris candidatures rapides sans compte |
| Finalité | Transmettre une candidature au recruteur concerné et assurer son suivi |
| Données | Nom, email, téléphone, message, CV PDF, offre, statut, référence, dates de consultation |
| Base | Mesures précontractuelles demandées par le candidat ; accord explicite de transmission au recruteur |
| Destinataires | Candidat ; recruteur propriétaire de l’offre ; administrateur strictement habilité |
| Conservation | CV : douze mois à compter de la candidature ; autres données selon le suivi du recrutement et les obligations de preuve |
| Sécurité | Bucket privé, PDF 2 Mo, chemin contrôlé, URL signée cinq minutes, RLS par offre et propriétaire |
| Risque | Données professionnelles détaillées, pièces potentiellement excessives, candidatures anonymes |

## Traitement T-05 — Favoris et vues d’offres

| Champ | Description |
|---|---|
| Finalité | Permettre les favoris et mesurer l’intérêt pour les offres |
| Données | Identifiant candidat ou identifiant de session aléatoire, offre, date |
| Base | Exécution du service et intérêt légitime d’amélioration |
| Destinataires | Utilisateur ; recruteur pour les statistiques agrégées de ses offres ; administrateur habilité |
| Conservation | Durée nécessaire à la fonctionnalité et aux statistiques ; anonymisation à prévoir pour les historiques anciens |

## Traitement T-06 — Messagerie

| Champ | Description |
|---|---|
| Finalité | Échanges entre candidat et recruteur au sujet d’une candidature |
| Données | Participants, offre, candidature, contenu des messages, dates de lecture |
| Base | Exécution du service demandé |
| Destinataires | Participants de la conversation ; administrateur principal uniquement pour sécurité et assistance documentées |
| Conservation | Durée du recrutement et du compte, puis purge ou anonymisation selon une règle à automatiser |
| Sécurité | RLS par participant ; fonction RPC vérifiant le lien candidature/offre/entreprise |

## Traitement T-07 — Notifications et présence

| Champ | Description |
|---|---|
| Finalité | Informer des événements du compte et afficher l’activité récente |
| Données | Identifiant utilisateur, contenu de notification, date, statut lu, dernière présence, contexte de navigation |
| Base | Exécution du service et sécurité |
| Destinataires | Utilisateur ; administrateur principal habilité pour le pilotage |
| Conservation | Notifications durant la vie du compte ; présence limitée au besoin opérationnel, règle de purge à formaliser |

## Traitement T-08 — Consentements et preuves juridiques

| Champ | Description |
|---|---|
| Finalité | Prouver l’acceptation des CGU, la lecture de la confidentialité, l’accord de transmission et le choix marketing |
| Données | Utilisateur ou email, référence de candidature, type, version juridique, date, source |
| Base | Obligation de preuve et consentement pour les opérations qui l’exigent |
| Destinataires | Personne concernée ; personnel juridique/administrateur habilité |
| Conservation | Durée nécessaire à la preuve, y compris après retrait lorsque la preuve du traitement antérieur doit être conservée |

## Traitement T-09 — Demandes d’exercice des droits

| Champ | Description |
|---|---|
| Finalité | Recevoir, suivre et prouver le traitement des demandes d’accès, rectification, suppression, opposition, portabilité et retrait |
| Données | Email, identifiant utilisateur, référence de candidature, type de demande, détails, statut, échéance, responsable du traitement |
| Base | Obligation légale |
| Destinataires | Personnel habilité chargé de la conformité ; personne concernée |
| Conservation | Durée de traitement puis période probatoire à définir avec le conseil juridique |
| Délai interne | Trente jours, avec justification documentée en cas de prolongation |

## Traitement T-10 — Sécurité, journaux et incidents

| Champ | Description |
|---|---|
| Finalité | Prévenir les abus, enquêter sur les incidents, restaurer le service et notifier les violations |
| Données | Journaux techniques, IP selon prestataires, accès, erreurs, événements d’authentification, actions administratives |
| Base | Intérêt légitime de sécurité et obligations légales |
| Destinataires | Équipe technique habilitée, prestataires, autorité et personnes concernées lorsque la loi l’exige |
| Conservation | Durée strictement nécessaire à la sécurité et aux obligations de preuve, à préciser selon les journaux des prestataires |

## Mesures organisationnelles à formaliser

- liste nominative des administrateurs habilités ;
- procédure d’attribution et de retrait des accès ;
- engagement de confidentialité ;
- procédure de réponse aux droits ;
- procédure de violation de données et notification sous 72 heures lorsque applicable ;
- registre des incidents ;
- revue trimestrielle des politiques RLS ;
- revue des sous-traitants et transferts ;
- procédure de suppression des comptes et CV ;
- analyse d’impact avant tout classement automatisé significatif de candidats.
