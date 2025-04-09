/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    localeDetection: false,
  },
  defaultNS: 'common',
  localePath: typeof window === 'undefined' ? './public/locales' : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
