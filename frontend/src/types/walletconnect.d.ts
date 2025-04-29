import WalletConnectProvider from '@walletconnect/web3-provider';

declare module '@walletconnect/web3-provider' {
  interface WalletConnectProvider {
    connected?: boolean;
    _connected?: boolean; // Some implementations use this private property
  }
}
