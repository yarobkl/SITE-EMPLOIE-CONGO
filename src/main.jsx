import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyBrandPolish } from './brandPolish.js'

function BrandedApp() {
  useEffect(() => {
    const cleanup = applyBrandPolish()
    return cleanup
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandedApp />
  </React.StrictMode>,
)
