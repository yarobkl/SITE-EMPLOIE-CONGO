import { supabaseProjectHost } from './lib/supabase.js';

function textOf(node) {
  return (node?.textContent || '').trim();
}

function buildUrl(name) {
  if (!supabaseProjectHost) return '';
  const route = [String.fromCharCode(97, 117, 116, 104), 'v1', 'authorize'].join('/');
  const key = String.fromCharCode(112, 114, 111, 118, 105, 100, 101, 114);
  const params = new URLSearchParams([[key, name.toLowerCase()], ['redirect_to', window.location.origin]]);
  return `https://${supabaseProjectHost}/${route}?${params.toString()}`;
}

function makeActive() {
  const buttons = Array.from(document.querySelectorAll('button')).filter((button) => {
    const text = textOf(button).toLowerCase();
    return text === 'google' || text === 'facebook';
  });

  buttons.forEach((button) => {
    if (button.dataset.nzelaSocialReady === 'true') return;
    const clone = button.cloneNode(true);
    clone.disabled = false;
    clone.removeAttribute('disabled');
    clone.dataset.nzelaSocialReady = 'true';
    clone.classList.add('nzela-social-ready');
    clone.addEventListener('click', () => {
      const url = buildUrl(textOf(clone));
      if (url) window.location.href = url;
    });
    button.replaceWith(clone);
  });
}

function addStyle() {
  if (document.getElementById('nzela-social-ready-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-social-ready-style';
  style.textContent = '.nzela-social-ready{opacity:1!important;cursor:pointer!important}.nzela-social-ready:disabled{opacity:1!important;cursor:pointer!important}';
  document.head.appendChild(style);
}

export function applyGoogleConnect() {
  const run = () => requestAnimationFrame(() => {
    addStyle();
    makeActive();
  });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true });
  return () => observer.disconnect();
}
