import React from 'react';
import { useTranslation } from 'next-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  
  return (
    <footer className="bg-gray-800 text-white p-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">AliveHuman</h3>
            <p>{t('footerTagline')}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3">{t('links')}</h4>
            <ul>
              <li><a href="#" className="hover:text-gray-300">{t('about')}</a></li>
              <li><a href="#" className="hover:text-gray-300">{t('terms')}</a></li>
              <li><a href="#" className="hover:text-gray-300">{t('privacy')}</a></li>
              <li><a href="#" className="hover:text-gray-300">{t('contact')}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6">
          <p className="text-center text-gray-400">
            © {new Date().getFullYear()} AliveHuman. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
