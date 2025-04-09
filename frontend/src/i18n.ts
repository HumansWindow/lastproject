import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Create a simpler configuration that doesn't rely on external dependencies
const resources = {
  en: {
    common: {
      welcome: 'Welcome to AliveHuman',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      home: 'Home',
      dashboard: 'Dashboard',
      logout: 'Logout',
      connect_wallet: 'Connect Wallet',
      disconnect: 'Disconnect',
      // WebSocket related translations
      websocket_connected: 'Connected to real-time updates',
      websocket_connecting: 'Connecting to server...',
      websocket_disconnected: 'Not connected to real-time updates',
      websocket_error: 'Connection error',
      websocket_reconnecting: 'Reconnecting to server...',
      retry_connection: 'Retry Connection',
      connection_status: 'Connection Status',
      connection_time: 'Connected for {{time}}',
      connection_attempts: 'Reconnection attempt {{current}} of {{max}}',
      connection_failed: 'Connection failed: {{reason}}',
      connection_closed: 'Connection closed',
      websocket_timeout: 'Connection timed out'
    }
  }
};

// Track initialization status with a module-level variable instead of attaching to i18n
let clientPluginsLoaded = false;

// Initialize i18n with common settings that work for both server and client
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        useSuspense: false, // React Suspense not yet compatible with SSR
      },
      // This allows us to load translations from files in public/locales/
      ns: ['common'],
    });
}

// For browser-only features
if (typeof window !== 'undefined' && !clientPluginsLoaded) {
  clientPluginsLoaded = true;
  
  // Load browser-specific plugins
  const loadBrowserPlugins = async () => {
    try {
      const [
        LanguageDetector, 
        Backend
      ] = await Promise.all([
        import('i18next-browser-languagedetector').then(m => m.default).catch(() => null),
        import('i18next-http-backend').then(m => m.default).catch(() => null)
      ]);

      if (LanguageDetector) {
        i18n.use(LanguageDetector);
        console.log('Language detector loaded successfully');
      }

      if (Backend) {
        i18n.use(Backend);
        console.log('Backend loader loaded successfully');
        
        // Configure backend settings if this method exists
        if (i18n.services?.backendConnector?.backend?.options) {
          i18n.services.backendConnector.backend.options = {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load advanced i18n features:', error);
    }
  };
  
  loadBrowserPlugins();
}

export default i18n;
export { i18n };

// Replace serverSideTranslations with a client-side alternative
export const getI18nProps = async (locale: string, namespaces: string[] = ['common']) => {
  // Return empty props as we're handling translations client-side only now
  return {
    _nextI18Next: {
      initialLocale: locale,
      ns: namespaces,
      initialI18nStore: {
        [locale]: namespaces.reduce((acc, ns) => {
          acc[ns] = resources[locale as keyof typeof resources]?.[ns as keyof typeof resources[keyof typeof resources]] || {};
          return acc;
        }, {} as Record<string, any>)
      }
    }
  };
};
