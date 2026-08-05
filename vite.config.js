import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function talentMarketplaceLucideCompatibility() {
  return {
    name: 'nzela-talent-lucide-compatibility',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/TalentMarketplaceExperience.jsx')) return null
      return code
        .replaceAll('BriefcaseBusiness', 'Briefcase')
        .replaceAll('UserRoundSearch', 'User')
    },
  }
}

export default defineConfig({
  plugins: [talentMarketplaceLucideCompatibility(), react()],
  server: {
    port: 3000,
    open: true
  }
})
