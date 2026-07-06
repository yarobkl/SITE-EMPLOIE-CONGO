const STORE = 'nzela.applicationTracking';
const MAIL_STORE = 'nzela.mailQueue';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value.slice(0, 100)));
}

function textOf(node) {
  return (node?.textContent || '').trim();
}

function makeRef() {
  return `NZJ-CAND-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

function ensureRecentTracking() {
  const submit = Array.from(document.querySelectorAll('button')).find((button) => ['Envoyer et suivre', 'Envoyer rapidement'].some((label) => textOf(button).includes(label)));
  if (!submit || submit.dataset.nzelaTrackSubmit === 'true') return;
  submit.dataset.nzelaTrackSubmit = 'true';
  submit.addEventListener('click', () => {
    const title = Array.from(document.querySelectorAll('h1,h2,h3')).map(textOf).find((value) => value && !value.includes('Postuler')) || 'Candidature';
    const item = { ref: makeRef(), title, status: 'sent', createdAt: new Date().toISOString() };
    write(STORE, [item, ...read(STORE)]);
  });
}

function statusLabel(item) {
  if (item.status === 'cv_opened') return 'CV ouvert par le recruteur';
  if (item.status === 'application_seen') return 'Candidature vue par le recruteur';
  if (item.status === 'shortlisted') return 'Preselectionnee';
  if (item.status === 'rejected') return 'Refusee';
  return 'Candidature envoyee';
}

function addCandidateRefs() {
  const cards = Array.from(document.querySelectorAll('div.rounded-lg.border')).filter((card) => textOf(card).includes('Suivi actif') || textOf(card).includes('Candidature rapide'));
  const items = read(STORE);
  cards.forEach((card, index) => {
    if (card.querySelector('[data-nzela-tracking-ref]')) return;
    const item = items[index] || { ref: makeRef(), status: 'sent' };
    const box = document.createElement('div');
    box.dataset.nzelaTrackingRef = 'true';
    box.className = 'nzela-tracking-ref';
    box.innerHTML = `<strong>Numero de suivi: ${item.ref}</strong><span>${statusLabel(item)}</span>`;
    card.appendChild(box);
  });
}

function updateTracking(index, status) {
  const items = read(STORE);
  if (!items[index]) items[index] = { ref: makeRef(), status: 'sent', createdAt: new Date().toISOString() };
  items[index].status = status;
  items[index].updatedAt = new Date().toISOString();
  write(STORE, items);
  const mail = { ref: items[index].ref, status, subject: status === 'cv_opened' ? 'Votre CV a ete ouvert' : 'Votre candidature a ete consultee', createdAt: new Date().toISOString() };
  write(MAIL_STORE, [mail, ...read(MAIL_STORE)]);
}

function bindRecruiterActions() {
  const recruiterCards = Array.from(document.querySelectorAll('article')).filter((card) => textOf(card).includes('Marquer la demande vue') || textOf(card).includes('Ouvrir le CV'));
  recruiterCards.forEach((card, index) => {
    if (!card.querySelector('[data-nzela-recruiter-ref]')) {
      const items = read(STORE);
      const item = items[index] || { ref: makeRef(), status: 'sent' };
      const box = document.createElement('div');
      box.dataset.nzelaRecruiterRef = 'true';
      box.className = 'nzela-recruiter-ref';
      box.innerHTML = `<strong>Numero candidat: ${item.ref}</strong><span>Le candidat sera notifie quand la demande ou le CV est ouvert.</span>`;
      card.appendChild(box);
    }
    Array.from(card.querySelectorAll('button')).forEach((button) => {
      const label = textOf(button);
      if (button.dataset.nzelaTrackingBound === 'true') return;
      if (label.includes('Marquer la demande vue')) {
        button.dataset.nzelaTrackingBound = 'true';
        button.addEventListener('click', () => updateTracking(index, 'application_seen'));
      }
      if (label.includes('Ouvrir le CV') || label.includes('Telecharger le CV')) {
        button.dataset.nzelaTrackingBound = 'true';
        button.addEventListener('click', () => updateTracking(index, 'cv_opened'));
      }
    });
  });
}

function addStyle() {
  if (document.getElementById('nzela-application-tracking-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-application-tracking-style';
  style.textContent = '.nzela-tracking-ref,.nzela-recruiter-ref{margin-top:12px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;padding:12px}.nzela-tracking-ref strong,.nzela-recruiter-ref strong{display:block;color:#0f3b77;font-size:13px;font-weight:950}.nzela-tracking-ref span,.nzela-recruiter-ref span{display:block;margin-top:4px;color:#475569;font-size:12px;font-weight:750;line-height:1.45}';
  document.head.appendChild(style);
}

function runTrackingPass() {
  addStyle();
  ensureRecentTracking();
  addCandidateRefs();
  bindRecruiterActions();
}

export function applyApplicationTrackingPolish() {
  const run = () => requestAnimationFrame(runTrackingPass);
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
