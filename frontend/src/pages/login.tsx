import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth';
import { useWallet } from '@/contexts/wallet';

export default function Login() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { login, walletLogin } = useAuth();
  const { connect, signMessage, address } = useWallet();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Connect wallet if not already connected
      const walletAddress = address || await connect();
      
      if (!walletAddress) {
        setError(t('walletConnectionFailed'));
        return;
      }
      
      // Sign message for authentication
      const nonce = Date.now().toString();
      const message = `Login to AliveHuman: ${nonce}`;
      const signature = await signMessage(message);
      
      if (!signature) {
        setError(t('signatureRejected'));
        return;
      }
      
      // Authenticate with backend
      await walletLogin(walletAddress, signature);
      router.push('/dashboard');
    } catch (err) {
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{t('login')}</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} className="mb-6">
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? t('loggingIn') : t('loginWithEmail')}
          </button>
        </form>
        
        <div className="text-center mb-6">
          <span className="text-gray-500">{t('or')}</span>
        </div>
        
        <button
          onClick={handleWalletLogin}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? t('connecting') : t('loginWithWallet')}
        </button>
        
        <div className="mt-6 text-center">
          <Link href="/forgot-password">
            <span className="text-blue-500 hover:text-blue-600">
              {t('forgotPassword')}
            </span>
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <span className="text-gray-600">
            {t('dontHaveAccount')} {' '}
            <Link href="/register">
              <span className="text-blue-500 hover:text-blue-600">
                {t('signUp')}
              </span>
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};
