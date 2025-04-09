import React, { useEffect } from 'react';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '../contexts/auth';
import { WalletProvider } from '../contexts/wallet';
import Layout from '../components/layout/Layout';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { WebSocketProvider } from '../contexts/websocket';
// Import bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
// Import our i18n configuration
import '../i18n';
import nextI18NextConfig from '../../next-i18next.config.js';

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize Bootstrap JavaScript on client side
  useEffect(() => {
    // Import Bootstrap JS only on client side
    if (typeof window !== 'undefined') {
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }, []);

  return (
    <ThemeProvider attribute="data-bs-theme" defaultTheme="light">
      <AuthProvider>
        <WalletProvider>
          <WebSocketProvider autoConnect={true}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </WebSocketProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrap with next-i18next's appWithTranslation, passing the config
export default appWithTranslation(MyApp, nextI18NextConfig);
