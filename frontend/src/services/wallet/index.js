"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
var connection_1 = require("./core/connection");
var metamask_1 = require("./providers/ethereum/metamask");
var walletconnect_1 = require("./providers/ethereum/walletconnect");
var wallet_auth_1 = require("./auth/wallet-auth");
var challenge_1 = require("./auth/challenge");
var wallet_base_1 = require("./core/wallet-base");
// RPC configuration for WalletConnect
var RPC_URLS = {
    '1': process.env.NEXT_PUBLIC_ETH_MAINNET_RPC || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    '137': process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    '56': process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org',
    '43114': process.env.NEXT_PUBLIC_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc',
    '42161': process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    '10': process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io'
};
// API base URL for authentication
var API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Create wallet connection instance
var walletConnection = new connection_1.WalletConnection();
// Fix the providers object to match the enum
var providers = (_a = {},
    _a[wallet_base_1.WalletProviderType.METAMASK] = new metamask_1.MetaMaskProvider(),
    _a[wallet_base_1.WalletProviderType.WALLETCONNECT] = new walletconnect_1.WalletConnectAdapter({
        1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        56: 'https://bsc-dataseed.binance.org/',
        137: 'https://polygon-rpc.com'
    }),
    _a);
// Create auth service
var walletAuthenticator = new wallet_auth_1.WalletAuthenticator(API_BASE_URL);
// Create challenge manager
var challengeManager = new challenge_1.ChallengeManager(walletConnection, walletAuthenticator);
// Main wallet service
exports.walletService = {
    // Connection methods
    connect: function (providerType) { return __awaiter(void 0, void 0, void 0, function () {
        var provider;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = providers[providerType];
                    if (!provider) {
                        throw new Error("Provider ".concat(providerType, " is not supported"));
                    }
                    return [4 /*yield*/, walletConnection.connect(provider)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    disconnect: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, walletConnection.disconnect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    isConnected: function () {
        return walletConnection.isConnected();
    },
    getWalletInfo: function () {
        return walletConnection.getWalletInfo();
    },
    // Authentication methods
    authenticate: function (email) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, challengeManager.authenticateWithChallenge(email)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    refreshToken: function (refreshToken) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, walletAuthenticator.refreshToken(refreshToken)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    logout: function (refreshToken) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, walletAuthenticator.logout(refreshToken)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    // Event handling
    on: function (event, listener) {
        walletConnection.on(event, listener);
    },
    off: function (event, listener) {
        walletConnection.off(event, listener);
    },
    // Network management
    switchNetwork: function (chainId, providerType) { return __awaiter(void 0, void 0, void 0, function () {
        var provider;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = providers[providerType];
                    if (!provider || !provider.switchNetwork) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, provider.switchNetwork(chainId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); }
};
__exportStar(require("./core/wallet-base"), exports);
__exportStar(require("./auth/wallet-auth"), exports);
exports.default = exports.walletService;
