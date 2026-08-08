import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'தமிழ் யாப்பு',
  webDir: 'dist/language_app/browser',
  server: {
    androidScheme: 'http',
    // url: 'http://192.168.1.60:4200',
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
