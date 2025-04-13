"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletEvent = exports.BlockchainType = exports.WalletProviderType = void 0;
var WalletProviderType;
(function (WalletProviderType) {
    WalletProviderType["METAMASK"] = "metamask";
    WalletProviderType["COINBASE"] = "coinbase";
    WalletProviderType["WALLETCONNECT"] = "walletconnect";
    WalletProviderType["TRUST"] = "trust";
    WalletProviderType["PHANTOM"] = "phantom";
    WalletProviderType["BINANCE"] = "binance";
})(WalletProviderType || (exports.WalletProviderType = WalletProviderType = {}));
var BlockchainType;
(function (BlockchainType) {
    BlockchainType["ETHEREUM"] = "ethereum";
    BlockchainType["BINANCE"] = "binance";
    BlockchainType["POLYGON"] = "polygon";
    BlockchainType["SOLANA"] = "solana";
    BlockchainType["AVALANCHE"] = "avalanche";
    BlockchainType["ARBITRUM"] = "arbitrum";
    BlockchainType["OPTIMISM"] = "optimism";
})(BlockchainType || (exports.BlockchainType = BlockchainType = {}));
var WalletEvent;
(function (WalletEvent) {
    WalletEvent["CONNECTED"] = "connected";
    WalletEvent["DISCONNECTED"] = "disconnected";
    WalletEvent["ACCOUNT_CHANGED"] = "accountChanged";
    WalletEvent["CHAIN_CHANGED"] = "chainChanged";
    WalletEvent["ERROR"] = "error";
})(WalletEvent || (exports.WalletEvent = WalletEvent = {}));
