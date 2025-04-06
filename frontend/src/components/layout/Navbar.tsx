import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useAuth } from '@/contexts/auth';
import { WalletConnectButton } from '../WalletConnectButton';
import ThemeToggle from '../ThemeToggle';

const Navbar: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          AliveHuman
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/" className="hover:text-blue-200">
            {t('home')}
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-200">
                {t('dashboard')}
              </Link>
              <Link href="/diary" className="hover:text-blue-200">
                {t('diary')}
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
              <Link href="/login" className="hover:text-blue-200">
                {t('login')}
              </Link>
              <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100">
                {t('register')}
              </Link>
            </>
          )}
          
          {/* Theme Toggle Button */}
          <div className="ml-2">
            <ThemeToggle />
          </div>
          
          {/* Wallet Connect Button */}
          <WalletConnectButton className="ml-4" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
