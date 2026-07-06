function textOf(node) {
  return (node?.textContent || '').trim();
}

function changeExactText(from, to) {
  Array.from(document.querySelectorAll('h1,h2,h3,p,span,button,small')).forEach((node) => {
    if (textOf(node) === from) node.textContent = to;
  });
}

function hideRecruiterEntries() {
  const headerRecruiter = document.querySelector('header button[aria-label="Recruteur"]');
  if (headerRecruiter) headerRecruiter.classList.add('nzela-unified-hidden');

  const headerProfile = document.querySelector('header button[aria-label="Profil"]');
  if (headerProfile) headerProfile.setAttribute('aria-label', 'Mon espace');

  const mobileNav = document.querySelector('nav.fixed');
  const grid = mobileNav?.querySelector('.grid');
  grid?.classList.remove('grid-cols-5');
  grid?.classList.add('grid-cols-4');

  Array.from(mobileNav?.querySelectorAll('button') || []).forEach((button) => {
    if (textOf(button) === 'Recruteur') button.classList.add('nzela-unified-hidden');
    if (textOf(button) === 'Profil') {
      Array.from(button.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === 'Profil') node.nodeValue = 'Mon espace';
      });
    }
  });
}

function renameSpaces() {
  changeExactText('Profil', 'Mon espace');
  changeExactText('Recruteur', 'Mon espace');
  changeExactText('Connexion candidat', 'Connexion');
  changeExactText('Connexion recruteur', 'Connexion');
  changeExactText('Candidat', 'Compte candidat');
  changeExactText('Aller a mon espace recruteur', 'Gérer mes offres');
  changeExactText('Publie ta premiere offre', 'Publier une offre');
}

function updateSubtitles() {
  Array.from(document.querySelectorAll('h1')).forEach((title) => {
    if (textOf(title) !== 'Mon espace') return;
    const subtitle = title.nextElementSibling;
    if (!subtitle) return;
    const text = textOf(subtitle);
    if (text.includes('Candidat') || text.includes('recruteur') || text.includes('Recruteur') || text.includes('Profil')) {
      subtitle.textContent = 'Compte reconnu automatiquement selon le rôle choisi à l inscription.';
    }
  });
}

function addUnifiedNotice() {
  const title = Array.from(document.querySelectorAll('h1')).find((node) => textOf(node) === 'Mon espace');
  const container = title?.closest('.space-y-5');
  if (!container || container.querySelector('[data-unified-account]')) return;
  const notice = document.createElement('section');
  notice.dataset.unifiedAccount = 'true';
  notice.className = 'nzela-unified-notice';
  notice.innerHTML = '<strong>Un seul compte Nzela Jobs</strong><span>Tout le monde se connecte au même endroit. Le rôle choisi à l inscription détermine automatiquement les actions disponibles.</span>';
  const anchor = title.closest('.flex') || title.parentElement;
  anchor?.insertAdjacentElement('afterend', notice);
}

function addStyles() {
  if (document.getElementById('nzela-unified-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-unified-style';
  style.textContent = '.nzela-unified-hidden{display:none!important}.nzela-unified-notice{display:grid;gap:5px;border:1px solid #dbeafe;border-radius:16px;background:linear-gradient(135deg,#eef6ff,#fff);padding:14px}.nzela-unified-notice strong{color:#0f3b77;font-weight:950}.nzela-unified-notice span{color:#475569;font-size:13px;font-weight:750;line-height:1.55}';
  document.head.appendChild(style);
}

function runUnifiedPass() {
  addStyles();
  hideRecruiterEntries();
  renameSpaces();
  updateSubtitles();
  addUnifiedNotice();
}

export function applyUnifiedSpacePolish() {
  const run = () => requestAnimationFrame(runUnifiedPass);
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true });
  return () => observer.disconnect();
}
