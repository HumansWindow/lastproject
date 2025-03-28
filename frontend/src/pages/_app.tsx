import React from 'react';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '../contexts/auth';
import { WalletProvider } from '../contexts/wallet';
import Layout from '../components/layout/Layout';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
// Import the simpler i18n configuration that doesn't depend on external packages
import '../i18n'; 

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <WalletProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WalletProvider>
    </AuthProvider>
  );
}

export default appWithTranslation(MyApp);
