import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return [full];
  });
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function fail(message) {
  console.error(`\n[architecture] ${message}`);
  process.exitCode = 1;
}

const app = read('src/App.jsx');
const shell = read('src/MobilePlatformShell.jsx');
const main = read('src/main.jsx');
const navigation = read('src/NavigationExperience.jsx');
const talentMarketplace = read('src/TalentMarketplaceExperience.jsx');
const onboarding = read('src/OnboardingReliabilityExperience.jsx');
const jsxFiles = listFiles(srcDir).filter((file) => /\.jsx?$/.test(file));

// 1. Un seul shell primaire doit contrôler le pager et la bottom navigation.
if (count(app, /<MobilePlatformShell\b/g) !== 1) {
  fail('App.jsx doit monter exactement un MobilePlatformShell.');
}

if (count(main, /<App\s*\/>/g) !== 1) {
  fail('main.jsx doit monter exactement une racine App.');
}

const bottomNavOwners = jsxFiles.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return text.includes('className="nz-mobile-platform-nav"');
});

if (bottomNavOwners.length !== 1 || path.basename(bottomNavOwners[0] || '') !== 'MobilePlatformShell.jsx') {
  fail(`La bottom navigation primaire doit appartenir uniquement à MobilePlatformShell.jsx. Trouvé: ${bottomNavOwners.map((file) => path.relative(root, file)).join(', ') || 'aucune'}`);
}

// 2. L'ordre produit du pager est un contrat : Accueil → Offres → Immobilier → Profil.
const expectedSectionOrder = ["'home'", "'jobs'", "'immobilier'", "'profile'"];
let previousIndex = -1;
for (const section of expectedSectionOrder) {
  const index = shell.indexOf(`id: ${section}`);
  if (index < 0 || index <= previousIndex) {
    fail('MobilePlatformShell doit conserver l’ordre home → jobs → immobilier → profile.');
    break;
  }
  previousIndex = index;
}

// 3. App reste la source de vérité de l’onglet actif et transmet la navigation au shell.
for (const required of [
  "const commitPlatformSection",
  'activeId={mobileActiveSection}',
  'onNavigate={commitPlatformSection}',
  'sections={platformSections}',
]) {
  if (!app.includes(required)) fail(`Contrat de navigation absent dans App.jsx: ${required}`);
}

// 4. L’ancien routeur peut gérer URL/deep links, mais ne doit pas intercepter la bottom bar du pager.
if (!navigation.includes("target.closest('.nz-mobile-platform-nav')")) {
  fail('NavigationExperience doit explicitement ignorer les clics de la bottom navigation du MobilePlatformShell.');
}

// 5. Empêcher l’apparition silencieuse d’un troisième registre des routes primaires.
const primaryRouteRegistryFiles = jsxFiles.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return text.includes("immobilier: '/immobilier'") && text.includes("profile: '/profil'");
});

const allowedRouteRegistries = new Set([
  'src/App.jsx',
  'src/NavigationExperience.jsx',
]);

for (const file of primaryRouteRegistryFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (!allowedRouteRegistries.has(relative)) {
    fail(`Nouveau registre parallèle des routes primaires détecté dans ${relative}. Centraliser avant d’ajouter une navigation.`);
  }
}

if (primaryRouteRegistryFiles.length > 2) {
  fail(`Trop de registres de routes primaires (${primaryRouteRegistryFiles.length}). Maximum temporaire: 2 pendant le refactor.`);
}

// 6. Un seul onboarding peut activer un profil.
if (count(main, /<OnboardingReliabilityExperience\s*\/>/g) !== 1) {
  fail('main.jsx doit monter exactement un OnboardingReliabilityExperience.');
}

if (!onboarding.includes("p_phone_country: country.iso")) {
  fail('L’onboarding officiel doit utiliser la RPC moderne avec pays du téléphone.');
}

if (talentMarketplace.includes('function OnboardingGate') || talentMarketplace.includes('<OnboardingGate') || talentMarketplace.includes('complete_nzela_profile')) {
  fail('TalentMarketplaceExperience ne doit plus embarquer ni appeler un onboarding parallèle.');
}

if (process.exitCode) process.exit(process.exitCode);

console.log('[architecture] OK — navigation primaire unique et onboarding unique protégés.');
