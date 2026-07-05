import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyBrandPolish } from './brandPolish.js'
import { applyPricingPolish } from './pricingPolish.js'
import { applyAuthPolish } from './authPolish.js'
import { applyExperiencePolish } from './experiencePolish.js'

function BrandedApp() {
  useEffect(() => {
    const cleanupBrand = applyBrandPolish()
    const cleanupPricing = applyPricingPolish()
    const cleanupAuth = applyAuthPolish()
    const cleanupExperience = applyExperiencePolish()
    return () => {
      cleanupBrand?.()
      cleanupPricing?.()
      cleanupAuth?.()
      cleanupExperience?.()
    }
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandedApp />
  </React.StrictMode>,
)
