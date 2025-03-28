import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useAuth } from '@/contexts/auth';
import { WalletConnectButton } from '../WalletConnectButton';

const Navbar: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <span className="text-xl font-bold">AliveHuman</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/">
            <span className="hover:text-blue-200">{t('home')}</span>
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <span className="hover:text-blue-200">{t('dashboard')}</span>
              </Link>
              <button 
                onClick={logout}
                className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
              >
                {t('logout')}
              </button>
              <span className="ml-2">{user?.email}</span>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="hover:text-blue-200">{t('login')}</span>
              </Link>
              <Link href="/register">
                <span className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100">
                  {t('register')}
                </span>
              </Link>
            </>
          )}
          
          {/* Wallet Connect Button */}
          <WalletConnectButton className="ml-4" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
