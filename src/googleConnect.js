import { supabase } from './lib/supabase.js';

function label(node) {
  return (node?.textContent || '').trim().toLowerCase();
}

function loginBox() {
  const title = Array.from(document.querySelectorAll('h1')).find((h1) => label(h1).includes('connexion') || label(h1).includes('compte nzela'));
  return title?.closest('.space-y-5') || null;
}

function addGoogleConnect() {
  const box = loginBox();
  if (!box || box.querySelector('[data-nzela-google-connect]')) return;
  const firstCard = Array.from(box.querySelectorAll('div')).find((div) => label(div).includes('continuer avec'));
  if (!firstCard) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.nzelaGoogleConnect = 'true';
  button.className = 'nzela-google-connect';
  button.textContent = 'Continuer avec Google';
  button.addEventListener('click', async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  });
  firstCard.appendChild(button);
}

function addStyle() {
  if (document.getElementById('nzela-google-connect-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-google-connect-style';
  style.textContent = '.nzela-google-connect{margin-top:10px;min-height:48px;width:100%;border:1px solid #dbeafe;border-radius:12px;background:#fff;color:#0f172a;font-weight:950;box-shadow:0 10px 26px rgba(15,23,42,.06)}';
  document.head.appendChild(style);
}

export function applyGoogleConnect() {
  const run = () => requestAnimationFrame(() => { addStyle(); addGoogleConnect(); });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
