import { Suspense, lazy, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Loader2 } from 'lucide-react';

const RealEstateExperience = lazy(() => import('./RealEstateExperienceStable.jsx'));

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
    const activate = () => setActive(true);
    const syncHistory = () => setActive(window.location.hash === '#immobilier');
    window.addEventListener('nzela:open-immobilier', activate);
    window.addEventListener('hashchange', syncHistory);
    window.addEventListener('popstate', syncHistory);
    return () => {
      window.removeEventListener('nzela:open-immobilier', activate);
      window.removeEventListener('hashchange', syncHistory);
      window.removeEventListener('popstate', syncHistory);
    };
  }, []);

  if (!active) return null;
  return <Suspense fallback={<LoadingScreen />}><RealEstateExperience /></Suspense>;
}
