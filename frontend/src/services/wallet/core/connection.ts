import { EventEmitter } from 'events';
import { 
  WalletEvent, 
  WalletEventEmitter, 
  WalletInfo, 
  WalletProvider 
} from './wallet-base';

export class WalletConnection implements WalletEventEmitter {
  private provider: WalletProvider | null = null;
  private walletInfo: WalletInfo | null = null;
  private eventEmitter = new EventEmitter();
  
  constructor() {
    this.setupListeners();
  }
  
  private setupListeners() {
    // Will be extended with provider-specific listeners
  }
  
  async connect(provider: WalletProvider): Promise<WalletInfo | null> {
    try {
      const result = await provider.connect();
      
      if (result.success && result.walletInfo) {
        this.provider = provider;
        this.walletInfo = result.walletInfo;
        this.emit(WalletEvent.CONNECTED, this.walletInfo);
        return this.walletInfo;
      } else {
        this.emit(WalletEvent.ERROR, result.error || 'Unknown connection error');
        return null;
      }
    } catch (error) {
      this.emit(WalletEvent.ERROR, error);
      return null;
    }
  }
  
  async disconnect(): Promise<boolean> {
    if (!this.provider) return true;
    
    try {
      const success = await this.provider.disconnect();
      if (success) {
        this.emit(WalletEvent.DISCONNECTED);
        this.walletInfo = null;
        this.provider = null;
      }
      return success;
    } catch (error) {
      this.emit(WalletEvent.ERROR, error);
      return false;
    }
  }
  
  async signMessage(message: string): Promise<string | null> {
    if (!this.provider || !this.walletInfo) {
      this.emit(WalletEvent.ERROR, 'No connected wallet');
      return null;
    }
    
    try {
      const result = await this.provider.signMessage(message, this.walletInfo.address);
      if (result.success && result.signature) {
        return result.signature;
      } else {
        this.emit(WalletEvent.ERROR, result.error || 'Unknown signing error');
        return null;
      }
    } catch (error) {
      this.emit(WalletEvent.ERROR, error);
      return null;
    }
  }
  
  isConnected(): boolean {
    return !!this.provider && this.provider.isConnected();
  }
  
  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }
  
  // Event emitter methods
  on(event: WalletEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  off(event: WalletEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  emit(event: WalletEvent, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }
}
