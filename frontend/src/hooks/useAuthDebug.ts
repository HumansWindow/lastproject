import { useState, useEffect } from 'react';
import { AuthDebugger } from "../utils/authDebugger";

/**
 * Hook to use auth debugger in React components
 */
export function useAuthDebug(autoStart: boolean = false) {
  const [isDebugging, setIsDebugging] = useState(false);
  
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    // Initialize the debugger
    const debuggerInstance = AuthDebugger.getInstance();
    
    // Start if autoStart is true
    if (autoStart && !debuggerInstance.isMonitoring()) {
      debuggerInstance.startMonitoring();
    }
    
    // Set initial state
    setIsDebugging(debuggerInstance.isMonitoring());
    
    // Subscribe to changes
    const unsubscribe = debuggerInstance.addListener(() => {
      setIsDebugging(debuggerInstance.isMonitoring());
    });
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [autoStart]);
  
  const startDebugging = () => {
    if (process.env.NODE_ENV === 'development') {
      AuthDebugger.getInstance().startMonitoring();
    }
  };
  
  const stopDebugging = () => {
    if (process.env.NODE_ENV === 'development') {
      AuthDebugger.getInstance().stopMonitoring();
    }
  };
  
  const toggleDebugging = () => {
    if (process.env.NODE_ENV === 'development') {
      const debuggerInstance = AuthDebugger.getInstance();
      if (debuggerInstance.isMonitoring()) {
        debuggerInstance.stopMonitoring();
      } else {
        debuggerInstance.startMonitoring();
      }
    }
  };
  
  return {
    isDebugging,
    startDebugging,
    stopDebugging,
    toggleDebugging
  };
}
