import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UnifiedAccessUX from './UnifiedAccessUX.jsx'
import MessagingCenter from './MessagingCenter.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <UnifiedAccessUX />
    <MessagingCenter />
  </React.StrictMode>,
)
