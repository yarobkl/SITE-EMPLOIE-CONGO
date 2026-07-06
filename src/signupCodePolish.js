import { hasSupabaseConfig, supabase } from './lib/supabase';

const STORE = 'nzela.pendingSignupEmail';

function textOf(node) {
  return (node?.textContent || '').trim();
}

function addStyle() {
  if (document.getElementById('nzela-signup-code-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-signup-code-style';
  style.textContent = '.nzela-code-panel{border:1px solid #bfdbfe;border-radius:18px;background:#eff6ff;padding:16px}.nzela-code-panel strong{display:block;color:#0f3b77;font-size:16px;font-weight:950}.nzela-code-panel p{margin-top:6px;color:#475569;font-size:13px;font-weight:750;line-height:1.55}.nzela-code-panel input{margin-top:12px;min-height:46px;width:100%;border:1px solid #bfdbfe;border-radius:12px;background:white;padding:0 12px;color:#0f172a;font-size:18px;font-weight:950;letter-spacing:.18em;text-align:center}.nzela-code-panel button{margin-top:10px;min-height:44px;width:100%;border-radius:12px;background:#0f3b77;color:white;font-size:14px;font-weight:950}.nzela-code-panel span{display:block;margin-top:8px;color:#0f3b77;font-size:12px;font-weight:800;line-height:1.45}.nzela-code-panel span.error{color:#991b1b}';
  document.head.appendChild(style);
}

function captureSignupEmail() {
  const loginTitle = Array.from(document.querySelectorAll('h1,h2,h3')).find((node) => textOf(node).includes('Créer un compte') || textOf(node).includes('Creer un compte'));
  if (!loginTitle) return;
  const form = Array.from(document.querySelectorAll('form')).find((node) => textOf(node).includes('Email') && textOf(node).includes('Mot de passe'));
  if (!form || form.dataset.nzelaSignupCapture === 'true') return;
  form.dataset.nzelaSignupCapture = 'true';
  form.addEventListener('submit', () => {
    const email = form.querySelector('input[type="email"]')?.value?.trim();
    if (email) localStorage.setItem(STORE, email);
  }, true);
}

async function verifyCode(email, token, messageNode) {
  if (!hasSupabaseConfig || !supabase) {
    messageNode.textContent = 'Verification indisponible pour le moment.';
    messageNode.className = 'error';
    return;
  }
  const code = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) {
    messageNode.textContent = 'Entre le code a 6 chiffres recu par email.';
    messageNode.className = 'error';
    return;
  }
  messageNode.textContent = 'Verification en cours...';
  messageNode.className = '';
  let result = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (result.error) {
    result = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
  }
  if (result.error) {
    messageNode.textContent = result.error.message || 'Code invalide ou expire.';
    messageNode.className = 'error';
    return;
  }
  localStorage.removeItem(STORE);
  messageNode.textContent = 'Email verifie. Connexion en cours...';
  window.setTimeout(() => window.location.reload(), 800);
}

function addPanel() {
  const email = localStorage.getItem(STORE);
  if (!email) return;
  if (document.querySelector('[data-nzela-code-panel]')) return;
  const title = Array.from(document.querySelectorAll('h1')).find((node) => ['Profil', 'Mon espace', 'Connexion à Nzela Jobs', 'Connexion a Nzela Jobs'].some((label) => textOf(node).includes(label)));
  const container = title?.closest('.space-y-5') || title?.parentElement?.parentElement;
  if (!container) return;
  const panel = document.createElement('section');
  panel.dataset.nzelaCodePanel = 'true';
  panel.className = 'nzela-code-panel';
  panel.innerHTML = `<strong>Confirme ton email</strong><p>Un code de verification a ete envoye a ${email}. Entre le code a 6 chiffres pour activer ton compte Nzela Jobs.</p><input inputmode="numeric" maxlength="6" placeholder="000000" aria-label="Code de confirmation"><button type="button">Verifier mon email</button><span>Le code expire rapidement. Verifie aussi tes spams.</span>`;
  const input = panel.querySelector('input');
  const button = panel.querySelector('button');
  const message = panel.querySelector('span');
  button.addEventListener('click', () => verifyCode(email, input.value, message));
  container.insertBefore(panel, container.firstChild);
}

export function applySignupCodePolish() {
  const run = () => requestAnimationFrame(() => { addStyle(); captureSignupEmail(); addPanel(); });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
