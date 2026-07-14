import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile',
  webDir: 'dist/language_app/browser',
  server: {
    // androidScheme: 'https',
    cleartext: true
  }
};

export default config;
