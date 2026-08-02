# Nzela Immobilier — fonctionnement, sécurité et conformité

**Date :** 2 août 2026  
**Responsable produit :** Rodrin Bakala Mouengue  
**Statut :** module bêta en libre-service, sans encaissement de loyers, cautions ou commissions.

## Positionnement

Nzela Immobilier est un module de petites annonces ouvertes. Un particulier ou un professionnel peut publier directement une chambre, un studio, un appartement, une maison, une villa ou un local commercial. Nzela fournit la publication, la recherche, les favoris, les statistiques, les signalements et la mise en relation.

La plateforme n’agit pas comme agence du propriétaire dans cette version : elle ne visite pas le bien à sa place, ne négocie pas le contrat, ne détient pas la caution, ne garantit pas la propriété et n’encaisse pas le loyer.

## Données traitées

| Traitement | Données | Finalité | Visibilité |
|---|---|---|---|
| Annonce | titre, description, type, ville, quartier, prix, caractéristiques, disponibilité | publier et rechercher un logement | publique lorsque publiée |
| Photos | JPG, PNG ou WebP, 8 Mo maximum, 8 images | présenter le logement | publique lorsque l’annonce est publiée |
| Coordonnées | téléphone et option WhatsApp | permettre un contact direct | téléphone public uniquement avec choix explicite de l’auteur |
| Demande de contact | nom, email ou téléphone, message, demande de visite | mettre en relation l’intéressé et l’auteur | auteur et expéditeur connecté |
| Favoris | utilisateur et annonce | retrouver une annonce | utilisateur ; total agrégé visible |
| Consultation | identifiant aléatoire pseudonyme, annonce, date | compter une vue unique | nombre agrégé uniquement |
| Signalement | motif, détails, compte ou email facultatif | lutter contre les arnaques et contenus interdits | modération uniquement |

## Compteurs de consultations

- Une consultation est enregistrée lors de l’ouverture de la page détaillée.
- Un identifiant aléatoire stable est créé dans le navigateur puis haché en SHA-256 côté base.
- La contrainte unique empêche le même navigateur de multiplier les vues en actualisant la page.
- Une personne connectée qui consulte sa propre annonce n’augmente pas son compteur.
- L’auteur voit uniquement le nombre total ; l’identité des visiteurs n’est pas communiquée.
- Le même principe est appliqué aux offres d’emploi.

## Durée des annonces

Une annonce publiée reçoit automatiquement une date d’expiration à 30 jours. L’auteur peut :

- la modifier ;
- la marquer comme louée ou vendue ;
- la republier pour 30 jours ;
- la supprimer avec ses photos.

Une annonce expirée ou bloquée n’est plus visible dans le flux public.

## Sécurité Supabase

- RLS activée sur toutes les tables immobilières ;
- lecture publique limitée aux annonces publiées, non bloquées et non expirées ;
- modification et suppression réservées à l’auteur ou à l’administrateur ;
- bucket `property-images` public en lecture, mais upload et suppression limités au dossier Supabase de l’auteur ;
- champs de modération protégés par trigger ;
- messages privés limités aux participants autorisés ;
- statistiques publiques exposées sans données d’identité ;
- signalements accessibles uniquement à la modération.

## Mesures anti-fraude de la bêta

- compte obligatoire pour publier ;
- photos réelles obligatoires à la première publication ;
- confirmation de l’exactitude de l’annonce ;
- bouton de signalement ;
- statuts suspendu et bloqué ;
- absence d’encaissement par Nzela ;
- avertissement contre les paiements anticipés trompeurs ;
- conservation de l’historique de création, publication, expiration et clôture.

## Points à compléter avant ouverture commerciale générale

1. finaliser l’identité juridique de l’exploitant ;
2. faire vérifier les CGU immobilières par un juriste congolais ;
3. confirmer les règles professionnelles applicables si Nzela propose ensuite négociation, gestion locative, commission, séquestre ou paiement ;
4. intégrer une vérification de téléphone et une protection anti-robot ;
5. formaliser le délai de conservation des demandes de contact et signalements ;
6. ajouter une procédure de retrait rapide des annonces frauduleuses ;
7. documenter le transfert des photos et données vers Supabase/Vercel hors CEMAC/CEEAC ;
8. mettre à jour le dossier de déclaration auprès de l’autorité de protection des données.
