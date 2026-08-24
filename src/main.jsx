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

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
const adminHost = hostname === 'site-emploie-congo-6cqj.vercel.app' || hostname.startsWith('site-emploie-congo-6cqj-')
const localAdmin = import.meta.env.DEV && import.meta.env.VITE_APP_MODE === 'admin'
const isAdminApp = adminHost || localAdmin
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
