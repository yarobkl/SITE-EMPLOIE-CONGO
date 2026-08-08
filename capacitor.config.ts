import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant provisoire tant que le Bundle ID n'est pas enregistré dans Apple Developer.
  appId: 'com.nzela.app',
  appName: 'Nzela',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
};

export default config;
