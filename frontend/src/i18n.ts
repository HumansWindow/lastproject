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

// Initialize i18n immediately with initReactI18next
i18n
  .use(initReactI18next) // This fixes the warning by passing i18n to react-i18next
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
  });

// Track initialization status with a module-level variable
let clientPluginsLoaded = false;

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
      }

      if (Backend) {
        i18n.use(Backend);
        
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
