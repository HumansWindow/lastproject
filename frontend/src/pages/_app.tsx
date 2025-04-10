import React from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { WalletProvider } from '../contexts/wallet';
import { AuthProvider } from '../contexts/auth';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
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
