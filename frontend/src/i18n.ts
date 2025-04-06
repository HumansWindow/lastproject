import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Create a simpler configuration that doesn't rely on external dependencies
// that might not be installed yet
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
    }
  }
};

// Initialize i18n with basic configuration
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
    }
  });

// Dynamically load and apply advanced features if the dependencies are available
const loadAdvancedFeatures = async () => {
  try {
    const [
      LanguageDetector, 
      Backend
    ] = await Promise.all([
      import('i18next-browser-languagedetector').catch(() => null),
      import('i18next-http-backend').catch(() => null)
    ]);

    if (LanguageDetector) {
      i18n.use(LanguageDetector.default);
      console.log('Language detector loaded successfully');
    }

    if (Backend) {
      i18n.use(Backend.default);
      console.log('Backend loader loaded successfully');
    }

    // Only reinitialize if we loaded additional plugins
    if (LanguageDetector || Backend) {
      await i18n.init({
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        ns: ['common'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
        // Backend options if available
        ...(Backend ? {
          backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
          }
        } : {})
      });
    }
  } catch (error) {
    console.warn('Failed to load advanced i18n features:', error);
  }
};

// Try to load advanced features, but don't block initialization
if (typeof window !== 'undefined') {
  loadAdvancedFeatures();
}

export default i18n;
