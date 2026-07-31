import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UnifiedAccessUX from './UnifiedAccessUX.jsx'
import MessagingCenterV2 from './MessagingCenterV2.jsx'
import GlobalApplicationsCenter from './GlobalApplicationsCenter.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <UnifiedAccessUX />
    <MessagingCenterV2 />
    <GlobalApplicationsCenter />
  </React.StrictMode>,
)
