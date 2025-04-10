// Add global type declarations
declare module '@walletconnect/web3-provider' {
  import { IProviderOptions } from '@walletconnect/types';
  
  class WalletConnectProvider {
    constructor(opts: IProviderOptions);
    enable(): Promise<string[]>;
    request(args: { method: string; params?: any[] }): Promise<any>;
    on(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
    disconnect(): Promise<void>;
  }
  
  export default WalletConnectProvider;
}

// You may need to add other declarations as needed
