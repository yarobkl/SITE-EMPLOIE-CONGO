import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Loader2 } from 'lucide-react';
import './real-estate-entry.css';

const RealEstateExperience = lazy(() => import('./RealEstateExperienceStable.jsx'));

function cleanLocation() {
  return `${window.location.pathname}${window.location.search}`;
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

  const openImmobilier = useCallback(() => {
    if (window.location.hash !== '#immobilier') {
      window.history.pushState({ ...(window.history.state || {}), nzelaImmo: true }, '', `${cleanLocation()}#immobilier`);
    }
    setActive(true);
  }, []);

  useEffect(() => {
    const activate = () => openImmobilier();
    const syncHistory = () => setActive(window.location.hash === '#immobilier');
    window.addEventListener('nzela:open-immobilier', activate);
    window.addEventListener('hashchange', syncHistory);
    window.addEventListener('popstate', syncHistory);
    return () => {
      window.removeEventListener('nzela:open-immobilier', activate);
      window.removeEventListener('hashchange', syncHistory);
      window.removeEventListener('popstate', syncHistory);
    };
  }, [openImmobilier]);

  return (
    <>
      {!active && createPortal(
        <button type="button" className="nz-immo-entry-trigger" aria-label="Navigation Immobilier" onClick={openImmobilier}>
          <Building2 aria-hidden="true" />
          <span>Immobilier</span>
        </button>,
        document.body,
      )}
      {active && <Suspense fallback={<LoadingScreen />}><RealEstateExperience /></Suspense>}
    </>
  );
}
