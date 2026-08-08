# NZELA iOS

## Etat actuel

NZELA est prepare comme application iPhone avec Capacitor. Le site React/Vite reste la source principale, et le dossier `ios/App` contient le projet Xcode.

Etat verifie sur ce Mac :

- macOS 13.7.8
- Xcode 15.2
- Node 22.22.3
- npm 10.9.8
- Capacitor Core/iOS/CLI 7.6.8
- Build web OK
- Audit npm high OK, 0 vulnerabilite
- `npx cap doctor` OK
- `npx cap sync ios` OK
- Compilation Xcode Debug iOS OK avec `CODE_SIGNING_ALLOWED=NO`

## Commandes de travail

Depuis la racine du projet :

```bash
npm install
npm run build
npm run ios:sync
npm run ios:open
```

Pour lancer depuis Capacitor :

```bash
npm run ios:run
```

## Reglages Xcode a faire avant test iPhone

1. Ouvrir `ios/App/App.xcodeproj`.
2. Selectionner la cible `App`.
3. Dans Signing & Capabilities, choisir le compte Apple Developer.
4. Remplacer le Team ID placeholder par le vrai Team ID Apple.
5. Verifier le Bundle ID final : `com.nzela.app`.
6. Brancher l'iPhone, choisir l'iPhone dans la liste des devices, puis Run.

## OAuth Supabase

Le pont natif utilise le callback suivant :

```text
com.nzela.app://auth/callback
```

Dans Supabase Auth, ajouter cette URL dans les redirect URLs autorisees.

Conserver aussi l'URL web de production :

```text
https://site-emploie-congo.vercel.app
```

Google OAuth est ouvert dans le navigateur natif via Capacitor Browser, puis le retour dans l'app est traite par le deep link.

## Sign in with Apple

La capacite Apple Sign In est ajoutee dans les entitlements iOS. Pour la rendre pleinement active :

1. Activer Sign in with Apple dans Apple Developer.
2. Configurer le Bundle ID `com.nzela.app`.
3. Configurer le provider Apple dans Supabase.
4. Tester connexion, deconnexion, reprise de session et suppression de compte.

Apple peut exiger cette option si Google est propose comme connexion principale.

## Deep links et Universal Links

Le projet contient :

```text
public/.well-known/apple-app-site-association
```

Avant production, remplacer `TEAM_ID.com.nzela.app` par le vrai couple Team ID + Bundle ID.

Les liens prevus couvrent :

- offres d'emploi ;
- immobilier ;
- profil ;
- messages ;
- retour OAuth.

## Fonctions natives preparees

Fonctions deja raccordees ou preparees :

- ouverture OAuth via navigateur natif ;
- retour app par deep link ;
- detection reseau online/offline ;
- feedback haptique sur actions importantes ;
- partage natif ;
- camera et galerie pour immobilier ;
- splash screen ;
- notifications push cote app.

Les notifications push necessitent encore le backend APNs : stockage du token device, envoi serveur, preferences utilisateur et politique de consentement.

## Donnees et conformite App Store

Avant TestFlight public ou App Review, declarer clairement :

- email ;
- telephone ;
- CV et pieces jointes ;
- messages ;
- candidatures ;
- offres recruteur ;
- photos immobilier ;
- donnees d'usage si activees.

Si la creation de compte existe, la suppression de compte doit aussi etre accessible depuis l'app et appliquer une suppression/anonymisation reelle cote backend.

## TestFlight

Checklist minimale :

1. Build en Release dans Xcode.
2. Archive depuis Xcode.
3. Upload vers App Store Connect.
4. Ajouter une politique de confidentialite.
5. Ajouter un compte de demo pour Apple Review.
6. Tester :
   - inscription candidat ;
   - connexion Google ;
   - connexion Apple ;
   - deconnexion ;
   - publication offre recruteur ;
   - candidature rapide ;
   - candidature connectee ;
   - depot CV ;
   - consultation immobilier ;
   - coupure reseau puis reprise ;
   - deep link vers une offre.

## Notes techniques

La branche de travail est `agent/ios-foundation`. Ne pas pousser directement sur `main` sans validation.

Capacitor 8 a ete audite mais ne compilait pas correctement avec Xcode 15.2 dans cette configuration SwiftPM. La fondation iOS a donc ete stabilisee en Capacitor 7 pour permettre un vrai build local sur ce Mac.
