import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/auth';

const LoginRedirect = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to profile page for wallet authentication
    if (isAuthenticated) {
      router.push('/profile');
    } else {
      router.push('/profile');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Redirecting to wallet authentication...</p>
      </div>
    </div>
  );
};

export default LoginRedirect;
