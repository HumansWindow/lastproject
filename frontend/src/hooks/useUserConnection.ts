import { useState, useEffect } from 'react';
import { apiClient } from "../services/api/client";

/**
 * Hook to check if user is connected to the system
 * @returns Object containing connection status and auth state
 */
export function useUserConnection() {
  const [isConnected, setIsConnected] = useState(apiClient.isUserConnected());
  const [authState, setAuthState] = useState(apiClient.getAuthState());

  useEffect(() => {
    // Check connection status on mount
    const checkConnection = () => {
      setIsConnected(apiClient.isUserConnected());
      setAuthState(apiClient.getAuthState());
    };

    // Update connection status when localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken') {
        checkConnection();
      }
    };

    // Set up event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Initial check
    checkConnection();

    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { isConnected, authState };
}

export default useUserConnection;