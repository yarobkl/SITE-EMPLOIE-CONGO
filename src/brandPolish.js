const TEXT_REPLACEMENTS = [
  ['CONGOEMPLOI', 'Nzela Jobs'],
  ['Bienvenue sur Nzela Jobs', 'Bienvenue sur Nzela Jobs'],
  ['Votre espace mobile est pret.', 'Votre espace Nzela Jobs est pret.'],
  ['Trouver un emploi ou recruter au Congo, depuis ton telephone.', 'Trouvez un emploi fiable au Congo. Recrutez depuis votre telephone.'],
  ['Une experience mobile simple pour chercher, sauvegarder, postuler et publier une offre.', "Nzela Jobs connecte candidats et recruteurs autour d'offres structurees, de candidatures simples et d'un suivi clair."],
  ['Brazzaville, Pointe-Noire et les departements', 'Brazzaville, Pointe-Noire et tout le Congo'],
  ['CV requis', 'CV PDF'],
  ['Candidatures', 'Suivi clair'],
  ['Plateforme fiable', 'Offres structurees'],
  ["Postule en moins d'une minute.", 'Postule rapidement avec ton CV et suis tes candidatures.'],
  ['Publie une offre et suis les candidatures.', 'Publie tes offres, recois les CV et suis les candidatures.'],
  ['Comptes, candidatures et CV restent disponibles dans ton espace.', 'Comptes identifies, offres structurees et experience adaptee au marche congolais.'],
  ['Espace employeur pour publier les offres et voir les CV', 'Espace recruteur pour publier, recevoir les CV et suivre la performance'],
  ['Cree ton compte ou connecte-toi pour retrouver ton profil, tes favoris, tes CV et le suivi de tes candidatures.', 'Cree ton compte pour retrouver tes favoris, tes CV et le suivi de tes candidatures Nzela Jobs.'],
];

const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION']);

function replaceTextNodes(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || EXCLUDED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  nodes.forEach((node) => {
    let value = node.nodeValue;
    TEXT_REPLACEMENTS.forEach(([from, to]) => {
      if (value.includes(from)) value = value.split(from).join(to);
    });
    if (value !== node.nodeValue) node.nodeValue = value;
  });
}

function polishHeaderBrand() {
  const brandNodes = Array.from(document.querySelectorAll('header p'));
  brandNodes.forEach((node) => {
    if (node.textContent.trim().replace(/\s/g, '') !== 'CONGOEMPLOI') return;
    node.innerHTML = 'NZELA<span class="text-blue-700">JOBS</span>';
    node.setAttribute('aria-label', 'Nzela Jobs');
  });
}

function addTrustStrip() {
  const homeTitle = Array.from(document.querySelectorAll('h1')).find((node) => (
    node.textContent.includes('emploi fiable au Congo')
  ));
  if (!homeTitle) return;
  const homeWrapper = homeTitle.closest('.space-y-6');
  if (!homeWrapper || homeWrapper.querySelector('[data-nzela-trust-strip]')) return;

  const strip = document.createElement('section');
  strip.setAttribute('data-nzela-trust-strip', 'true');
  strip.className = 'nzela-trust-strip grid gap-3 md:grid-cols-3';
  strip.innerHTML = `
    <article>
      <strong>Offres structurees</strong>
      <span>Des annonces lisibles, classees par ville, contrat, secteur et salaire.</span>
    </article>
    <article>
      <strong>Recruteurs identifies</strong>
      <span>Un espace dedie pour publier, recevoir les CV et suivre les candidatures.</span>
    </article>
    <article>
      <strong>Mobile d'abord</strong>
      <span>Une experience pensee pour chercher et postuler directement depuis le telephone.</span>
    </article>
  `;

  const hero = homeTitle.closest('section');
  hero?.insertAdjacentElement('afterend', strip);
}

function tagJobCards() {
  const cards = Array.from(document.querySelectorAll('article.smooth-card'));
  cards.forEach((card) => {
    if (card.dataset.nzelaCard === 'true') return;
    const title = card.querySelector('h3');
    const company = card.querySelector('p');
    if (!title || !company) return;
    if (!card.textContent.includes('Postuler')) return;

    const badge = document.createElement('span');
    badge.className = 'nzela-card-badge';
    badge.textContent = 'Offre structuree';
    title.insertAdjacentElement('beforebegin', badge);
    card.dataset.nzelaCard = 'true';
  });
}

function runBrandPass() {
  document.body.classList.add('nzela-brand');
  polishHeaderBrand();
  replaceTextNodes();
  addTrustStrip();
  tagJobCards();
}

export function applyBrandPolish() {
  const run = () => window.requestAnimationFrame(runBrandPass);
  run();

  const root = document.getElementById('root') || document.body;
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true, characterData: true });

  return () => observer.disconnect();
}
