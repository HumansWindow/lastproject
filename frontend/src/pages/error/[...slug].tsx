import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CatchAllErrorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the not-found error page
    router.replace('/error/not-found');
  }, [router]);

  // Return null as this is just a redirect
  return null;
}