import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MessagingCenterV2 from './MessagingCenterV2.jsx'
import MessagingKeyboardShortcut from './MessagingKeyboardShortcut.jsx'
import GlobalApplicationsCenterV2 from './GlobalApplicationsCenterV2.jsx'
import PlatformPresenceTracker from './PlatformPresenceTracker.jsx'
import AdminPlatformDashboard from './AdminPlatformDashboard.jsx'
import OfferLifecycleCenter from './OfferLifecycleCenter.jsx'
import OfferLifecycleMobileTrigger from './OfferLifecycleMobileTrigger.jsx'
import MotionFoundation from './MotionFoundation.jsx'
import NavigationExperience from './NavigationExperience.jsx'
import CandidateJourneyExperience from './CandidateJourneyExperience.jsx'
import PrivacyComplianceExperience from './PrivacyComplianceExperience.jsx'
import JobViewCounterExperience from './JobViewCounterExperience.jsx'
import TalentMarketplaceExperience from './TalentMarketplaceExperience.jsx'
import RecruiterVerificationAdmin from './RecruiterVerificationAdmin.jsx'
import './nzela-mobile-shell-fixes.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <MessagingCenterV2 />
    <MessagingKeyboardShortcut />
    <GlobalApplicationsCenterV2 />
    <PlatformPresenceTracker />
    <AdminPlatformDashboard />
    <OfferLifecycleCenter />
    <OfferLifecycleMobileTrigger />
    <MotionFoundation />
    <NavigationExperience />
    <CandidateJourneyExperience />
    <PrivacyComplianceExperience />
    <JobViewCounterExperience />
    <TalentMarketplaceExperience />
    <RecruiterVerificationAdmin />
  </React.StrictMode>,
)
