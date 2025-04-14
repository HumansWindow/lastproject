import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { WalletProvider } from '../contexts/wallet';
import { AuthProvider } from '../contexts/auth';
import { initializeAuthDebugging } from '../utils/initialize-debug';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize auth debugging in development mode
    if (process.env.NODE_ENV === 'development') {
      initializeAuthDebugging();
    }
  }, []);

  return (
    <WalletProvider>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </WalletProvider>
  );
}

export default appWithTranslation(MyApp);
