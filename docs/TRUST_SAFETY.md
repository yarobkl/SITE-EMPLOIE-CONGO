# Nzela Trust & Safety

## Principe

La confiance recruteur n'est jamais modifiable par le recruteur lui-même. Une entreprise est vérifiée uniquement après une décision d'administration Nzela.

## Publication des offres

- Entreprise vérifiée : une nouvelle offre peut être approuvée automatiquement par la couche de confiance.
- Entreprise non vérifiée : une nouvelle offre est créée en `pending` et reste visible uniquement pour son propriétaire et l'administration jusqu'à validation.
- Les offres historiques déjà publiques avant l'activation de Trust & Safety ont été conservées en `approved` pour éviter une coupure rétroactive.
- Une modification substantielle d'une offre par une entreprise non vérifiée renvoie l'offre en vérification.

## Signalements

Un utilisateur authentifié peut signaler une offre publique qu'il ne possède pas. Un seul signalement est accepté par utilisateur et par offre.

Motifs : arnaque, demande de paiement, identité douteuse, contenu trompeur, discrimination ou autre.

À partir de 3 signalements ouverts provenant de 3 comptes distincts, l'offre est automatiquement replacée en `pending` et disparaît du catalogue public jusqu'à examen par l'administration.

## Vérification entreprise

Le recruteur peut transmettre un e-mail professionnel et un justificatif privé (PDF/JPG/PNG, 5 Mo maximum). Les pièces sont stockées dans le bucket privé `verification-documents`; seuls leur propriétaire et l'administration peuvent les lire.

Une approbation :
- marque l'entreprise comme vérifiée ;
- libère ses offres en attente ;
- autorise les parcours Talents réservés aux recruteurs vérifiés.

Une suspension bloque les offres publiées de l'entreprise.

## Invariants techniques

- `companies.verified` et `companies.owner_id` ne sont pas modifiables par le rôle `authenticated`.
- Les colonnes de modération des offres ne sont pas modifiables par le rôle `authenticated`.
- Les décisions admin sont revalidées côté fonctions SQL ; le contrôle visuel côté frontend ne constitue jamais l'autorisation.
- `job_reports` a RLS activé et des grants Data API explicites.
