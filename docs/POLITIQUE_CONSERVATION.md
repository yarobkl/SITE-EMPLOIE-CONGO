# Politique de conservation et de suppression — Nzela Jobs

**Version :** 2026-08-02-v1  
**Statut :** politique interne initiale à valider juridiquement et à automatiser progressivement.

## Principes

1. Ne conserver que les données nécessaires à une finalité déterminée.
2. Ne jamais supprimer automatiquement une donnée faisant l’objet d’un litige, d’une enquête de sécurité ou d’une obligation légale documentée.
3. Informer l’utilisateur des durées principales.
4. Supprimer le fichier physique, les références en base et les copies temporaires lorsque la suppression est validée.
5. Anonymiser les statistiques conservées après expiration lorsqu’une conservation agrégée reste utile.

## Durées initiales

| Catégorie | Durée proposée | Sort à l’échéance |
|---|---:|---|
| CV associé à une candidature | 12 mois après la candidature | suppression du fichier, mise à jour de la candidature, conservation éventuelle d’une trace minimale |
| CV rapide orphelin | 24 heures après le téléversement sans candidature associée | suppression automatique après contrôle |
| Candidature | 24 mois après clôture du recrutement | suppression ou anonymisation, sauf litige ou obligation contraire |
| Compte actif | durée d’utilisation | conservation tant que le compte est actif |
| Compte inactif | 24 mois sans connexion | avertissement, puis suppression/anonymisation après délai de grâce de 30 jours |
| Messagerie | 24 mois après clôture de la candidature | suppression ou anonymisation |
| Favoris | durée du compte ou retrait par l’utilisateur | suppression immédiate au retrait ou avec le compte |
| Présence en ligne | 30 jours maximum | purge automatique, sauf données agrégées anonymes |
| Notifications | 12 mois | purge automatique |
| Journaux de sécurité | 12 mois | suppression, sauf incident ou enquête documentée |
| Consentements et versions juridiques | durée nécessaire à la preuve | conservation limitée à la preuve, même après retrait du consentement antérieur |
| Demandes d’exercice des droits | 5 ans après clôture, à confirmer juridiquement | suppression ou archivage probatoire sécurisé |
| Sauvegardes | cycle maximal de 90 jours | écrasement automatique et contrôlé |

## Procédure de suppression d’un compte

1. Authentifier la demande.
2. Vérifier les obligations de conservation et les litiges ouverts.
3. Exporter les données lorsque l’utilisateur le demande.
4. Révoquer les sessions actives.
5. Supprimer les CV et fichiers privés.
6. Supprimer ou anonymiser candidatures, messages, favoris, notifications et présence.
7. Supprimer le profil puis le compte Auth.
8. Conserver uniquement la preuve minimale de traitement de la demande.
9. Confirmer la clôture à la personne concernée.

## Automatisations à développer

- rapport hebdomadaire des CV arrivant à expiration ;
- nettoyage quotidien des fichiers `quick/` orphelins de plus de 24 heures ;
- purge mensuelle des notifications et de la présence ;
- avertissement des comptes inactifs ;
- journal d’exécution des suppressions ;
- mode simulation avant chaque purge ;
- alerte administrateur en cas d’échec.

Aucune automatisation destructive ne doit être activée en production sans test sur un environnement séparé, sauvegarde vérifiée et validation du propriétaire du produit.
