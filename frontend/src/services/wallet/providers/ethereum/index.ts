/**
 * Export Ethereum wallet providers
 */
import { MetaMaskProvider } from "./metamask";
import { WalletConnectAdapter } from "./walletconnect";
import { BinanceWalletProvider } from "./binance";
import { TrustWalletProvider } from "./trustwallet";

export {
  MetaMaskProvider,
  WalletConnectAdapter as WalletConnectProvider,
  BinanceWalletProvider,
  TrustWalletProvider
};

// Create named exports object to satisfy ESLint
const ethereumProviders = {
  MetaMaskProvider,
  WalletConnectProvider: WalletConnectAdapter,
  BinanceWalletProvider,
  TrustWalletProvider
};

export default ethereumProviders;