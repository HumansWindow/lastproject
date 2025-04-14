import walletService from '../services/wallet';

/**
 * Utility to monitor and debug wallet authentication flow
 */
export class AuthDebugger {
  private static instance: AuthDebugger;
  private active: boolean = false;
  private listeners: Array<() => void> = [];
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger();
    }
    return AuthDebugger.instance;
  }
  
  public startMonitoring(): void {
    console.log('🔍 Auth Debugger: Starting authentication monitoring');
    this.active = true;
    walletService.setDebugEnabled?.(true);
    this.notifyListeners();
  }
  
  public stopMonitoring(): void {
    this.active = false;
    console.log('🔍 Auth Debugger: Stopped authentication monitoring');
    this.notifyListeners();
  }
  
  public isMonitoring(): boolean {
    return this.active;
  }
  
  public addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
  
  public static initConsoleCommands(): void {
    if (typeof window !== 'undefined') {
      const debuggerInstance = AuthDebugger.getInstance();
      
      (window as any).authDebugger = {
        startMonitoring: () => {
          debuggerInstance.startMonitoring();
          return "Auth monitoring started! Open the debug panel component to see logs.";
        },
        stopMonitoring: () => {
          debuggerInstance.stopMonitoring();
          return "Auth monitoring stopped.";
        },
        isMonitoring: () => {
          return `Auth monitoring is ${debuggerInstance.isMonitoring() ? 'active' : 'inactive'}.`;
        },
        getLogs: () => {
          return walletService.getDebugLogs?.() || [];
        },
        clearLogs: () => {
          walletService.clearDebugLogs?.();
          return "Logs cleared.";
        }
      };
      
      console.log('%c🔍 Auth Debugger Available', 'color: #00ff00; font-weight: bold');
      console.log('Use window.authDebugger.startMonitoring() to begin debugging');
    }
  }
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    AuthDebugger.initConsoleCommands();
  }, 1000); // Small delay to ensure window is fully loaded
}
