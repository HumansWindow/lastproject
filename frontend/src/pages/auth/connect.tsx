import React, { useState } from 'react';
import { useRouter } from 'next/router';
import walletService from "../../services/wallet/walletService";
import { WalletProviderType } from "../../services/wallet/core/walletBase";
import DebugWrapper from "../../components/debug/DebugWrapper";
import { useAuthDebug } from "../../hooks/useAuthDebug";

// Define the static methods that walletService.constructor should have
interface WalletServiceConstructor {
  connectAndAuthenticate: () => Promise<{accessToken?: string}>;
}

const WalletConnectPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Initialize the auth debugger (auto-start in development)
  const { isDebugging } = useAuthDebug(true);

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the static connectAndAuthenticate method with proper typing
      // Convert constructor to unknown first to avoid type compatibility issues
      const authResponse = await ((walletService.constructor as unknown) as WalletServiceConstructor).connectAndAuthenticate();
      
      if (!authResponse || !authResponse.accessToken) {
        throw new Error('Failed to authenticate wallet');
      }
      
      // Handle successful authentication
      console.log('Authentication successful');
      
      // Redirect to dashboard or home page
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <DebugWrapper autoStartDebugging={true}>
      <div className="auth-container">
        <h1>Connect your wallet</h1>
        
        <button 
          onClick={handleConnectWallet} 
          disabled={isLoading}
          className="connect-button"
        >
          {isLoading ? 'Connecting...' : 'Connect with MetaMask'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
        
        {isDebugging && (
          <div className="debug-info">
            <p>🔍 Debug mode is active! Check the debug panel and console for details.</p>
          </div>
        )}
      </div>
    </DebugWrapper>
  );
};

export default WalletConnectPage;
