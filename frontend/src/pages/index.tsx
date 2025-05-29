import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useAuth } from "../contexts/AuthProvider";
import { useWallet } from "../contexts/WalletProvider";
import { UserProfile } from "../types/apiTypes";

export default function Home() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, isProfileComplete } = useAuth();
  const { isConnected, walletInfo } = useWallet();
  const router = useRouter();
  
  // Redirect to profile page if authenticated but profile is incomplete
  useEffect(() => {
    if (isAuthenticated && !isProfileComplete) {
      router.push('/profile');
    }
  }, [isAuthenticated, isProfileComplete, router]);
  
  return (
    <>
      <Head>
        <title>AliveHuman</title>
        <meta name="description" content="AliveHuman - Web3 Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto px-4 py-8">
        <div className="text-center my-10">
          <h1 className="text-4xl font-bold mb-6">{t('welcome')}</h1>
          
          {isAuthenticated ? (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">
                {t('welcome_back', { name: user?.firstName || 'User' })}
              </h2>
              
              <div className="mb-6">
                {walletInfo && (
                  <div className="bg-gray-100 p-4 rounded mb-4">
                    <p className="font-medium">Connected Wallet</p>
                    <p className="text-sm text-gray-700 break-all">{walletInfo.address}</p>
                    <p className="text-sm text-gray-700">Network: {walletInfo.blockchain}</p>
                  </div>
                )}
                
                <p className="mb-4">
                  You&apos;re authenticated with your blockchain wallet.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push('/profile')}
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  View Profile
                </button>
                
                <button 
                  onClick={() => router.push('/diary')}
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  My Diary
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Welcome to AliveHuman</h2>
              <p className="mb-6">
                To access the platform, please connect your wallet using the &quot;Connect Wallet&quot; button in the navigation bar above.
              </p>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">No wallet? Get started with one of these options:</p>
                <div className="flex justify-center space-x-4">
                  <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    MetaMask
                  </a>
                  <a href="https://walletconnect.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                    WalletConnect
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};
