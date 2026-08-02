const BRIDGE_KEY = '__nzelaRealEstateNavigationBridge';

function cleanLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function replaceButtonLabel(button) {
  if (!button) return;
  button.classList.add('nzela-immo-nav-button');
  button.dataset.nzImmoNav = 'true';
  button.setAttribute('aria-label', 'Navigation Immobilier');

  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  let fallback = null;
  while (node) {
    const value = node.nodeValue?.trim() || '';
    if (value) fallback = node;
    if (/^(Suivi|Immobilier)$/i.test(value)) {
      node.nodeValue = 'Immobilier';
      return;
    }
    node = walker.nextNode();
  }
  if (fallback) fallback.nodeValue = 'Immobilier';
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
    button.textContent = 'Immobilier';
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
  if (window.location.hash !== '#immobilier') {
    window.history.pushState(
      { ...(window.history.state || {}), nzelaImmo: true },
      '',
      `${cleanLocation()}#immobilier`,
    );
  }
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
