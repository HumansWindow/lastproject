import * as React from 'react';
import { useState, useEffect } from 'react';

const RateLimitPage: React.FC = () => {
  const [countdown, setCountdown] = useState(60);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reload the page or redirect after countdown
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="error-container">
      <h1>Too Many Requests</h1>
      <p>You&apos;ve made too many requests recently. Please wait before trying again.</p>
      <p>You can try again in: {countdown} seconds</p>
    </div>
  );
};

export default RateLimitPage;
