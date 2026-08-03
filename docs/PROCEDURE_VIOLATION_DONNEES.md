# Procédure de gestion d’une violation de données — Nzela Jobs

**Version :** 2026-08-02-v1  
**Responsable de coordination pendant la phase bêta :** Rodrin Bakala Mouengue.

## Déclenchement

La procédure s’applique à toute perte, consultation non autorisée, divulgation, modification, suppression accidentelle, indisponibilité ou exfiltration concernant les comptes, CV, candidatures, messages ou journaux de Nzela Jobs.

## Priorités immédiates

1. **Contenir** : révoquer les clés ou sessions compromises, désactiver le compte ou la fonction concernée, isoler le stockage et bloquer l’accès abusif.
2. **Préserver les preuves** : conserver les journaux, heures, identifiants, captures, versions et changements sans exposer davantage les données.
3. **Évaluer** : déterminer les catégories de données, le nombre de personnes, la durée, les destinataires, les conséquences et la possibilité d’usurpation, discrimination, fraude ou atteinte professionnelle.
4. **Corriger** : fermer la faille, restaurer le service, réinitialiser les accès et vérifier l’intégrité des données.
5. **Notifier** : saisir l’autorité compétente lorsque le risque le justifie et préparer une information claire des personnes en cas de risque élevé.

## Registre d’incident

Chaque incident reçoit une référence et consigne :

- date et heure de détection ;
- personne ou outil ayant détecté l’incident ;
- systèmes et données concernés ;
- origine connue ou supposée ;
- nombre estimé de personnes et fichiers ;
- mesures de confinement ;
- niveau de risque ;
- décision de notification et justification ;
- communications envoyées ;
- correctifs et contrôles de clôture ;
- date de clôture et leçons retenues.

## Échelle de gravité interne

- **Niveau 1 — faible :** incident sans accès démontré à des données personnelles ou exposition très limitée et immédiatement corrigée.
- **Niveau 2 — modéré :** données personnelles accessibles pendant une période limitée, sans données sensibles ni exploitation connue.
- **Niveau 3 — élevé :** CV, coordonnées, messages, identifiants ou nombreuses personnes concernés ; accès externe probable.
- **Niveau 4 — critique :** exfiltration massive, compromission administrative, publication, fraude active ou risque grave pour les personnes.

## Délai de travail

L’équipe vise une première évaluation dans les quatre heures et documente toute notification à l’autorité dans le délai légal applicable, avec un objectif opérationnel de 72 heures lorsque la violation présente un risque.

## Modèle d’information aux personnes

L’information doit indiquer simplement :

- ce qui s’est produit ;
- les données potentiellement concernées ;
- les conséquences possibles ;
- les mesures déjà prises ;
- les actions recommandées ;
- le canal de contact et la référence de l’incident.

Elle ne doit ni minimiser artificiellement l’incident ni révéler des éléments qui aggraveraient la sécurité.

## Contacts et responsabilités

À compléter avant ouverture générale :

- responsable du traitement ;
- référent protection des données ;
- responsable technique ;
- avocat ou conseil juridique ;
- contact sécurité Supabase ;
- contact sécurité Vercel ;
- coordonnées officielles de l’autorité congolaise.

## Revue post-incident

Dans les quinze jours suivant la clôture :

- analyser la cause racine ;
- vérifier les accès similaires ;
- mettre à jour les politiques RLS, secrets et procédures ;
- documenter les actions préventives ;
- former les personnes habilitées ;
- contrôler l’efficacité du correctif.
