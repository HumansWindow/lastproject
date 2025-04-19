import React, { useEffect } from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { WalletProvider } from '../contexts/wallet';
import { AuthProvider } from '../contexts/auth';
import { initializeDebugging } from '../utils/initialize-debug';
import Layout from '../components/layout/Layout';
import '../styles/globals.css';

// Import the ConnectionTestResult interface
import type { ConnectionTestResult } from '../utils/wallet-connection-debugger';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
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
