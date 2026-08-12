import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.macvel.azhagutamil',
  appName: 'தமிழ் யாப்பு',
  webDir: 'dist/language_app/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFBF5'
    }
  }
};

export default config;
