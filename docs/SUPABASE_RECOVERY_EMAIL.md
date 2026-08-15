# E-mail de récupération Nzela Jobs

## Objet

`Réinitialisez votre mot de passe Nzela Jobs`

## Modèle

Le modèle HTML versionné se trouve dans `supabase/templates/recovery.html`.

Pour le projet Supabase hébergé `congoemploi`, renseigner ce modèle dans **Authentication > Email Templates > Reset password** et utiliser l'objet ci-dessus.

Le bouton du modèle repose sur `{{ .ConfirmationURL }}`, la variable officielle Supabase qui contient le lien sécurisé de récupération généré pour l'utilisateur.

## Parcours applicatif actuel

L'application appelle `supabase.auth.resetPasswordForEmail(...)`. Le modèle ci-dessus personnalise l'e-mail envoyé par Supabase sans stocker de jeton dans le dépôt.

Avant mise en production complète du parcours, prévoir un écran applicatif dédié permettant de saisir et confirmer le nouveau mot de passe après le clic sur le lien de récupération.
