const BRIDGE_KEY = '__nzelaRealEstateNavigationBridge';

const BUILDING_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21h18" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
  </svg>
`;

function replaceButtonLabel(button) {
  if (!button) return;
  button.classList.add('nzela-immo-nav-button');
  button.dataset.nzImmoNav = 'true';
  button.setAttribute('aria-label', 'Navigation Immobilier');
  button.setAttribute('title', 'Immobilier');

  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  let fallback = null;
  while (node) {
    const value = node.nodeValue?.trim() || '';
    if (value) fallback = node;
    if (/^(Suivi|Immobilier)$/i.test(value)) {
      node.nodeValue = '';
      return;
    }
    node = walker.nextNode();
  }
  if (fallback) fallback.nodeValue = '';
}

function patchNavigation() {
  const mobileNav = document.querySelector('nav[aria-label="Navigation mobile"],nav[aria-label*="mobile" i]');
  const mobileButtons = mobileNav?.querySelectorAll('button');
  if (mobileButtons?.length >= 4) replaceButtonLabel(mobileButtons[2]);

  const desktopNav = document.querySelector('header nav[aria-label="Navigation principale"]');
  if (desktopNav && !desktopNav.querySelector('[data-nz-immo-nav]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'header-link';
    button.dataset.nzImmoNav = 'true';
    button.setAttribute('aria-label', 'Immobilier');
    button.setAttribute('title', 'Immobilier');
    button.innerHTML = BUILDING_ICON;
    desktopNav.querySelector('button')?.insertAdjacentElement('afterend', button);
  }
}

function openImmobilier(event) {
  const target = event.target instanceof Element
    ? event.target.closest('[data-nz-immo-nav],.nzela-immo-nav-button')
    : null;
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  if (window.location.hash !== '#immobilier') window.location.hash = 'immobilier';
  window.dispatchEvent(new CustomEvent('nzela:open-immobilier'));
}

if (!window[BRIDGE_KEY]) {
  let frame = 0;
  const schedulePatch = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(patchNavigation);
  };

  const observer = new MutationObserver(schedulePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', openImmobilier, true);
  const interval = window.setInterval(schedulePatch, 1200);
  [0, 40, 120, 350, 900].forEach((delay) => window.setTimeout(schedulePatch, delay));

  window[BRIDGE_KEY] = { observer, interval, schedulePatch };
}
