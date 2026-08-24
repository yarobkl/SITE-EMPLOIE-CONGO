import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MotionFoundation from './MotionFoundation.jsx'
import NavigationExperience from './NavigationExperience.jsx'
import CandidateJourneyExperience from './CandidateJourneyExperience.jsx'
import OnboardingReliabilityExperience from './OnboardingReliabilityExperience.jsx'
import DeferredPlatformEnhancements from './DeferredPlatformEnhancements.jsx'
import './nzela-mobile-shell-fixes.css'
import './index.css'

const adminHost = typeof window !== 'undefined' && window.location.hostname.includes('site-emploie-congo-6cqj')
const isAdminApp = import.meta.env.VITE_APP_MODE === 'admin' || adminHost
const AdminPortal = lazy(() => import('./NzelaAdminPortal.jsx'))

if (isAdminApp && typeof document !== 'undefined') {
  document.title = 'Nzela Admin — Centre de contrôle'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminApp ? (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">Chargement de Nzela Admin…</div>}>
        <AdminPortal />
      </Suspense>
    ) : (
      <>
        <App />
        <MotionFoundation />
        <NavigationExperience />
        <CandidateJourneyExperience />
        <OnboardingReliabilityExperience />
        <DeferredPlatformEnhancements />
      </>
    )}
  </React.StrictMode>,
)
