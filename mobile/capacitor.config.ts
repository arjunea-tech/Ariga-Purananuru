import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'mobile',
  webDir: 'dist/language_app/browser',
  server: {
    url: 'http://192.168.1.60:4200',
    cleartext: true
  }
};

export default config;
