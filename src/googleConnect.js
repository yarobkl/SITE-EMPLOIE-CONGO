function label(node) {
  return (node?.textContent || '').trim().toLowerCase();
}

function fixExistingGoogleButton() {
  const googleButton = Array.from(document.querySelectorAll('button')).find((button) => label(button) === 'google' || label(button).includes('google'));
  if (!googleButton) return;

  googleButton.disabled = false;
  googleButton.removeAttribute('disabled');
  googleButton.setAttribute('aria-disabled', 'false');
  googleButton.classList.add('nzela-google-enabled');
}

function removeDuplicateGoogleButton() {
  document.querySelectorAll('[data-nzela-google-connect]').forEach((button) => button.remove());
}

function addStyle() {
  if (document.getElementById('nzela-google-connect-style')) return;
  const style = document.createElement('style');
  style.id = 'nzela-google-connect-style';
  style.textContent = '.nzela-google-enabled{opacity:1!important;cursor:pointer!important}.nzela-google-enabled:disabled{opacity:1!important;cursor:pointer!important}';
  document.head.appendChild(style);
}

export function applyGoogleConnect() {
  const run = () => requestAnimationFrame(() => {
    addStyle();
    removeDuplicateGoogleButton();
    fixExistingGoogleButton();
  });
  run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true, characterData: true });
  return () => observer.disconnect();
}
