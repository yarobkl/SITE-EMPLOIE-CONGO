import { Suspense, lazy, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Loader2 } from 'lucide-react';

const RealEstateExperience = lazy(() => import('./RealEstateExperienceStable.jsx'));

function cleanLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function setImmobilierLabel(button) {
  if (!button) return;
  button.classList.add('nzela-immo-nav-button');
  button.dataset.nzImmoNav = 'true';
  button.setAttribute('aria-label', 'Navigation Immobilier');
  const node = Array.from(button.childNodes || []).find((item) => item.nodeType === Node.TEXT_NODE && item.nodeValue?.trim());
  if (node && node.nodeValue.trim() !== 'Immobilier') node.nodeValue = 'Immobilier';
}

function LoadingScreen() {
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', inset: 0, zIndex: 2147481999, display: 'grid', placeItems: 'center',
        background: '#f5f7fb', color: '#0f172a', padding: 24, fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
        <span style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#1d4ed8', color: '#fff' }}><Building2 size={27} /></span>
        <strong style={{ fontSize: 18 }}>Ouverture de Nzela Immobilier</strong>
        <Loader2 size={24} style={{ animation: 'nz2-spin .75s linear infinite', color: '#1d4ed8' }} />
      </div>
    </div>,
    document.body,
  );
}

export default function RealEstateEntry() {
  const [active, setActive] = useState(() => window.location.hash === '#immobilier');

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const mobileNav = document.querySelector('nav[aria-label="Navigation mobile"]');
        const buttons = mobileNav?.querySelectorAll('button');
        if (buttons?.length >= 4) setImmobilierLabel(buttons[2]);

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
      });
    };

    const open = (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-nz-immo-nav],.nzela-immo-nav-button') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (window.location.hash !== '#immobilier') {
        window.history.pushState({ ...(window.history.state || {}), nzelaImmo: true }, '', `${cleanLocation()}#immobilier`);
      }
      setActive(true);
    };

    const syncHistory = () => setActive(window.location.hash === '#immobilier');
    const root = document.getElementById('root');
    const observer = new MutationObserver(sync);
    if (root) observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('click', open, true);
    window.addEventListener('hashchange', syncHistory);
    window.addEventListener('popstate', syncHistory);
    sync();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      document.removeEventListener('click', open, true);
      window.removeEventListener('hashchange', syncHistory);
      window.removeEventListener('popstate', syncHistory);
    };
  }, []);

  if (!active) return null;
  return <Suspense fallback={<LoadingScreen />}><RealEstateExperience /></Suspense>;
}
