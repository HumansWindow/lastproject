import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '../contexts/wallet';
import { useAuth } from '../contexts/auth';
import { WalletProviderType } from '../services/wallet';
import { WalletConnectButton } from '../components/WalletConnectButton';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isConnected, walletInfo } = useWallet();
  const { isAuthenticated, authenticateWithWallet, isLoading, error } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // Handle authentication once wallet is connected
  const handleWalletAuth = React.useCallback(async () => {
    if (isConnected) {
      setAuthError(null);
      const success = await authenticateWithWallet(email);
      
      if (!success) {
        setAuthError('Failed to authenticate with wallet. Please try again.');
      }
    }
  }, [isConnected, authenticateWithWallet, email]);
  
  // Auto-authenticate when wallet is connected
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      handleWalletAuth();
    }
  }, [isConnected, isAuthenticated, isLoading, handleWalletAuth]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to Your Account</h1>
        
        {(error || authError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error || authError}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (for notifications)"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Adding an email is optional but recommended for account recovery
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            {isConnected ? (
              <button
                onClick={handleWalletAuth}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? 'Authenticating...' : 'Login with Connected Wallet'}
              </button>
            ) : (
              <div className="space-y-3">
                <WalletConnectButton 
                  className="w-full"
                  providerType={WalletProviderType.METAMASK}
                />
                
                <WalletConnectButton
                  className="w-full"
                  providerType={WalletProviderType.WALLETCONNECT}
                />
              </div>
            )}
            
            {isConnected && (
              <div className="text-sm text-center text-gray-700">
                Connected: {walletInfo?.address.substring(0, 6)}...{walletInfo?.address.substring(38)}
              </div>
            )}
          </div>
          
          <div className="text-sm text-center mt-4">
            <span className="text-gray-600">Don&apos;t have an account?</span>{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
