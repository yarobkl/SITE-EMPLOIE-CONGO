import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPortal from './AdminPortal.jsx'
import MotionFoundation from './MotionFoundation.jsx'
import NavigationExperience from './NavigationExperience.jsx'
import CandidateJourneyExperience from './CandidateJourneyExperience.jsx'
import OnboardingReliabilityExperience from './OnboardingReliabilityExperience.jsx'
import DeferredPlatformEnhancements from './DeferredPlatformEnhancements.jsx'
import './nzela-mobile-shell-fixes.css'
import './index.css'

const isAdminApp = import.meta.env.VITE_APP_MODE === 'admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminApp ? (
      <AdminPortal />
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
