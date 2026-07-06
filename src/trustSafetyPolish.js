function textOf(node) {
  return (node?.textContent || '').trim();
}

function isJobPage() {
  return Array.from(document.querySelectorAll('button')).some((button) => textOf(button).includes('Postuler'));
}

function addSafetyBox() {
  if (!isJobPage() || document.querySelector('[data-nzela-safety-box]')) return;
  const title = Array.from(document.querySelectorAll('h1,h2,h3')).find((node) => textOf(node).length > 8);
  const container = title?.closest('.space-y-5') || title?.parentElement?.parentElement;
  if (!container) return;
  const box = document.createElement('section');
  box.dataset.nzelaSafetyBox = 'true';
  box.className = 'nzela-safety-box';
  box.innerHTML = '<strong>Sécurité candidat</strong><span>Nzela Jobs ne demande jamais d argent aux candidats. Refuse toute offre qui exige un paiement avant recrutement.</span><button type="button">Signaler cette offre</button>';
  const applyButton = Array.from(container.querySelectorAll('button')).find((button) => textOf(button).includes('Postuler'));
  applyButton?.insertAdjacentElement('afterend', box);
  box.querySelector('button')?.addEventListener('click', () => {
    const reason = window.prompt('Pourquoi veux-tu signaler cette offre ?');
    if (!reason) return;
    const reports = JSON.parse(localStorage.getItem('nzela.reports') || '[]');
    reports.unshift({ reason, page: location.href, date: new Date().toISOString() });
    localStorage.setItem('nzela.reports', JSON.stringify(reports.slice(0, 50)));
    alert('Signalement enregistré. L équipe pourra le traiter depuis l espace admin.');
  });
}

function addVerifiedCompanyBadges() {
  Array.from(document.querySelectorAll('article')).forEach((card) => {
    if (card.querySelector('[data-nzela-verified-badge]')) return;
    const hasCompanyText = card.textContent && card.textContent.length > 20;
    if (!hasCompanyText) return;
    const badge = document.createElement('span');
    badge.dataset.nzelaVerifiedBadge = 'true';
    badge.className = 'nzela-verified-badge';
    badge.textContent = 'Entreprise à vérifier';
    const target = card.querySelector('p') || card.firstElementChild;
    target?.insertAdjacentElement('afterend', badge);
  });
}

function addStyles() {
  if (document.getElementById('nzela-trust-safety-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-trust-safety-style';
  style.textContent = '.nzela-safety-box{display:grid;gap:8px;margin-top:12px;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;padding:14px}.nzela-safety-box strong{color:#0f3b77;font-weight:950}.nzela-safety-box span{color:#475569;font-size:13px;font-weight:750;line-height:1.5}.nzela-safety-box button{min-height:42px;border-radius:12px;background:#fff;color:#0f3b77;font-weight:950;border:1px solid #bfdbfe}.nzela-verified-badge{display:inline-flex;margin-top:8px;border-radius:999px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:950;padding:5px 9px;border:1px solid #e2e8f0}';
  document.head.appendChild(style);
}

function runTrustPass() {
  addStyles();
  addSafetyBox();
  addVerifiedCompanyBadges();
}

export function applyTrustSafetyPolish() {
  const run = () => requestAnimationFrame(runTrustPass);
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
