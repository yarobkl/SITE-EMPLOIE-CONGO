# CONGOEMPLOI - Plateforme de Recrutement

Plateforme mobile-first de recrutement pour la République du Congo, connectant les entreprises aux talents de Brazzaville, Pointe-Noire et Dolisie.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000` ou le port Vite disponible.

### Build pour production

```bash
npm run build
```

## 📋 Technologies

- **React 18** - Interface utilisateur
- **Vite** - Build tool moderne
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎨 Design

- Palette de couleurs: Bleu profond (#0A2540), Bleu électrique (#0061FF)
- Design responsive et moderne
- Animations fluides
- Interface accessible

## 📱 Fonctionnalités

- Recherche d'offres d'emploi
- Espace candidat
- Espace recruteur
- Navigation responsive
- Parcours mobile-first candidat/recruteur
- Sauvegarde locale des favoris, candidatures, offres et notifications
- Candidature suivie avec connexion, CV PDF et KPI d'ouverture
- Candidature rapide avec CV PDF, sans suivi temps réel
- Préparation Supabase pour la base de données

## Base de données Supabase

La V1 fonctionne en mode local pour pouvoir tester tout de suite. Pour brancher Supabase:

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` dans le SQL Editor.
3. Copier `.env.example` vers `.env.local`.
4. Renseigner:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Sur Vercel, ajouter les mêmes variables dans Project Settings > Environment Variables.

## 📝 Licence

© 2024 CONGOEMPLOI SARL
