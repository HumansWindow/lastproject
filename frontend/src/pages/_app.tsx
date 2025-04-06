import React, { useEffect } from 'react';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '../contexts/auth';
import { WalletProvider } from '../contexts/wallet';
import Layout from '../components/layout/Layout';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import useWebSocket from '../hooks/useWebSocket';
// Import bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
// Import the simpler i18n configuration that doesn't depend on external packages
import '../i18n'; 

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize WebSocket connection
  useWebSocket();
  
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
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default appWithTranslation(MyApp);
