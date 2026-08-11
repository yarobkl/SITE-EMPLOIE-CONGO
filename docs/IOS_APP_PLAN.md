# NZELA iOS — Plan de transformation

## Objectif
Transformer Nzela en application iPhone distribuable sur l’App Store sans réécrire le produit existant.

Le code React/Vite/Supabase reste la source produit principale. Capacitor fournit le conteneur natif iOS et l’accès progressif aux API Apple.

## Architecture cible

- Web : React + Vite
- Backend : Supabase
- Native runtime : Capacitor 7
- iOS : projet Xcode généré par Capacitor
- Auth : Google + Sign in with Apple
- Distribution : TestFlight puis App Store

## Principes

1. Ne pas faire une simple WebView du site.
2. Garder un seul code métier pour Web/iOS puis Android.
3. Ajouter des fonctions natives qui améliorent réellement l’expérience :
   - notifications push ;
   - haptique ;
   - partage natif ;
   - ouverture de liens/deep links ;
   - état réseau et reprise après coupure ;
   - caméra/photos pour Nzela Immobilier ;
   - sélection/partage de CV ;
   - Sign in with Apple.
4. Conserver la navigation mobile swipe existante comme expérience principale.
5. Tester sur appareil réel et réseau faible.

## Phases

### Phase A — Fondation
- Installer Capacitor Core/iOS/CLI.
- Ajouter `capacitor.config.ts`.
- Ajouter scripts build/sync/open iOS.
- Générer le projet `ios/`.
- Définir Bundle ID final et nom public.

### Phase B — Auth native
- Deep links.
- Callback OAuth Supabase.
- Google Sign-In compatible iOS.
- Sign in with Apple.
- Déconnexion/reconnexion fiable.

### Phase C — Expérience native
- Safe areas iPhone.
- Status bar.
- Haptics navigation/actions.
- Share Sheet.
- Détection réseau.
- Push notifications APNs.
- Gestion caméra/photos Immobilier.

### Phase D — App Store readiness
- Icône App Store et launch screen.
- Privacy manifest / déclarations données.
- Suppression de compte depuis l’app.
- Liens Support + Politique de confidentialité.
- Compte de démonstration App Review.
- Screenshots iPhone.
- TestFlight.
- Review App Store.

## Contraintes Apple 2026

Le projet est actuellement stabilise en Capacitor 7 pour compiler sur le Mac disponible avec Xcode 15.2. Une migration Capacitor/Xcode plus recente reste possible avant soumission App Store si Apple l'exige au moment de la publication.

- Build de soumission avec Xcode 26 ou plus récent et SDK iOS 26 ou plus récent.
- L’application doit apporter une expérience suffisamment native et utile pour ne pas être considérée comme un simple site reconditionné.
- Une app utilisant Google comme service de connexion primaire doit également proposer une option de connexion équivalente répondant aux règles Apple ; Sign in with Apple sera notre option native.
- Si la création de compte est disponible, la suppression du compte doit aussi être disponible dans l’app.

## Android
La fondation choisie permet d’ajouter Android plus tard avec le même code métier (`@capacitor/android`) sans repartir de zéro.
