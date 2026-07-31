import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UnifiedAccessUX from './UnifiedAccessUX.jsx'
import MessagingCenterV2 from './MessagingCenterV2.jsx'
import GlobalApplicationsCenterV2 from './GlobalApplicationsCenterV2.jsx'
import PlatformPresenceTracker from './PlatformPresenceTracker.jsx'
import AdminPlatformDashboard from './AdminPlatformDashboard.jsx'
import OfferLifecycleCenter from './OfferLifecycleCenter.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <UnifiedAccessUX />
    <MessagingCenterV2 />
    <GlobalApplicationsCenterV2 />
    <PlatformPresenceTracker />
    <AdminPlatformDashboard />
    <OfferLifecycleCenter />
  </React.StrictMode>,
)
