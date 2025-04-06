import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translations directly instead of from files
const resources = {
  en: {
    common: require('../public/locales/en/common.json')
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
