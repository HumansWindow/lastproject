import { AuthDebugger } from './auth-debugger';

/**
 * Initialize auth debugging tools
 * This can be imported in _app.tsx or other entry points
 */
export const initializeAuthDebugging = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log('🔧 Initializing auth debugging tools...');
    
    // Initialize console commands
    AuthDebugger.initConsoleCommands();
    
    // Create a global function to toggle the debug panel
    (window as any).toggleAuthDebugger = () => {
      const debuggerInstance = AuthDebugger.getInstance();
      if (debuggerInstance.isMonitoring()) {
        debuggerInstance.stopMonitoring();
        return 'Auth debugger disabled';
      } else {
        debuggerInstance.startMonitoring();
        return 'Auth debugger enabled';
      }
    };
  }
};
