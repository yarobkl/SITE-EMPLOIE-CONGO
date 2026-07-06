const AUTH_SUBMIT_KEY = 'nzela.auth.lastSubmitAt';

function textOf(node) {
  return (node?.textContent || '').trim();
}

function getLoginTitle() {
  return Array.from(document.querySelectorAll('h1')).find((title) => {
    const text = textOf(title).toLowerCase();
    return text.includes('connexion') || text.includes('inscription');
  });
}

function getLoginContainer() {
  const title = getLoginTitle();
  return title?.closest('.space-y-5') || title?.parentElement?.parentElement || null;
}

function findRoleSwitch(container) {
  if (!container) return null;
  return Array.from(container.querySelectorAll('div')).find((div) => {
    const buttons = Array.from(div.querySelectorAll('button')).map(textOf);
    return buttons.includes('Candidat') && buttons.includes('Recruteur');
  });
}

function isSignupMode(title) {
  return textOf(title).toLowerCase().includes('inscription');
}

function normalizeSigninRole(title, roleSwitch) {
  if (!title || !roleSwitch || isSignupMode(title)) return;
  if (textOf(title).toLowerCase().includes('recruteur')) {
    const candidateButton = Array.from(roleSwitch.querySelectorAll('button')).find((button) => textOf(button) === 'Candidat');
    candidateButton?.click();
  }
}

function addAuthNote(container, mode) {
  if (!container || container.querySelector('[data-nzela-auth-note]')) return;
  const note = document.createElement('div');
  note.dataset.nzelaAuthNote = 'true';
  note.className = `nzela-auth-note nzela-auth-note--${mode}`;
  note.innerHTML = mode === 'signup'
    ? '<strong>Première inscription</strong><span>Choisis ton type de compte une seule fois. Ensuite Nzela Jobs reconnait automatiquement ton rôle.</span>'
    : '<strong>Connexion unique</strong><span>Connecte-toi normalement. Ton compte sera reconnu automatiquement comme candidat ou employeur / recruteur.</span>';

  const form = container.querySelector('form');
  form?.insertAdjacentElement('beforebegin', note);
}

function polishAuthScreen() {
  const title = getLoginTitle();
  const container = getLoginContainer();
  if (!title || !container) return;

  const subtitle = title.nextElementSibling;
  const signup = isSignupMode(title);
  const roleSwitch = findRoleSwitch(container);

  if (signup) {
    title.textContent = 'Créer un compte Nzela Jobs';
    if (subtitle) subtitle.textContent = 'Choisis ton type de compte pour personnaliser ton accès dès la création.';
    roleSwitch?.classList.remove('nzela-auth-hidden');
    roleSwitch?.classList.add('nzela-role-choice');
    const recruiterButton = Array.from(roleSwitch?.querySelectorAll('button') || []).find((button) => textOf(button) === 'Recruteur');
    if (recruiterButton) recruiterButton.textContent = 'Employeur / recruteur';
    addAuthNote(container, 'signup');
  } else {
    normalizeSigninRole(title, roleSwitch);
    title.textContent = 'Connexion à Nzela Jobs';
    if (subtitle) subtitle.textContent = 'Un seul accès pour tous. Nzela Jobs reconnait automatiquement ton compte.';
    roleSwitch?.classList.add('nzela-auth-hidden');
    addAuthNote(container, 'signin');
  }
}

function markAuthSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const container = getLoginContainer();
  if (container && container.contains(form)) {
    localStorage.setItem(AUTH_SUBMIT_KEY, String(Date.now()));
  }
}

function lockProfileRoleField() {
  const labels = Array.from(document.querySelectorAll('label'));
  const roleLabel = labels.find((label) => textOf(label.querySelector('span')).toLowerCase() === 'type de compte');
  if (!roleLabel || roleLabel.dataset.nzelaRoleLocked === 'true') return;
  const select = roleLabel.querySelector('select');
  if (!select) return;

  const roleText = select.value === 'recruteur' ? 'Employeur / recruteur' : 'Candidat';
  const lock = document.createElement('div');
  lock.className = 'nzela-role-lock';
  lock.innerHTML = `<span>Type de compte</span><strong>${roleText}</strong><small>Défini à l inscription. Ton compte est reconnu automatiquement à la connexion.</small>`;
  roleLabel.dataset.nzelaRoleLocked = 'true';
  roleLabel.classList.add('nzela-auth-hidden');
  roleLabel.insertAdjacentElement('afterend', lock);
}

function addAuthStyles() {
  if (document.getElementById('nzela-auth-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-auth-style';
  style.textContent = `
    .nzela-auth-hidden{display:none!important}.nzela-auth-note{border-radius:16px;border:1px solid #dbeafe;background:linear-gradient(135deg,#eef6ff,#fff);padding:14px;display:grid;gap:4px}.nzela-auth-note--signup{border-color:#bbf7d0;background:linear-gradient(135deg,#ecfdf5,#fff)}.nzela-auth-note strong{color:#0f3b77;font-weight:950}.nzela-auth-note--signup strong{color:#047857}.nzela-auth-note span{color:#475569;font-size:13px;font-weight:750;line-height:1.55}.nzela-role-choice{border-color:#dbeafe!important;box-shadow:0 12px 28px rgba(15,59,119,.06)}.nzela-role-lock{border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;padding:12px}.nzela-role-lock span{display:block;color:#334155;font-size:13px;font-weight:900}.nzela-role-lock strong{display:block;margin-top:4px;color:#0f3b77;font-size:15px;font-weight:950}.nzela-role-lock small{display:block;margin-top:4px;color:#64748b;font-size:12px;font-weight:700;line-height:1.45}
  `;
  document.head.appendChild(style);
}

function runAuthPass() {
  addAuthStyles();
  polishAuthScreen();
  lockProfileRoleField();
}

export function applyAuthPolish() {
  document.addEventListener('submit', markAuthSubmit, true);
  const run = () => window.requestAnimationFrame(runAuthPass);
  run();
  const root = document.getElementById('root') || document.body;
  const observer = new MutationObserver(run);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => {
    document.removeEventListener('submit', markAuthSubmit, true);
    observer.disconnect();
  };
}
