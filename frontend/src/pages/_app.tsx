import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { WalletProvider } from "../contexts/WalletProvider";
import { AuthProvider } from "../contexts/AuthProvider";
import { initializeDebugging } from "../utils/initializeDebug";
import Layout from "../components/layout/Layout";
import '../styles/globals.css';
// Import game section styles
import '../styles/game/section-base.css';
import '../styles/game/section-text-image.css';
import '../styles/game/section-card-carousel.css';
import '../styles/game/section-timeline.css';
import '../styles/game/section-galaxy-background.css';
import '../styles/game/animations.css';
// Import i18n instance to ensure it's initialized early
import '../i18n';
// Import wallet initialization safety layer
import { initializeWalletSafely } from "../services/wallet/walletInitialization";

// Import the ConnectionTestResult interface
import type { ConnectionTestResult } from "../utils/walletConnectionDebugger";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize wallet environment safely before any wallet extensions try to access it
    // This prevents the "Cannot read properties of null (reading 'type')" error
    initializeWalletSafely().catch(err => {
      console.warn('Wallet initialization error (non-critical):', err);
    });

    // Initialize debugging in development mode
    if (process.env.NODE_ENV === 'development') {
      initializeDebugging();
      
      // Add our automatic wallet connection check & fix only when debug parameter is present
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('debug')) {
        const autoFixConnectivity = async () => {
          if (typeof window !== 'undefined' && (window as any).walletConnectionDebugger) {
            console.log('🔍 Running automatic wallet connectivity check...');
            const results = await (window as any).walletConnectionDebugger.testBackendConnectivity();
            
            if (!results.some((r: ConnectionTestResult) => r.success)) {
              console.log('🔧 No working wallet connections found, attempting fix...');
              await (window as any).walletConnectionDebugger.fixConnectivityIssues();
            } else {
              console.log('✅ Wallet backend connectivity verified');
            }
          }
        };
        
        // Run the connectivity check after a short delay to let the app initialize
        setTimeout(autoFixConnectivity, 2000);
      }
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
