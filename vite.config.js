import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function talentMarketplaceCompatibility() {
  return {
    name: 'nzela-talent-marketplace-compatibility',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/TalentMarketplaceExperience.jsx')) return null
      return code
        .replaceAll('BriefcaseBusiness', 'Briefcase')
        .replaceAll('UserRoundSearch', 'User')
        .replaceAll("profile?.role === 'recruteur'", "(profile?.role === 'recruteur' && profile?.email?.toLowerCase() !== 'eliebakala@gmail.com')")
        .replaceAll("profile.role === 'recruteur'", "(profile.role === 'recruteur' && profile.email?.toLowerCase() !== 'eliebakala@gmail.com')")
        .replaceAll("profile?.role === 'admin'", "(profile?.role === 'admin' || profile?.email?.toLowerCase() === 'eliebakala@gmail.com')")
        .replaceAll("profile.role === 'admin'", "(profile.role === 'admin' || profile.email?.toLowerCase() === 'eliebakala@gmail.com')")
    },
  }
}

export default defineConfig({
  plugins: [talentMarketplaceCompatibility(), react()],
  server: {
    port: 3000,
    open: true
  }
})
