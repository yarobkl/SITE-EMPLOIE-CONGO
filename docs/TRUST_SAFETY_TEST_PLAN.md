# Validation Trust & Safety

Les validations de base doivent être transactionnelles et rollbackées lorsqu'elles créent des données temporaires.

- propriétaire non vérifié : nouvelle offre `pending`, visible au propriétaire, invisible à un tiers ;
- entreprise vérifiée/admin : nouvelle offre `approved`, visible publiquement ;
- utilisateur authentifié : impossible de modifier `companies.verified` ou `companies.owner_id` ;
- trois comptes distincts signalent une offre : passage automatique à `pending` et retrait public ;
- candidat : un seul signalement par offre ;
- administrateur : lecture de la file de modération et des signalements ;
- administrateur : validation ou blocage d'une offre ;
- recruteur : justificatif de vérification dans son propre dossier privé uniquement ;
- administrateur : accès au justificatif via URL signée ;
- build : audit npm, garde-fous architecture et budget de performance restent verts.
