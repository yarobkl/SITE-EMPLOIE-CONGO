# Nzela — KPI de liquidité du marketplace

## Objectif

Le pilotage ne doit pas se limiter au nombre de comptes, d’offres ou de pages vues. Les KPI prioritaires mesurent si une offre rencontre réellement des candidats et si une candidature produit une interaction utile.

## KPI principaux

- **Couverture des offres** : part des offres publiques approuvées ayant reçu au moins une candidature.
- **Offres sans candidature** : nombre d’offres publiques approuvées n’ayant reçu aucune candidature.
- **Délai médian avant première candidature** : temps entre la publication d’une offre et sa première candidature, pour les offres qui en ont reçu une.
- **Candidatures par offre publique** : moyenne des candidatures reçues par offre publique approuvée.
- **Progression des candidatures** : part des candidatures passées en `reviewed` ou `accepted`.
- **Acceptation des candidatures** : part des candidatures actuellement en `accepted`. Ce KPI n’est pas présenté comme une embauche confirmée.
- **Candidature vers conversation** : part des candidatures disposant d’un thread de messagerie.

## Nzela Talents

- demandes d’emploi actives ;
- invitations envoyées ;
- invitations acceptées ;
- demandes marquées `hired`.

## Confiance

- entreprises totales ;
- entreprises vérifiées ;
- taux d’entreprises vérifiées.

## Alerte offres à risque

Une offre publique approuvée sans candidature est :

- `new` avant 72 h ;
- `watch` entre 72 h et 7 jours ;
- `critical` après 7 jours.

Ces seuils sont des seuils opérationnels Nzela et pourront être recalibrés avec davantage de volume.

## Limite actuelle

Le statut `accepted` d’une candidature est un proxy de progression, pas une preuve d’embauche. Une confirmation explicite d’embauche devra être instrumentée avant de publier un KPI « embauches réalisées grâce à Nzela ».
