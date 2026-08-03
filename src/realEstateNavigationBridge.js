const BRIDGE_KEY = '__nzelaRealEstateNavigationBridge';
const STYLE_ID = 'nzela-real-estate-navigation-overrides';

const BUILDING_ICON = `
  <svg data-nz-building-icon="true" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21h18" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
  </svg>
`;

function installNavigationStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .nzela-immo-nav-button {
      position: relative !important;
      font-size: 0 !important;
      line-height: 0 !important;
    }

    .nzela-immo-nav-button > svg,
    .nzela-immo-nav-button > span {
      display: none !important;
    }

    .nzela-immo-nav-button::before {
      display: none !important;
      content: none !important;
    }

    .nzela-immo-nav-button::after {
      content: '' !important;
      display: block !important;
      width: 25px !important;
      height: 25px !important;
      margin: 0 auto !important;
      background-color: currentColor !important;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 21h18'/%3E%3Cpath d='M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16'/%3E%3Cpath d='M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01'/%3E%3C/svg%3E") center / contain no-repeat !important;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 21h18'/%3E%3Cpath d='M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16'/%3E%3Cpath d='M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01'/%3E%3C/svg%3E") center / contain no-repeat !important;
    }

    .nz2-bottom-nav button.is-active {
      gap: 0 !important;
      font-size: 0 !important;
      line-height: 0 !important;
    }

    .nz2-bottom-nav button.is-active svg {
      display: block !important;
      width: 26px !important;
      height: 26px !important;
      margin: 0 auto !important;
    }
  `;
  document.head.appendChild(style);
}

function removeVisibleLabel(button) {
  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue?.trim()) nodes.push(node);
    node = walker.nextNode();
  }
  nodes.forEach((textNode) => { textNode.nodeValue = ''; });
}

function replaceButtonContent(button) {
  if (!button) return;
  button.classList.add('nzela-immo-nav-button');
  button.dataset.nzImmoNav = 'true';
  button.setAttribute('aria-label', 'Navigation Immobilier');
  button.setAttribute('title', 'Immobilier');

  const currentIcon = button.querySelector('svg');
  if (!button.querySelector('[data-nz-building-icon="true"]')) {
    if (currentIcon) currentIcon.outerHTML = BUILDING_ICON;
    else button.insertAdjacentHTML('afterbegin', BUILDING_ICON);
  }
  removeVisibleLabel(button);
}

function patchNavigation() {
  installNavigationStyles();

  const mobileNav = document.querySelector('nav[aria-label="Navigation mobile"],nav[aria-label*="mobile" i]');
  const mobileButtons = mobileNav?.querySelectorAll('button');
  if (mobileButtons?.length >= 4) replaceButtonContent(mobileButtons[2]);

  const desktopNav = document.querySelector('header nav[aria-label="Navigation principale"]');
  if (desktopNav && !desktopNav.querySelector('[data-nz-immo-nav]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'header-link nzela-immo-nav-button';
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
