import React, { useState } from 'react';
import { useRouter } from 'next/router';
import walletService, { WalletProviderType } from '../../services/wallet';
import DebugWrapper from '../../components/debug/DebugWrapper';
import { useAuthDebug } from '../../hooks/useAuthDebug';

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
      
      // 1. Connect to wallet
      const connectResult = await walletService.connect(WalletProviderType.METAMASK);
      if (!connectResult || !connectResult.success) {
        throw new Error('Failed to connect to wallet');
      }
      
      const walletInfo = connectResult.walletInfo;
      if (!walletInfo) {
        throw new Error('No wallet info returned');
      }
      
      // 2. Request challenge
      const challengeResult = await walletService.getChallenge(walletInfo.address);
      const challenge = challengeResult.nonce || challengeResult.message || '';
      
      // 3. Sign the challenge with the wallet
      const signResult = await walletService.signMessage(challenge, walletInfo);
      const signature = typeof signResult === 'string' ? signResult : 
                       (signResult.signature || '');
      
      // 4. Authenticate with backend
      const authResult = await walletService.authenticate(walletInfo, signature, challenge);
      
      // 5. Handle successful authentication
      console.log('Authentication successful:', authResult);
      
      // 6. Redirect to dashboard or home page
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
