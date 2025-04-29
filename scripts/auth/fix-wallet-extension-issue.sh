#!/bin/bash

# Create directory for patches if it doesn't exist
mkdir -p /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend/public/patches

# Create wallet extension guard script
cat > /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend/public/patches/wallet-guard.js << 'EOFJS'
/**
 * Wallet Extension Guard Script
 * Prevents "Cannot read properties of null (reading 'type')" errors
 * from wallet extensions like Binance Wallet
 */
(function() {
  // Keep original console.error to preserve logging functionality
  const originalConsoleError = console.error;
  
  // Wrap with safe error handling for wallet extension errors
  console.error = function(...args) {
    // Check if this is a wallet extension error we want to intercept
    const errorString = args.join(' ');
    if (
      errorString.includes("Cannot read properties of null (reading 'type')") && 
      (
        errorString.includes('inpage.js') || 
        errorString.includes('binanceInjectedProvider')
      )
    ) {
      // Log a more helpful message instead
      console.warn('[Wallet Extension] Prevented uncaught error from wallet extension');
      return; // Intercept error
    }
    
    // Pass through to original console.error for all other errors
    originalConsoleError.apply(console, args);
  };
  
  // Add safety protection for BinanceChain global
  if (typeof window !== 'undefined') {
    // Use Object.defineProperty to create a safe BinanceChain object if it doesn't exist
    if (!window.BinanceChain) {
      Object.defineProperty(window, 'BinanceChain', {
        value: new Proxy({}, {
          get(target, prop) {
            // Return safe values for common properties
            if (prop === 'type' || prop === 'chain') return '';
            if (typeof prop === 'string' && prop.startsWith('on')) return () => {};
            if (prop === 'request') return async () => ({ result: [] });
            return undefined;
          }
        }),
        writable: true,
        configurable: true
      });
    }
  }
})();
EOFJS

# Update _document.js to include the guard script
mkdir -p /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend/src/pages
cat > /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend/src/pages/_document.tsx << 'EOFTS'
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Load wallet extension guard script before all other scripts */}
          <script src="/patches/wallet-guard.js" strategy="beforeInteractive" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
EOFTS

# Apply executable permissions to the script
chmod +x /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/fix-wallet-extension-issue.sh

echo "✅ Script created: fix-wallet-extension-issue.sh"
echo "Run it to patch your project with the wallet extension error fix"
