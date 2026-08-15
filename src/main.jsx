import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PasswordRecoveryExperience from './PasswordRecoveryExperience.jsx'
import MotionFoundation from './MotionFoundation.jsx'
import NavigationExperience from './NavigationExperience.jsx'
import CandidateJourneyExperience from './CandidateJourneyExperience.jsx'
import OnboardingReliabilityExperience from './OnboardingReliabilityExperience.jsx'
import DeferredPlatformEnhancements from './DeferredPlatformEnhancements.jsx'
import './nzela-mobile-shell-fixes.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PasswordRecoveryExperience />
    <App />
    <MotionFoundation />
    <NavigationExperience />
    <CandidateJourneyExperience />
    <OnboardingReliabilityExperience />
    <DeferredPlatformEnhancements />
  </React.StrictMode>,
)
