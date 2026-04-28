import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medlinkai.app',
  appName: 'Medical Assistant AI',
  webDir: 'dist',
  server: {
    // Allow the app to make requests to external APIs (Gemini, Supabase, Tavily)
    allowNavigation: [
      'generativelanguage.googleapis.com',
      '*.supabase.co',
      'api.tavily.com',
    ],
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8CBF82',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    }
  }
};

export default config;
