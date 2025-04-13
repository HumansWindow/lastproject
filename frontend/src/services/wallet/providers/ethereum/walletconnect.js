"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnectAdapter = void 0;
var ethers_1 = require("ethers");
var ethereum_provider_1 = __importDefault(require("@walletconnect/ethereum-provider"));
var wallet_base_1 = require("../../core/wallet-base");
var WalletConnectAdapter = /** @class */ (function () {
    function WalletConnectAdapter(rpcConfig) {
        if (rpcConfig === void 0) { rpcConfig = {
            1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
            137: 'https://polygon-rpc.com'
        }; }
        this.rpcConfig = rpcConfig;
        this.walletConnectProvider = null;
        this.ethersProvider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.currentAccount = null;
    }
    WalletConnectAdapter.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, accounts, _b, _c, walletInfo, error_1, err;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, , 6]);
                        // Initialize WalletConnect Provider
                        _a = this;
                        return [4 /*yield*/, ethereum_provider_1.default.init({
                                projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect project ID
                                chains: [137], // Set Polygon as default chain
                                optionalChains: Object.keys(this.rpcConfig).map(Number),
                                rpcMap: this.rpcConfig,
                                showQrModal: true,
                                // Adding common methods and events needed for Ethereum providers
                                methods: ["eth_sendTransaction", "personal_sign", "eth_sign", "eth_signTypedData"],
                                events: ["chainChanged", "accountsChanged"]
                            })];
                    case 1:
                        // Initialize WalletConnect Provider
                        _a.walletConnectProvider = _d.sent();
                        return [4 /*yield*/, this.walletConnectProvider.enable()];
                    case 2:
                        accounts = _d.sent();
                        // Store the connected account
                        if (accounts && accounts.length > 0) {
                            this.currentAccount = accounts[0];
                        }
                        // Create ethers provider
                        this.ethersProvider = new ethers_1.ethers.providers.Web3Provider(this.walletConnectProvider);
                        this.signer = this.ethersProvider.getSigner();
                        // Get account address
                        _b = this;
                        return [4 /*yield*/, this.signer.getAddress()];
                    case 3:
                        // Get account address
                        _b.address = _d.sent();
                        _c = this;
                        return [4 /*yield*/, this.ethersProvider.getNetwork()];
                    case 4:
                        _c.chainId = (_d.sent()).chainId.toString();
                        walletInfo = {
                            address: this.address,
                            chainId: this.chainId,
                            blockchain: this.getBlockchainType(this.chainId),
                            providerType: wallet_base_1.WalletProviderType.WALLETCONNECT
                        };
                        return [2 /*return*/, {
                                success: true,
                                walletInfo: walletInfo,
                                provider: this.walletConnectProvider
                            }];
                    case 5:
                        error_1 = _d.sent();
                        err = error_1;
                        return [2 /*return*/, {
                                success: false,
                                error: err.message || 'Failed to connect with WalletConnect'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    WalletConnectAdapter.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.walletConnectProvider) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.walletConnectProvider.disconnect()];
                    case 2:
                        _b.sent();
                        this.walletConnectProvider = null;
                        this.ethersProvider = null;
                        this.signer = null;
                        this.address = null;
                        this.chainId = null;
                        this.currentAccount = null;
                        return [2 /*return*/, true];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/, true];
                }
            });
        });
    };
    WalletConnectAdapter.prototype.signMessage = function (message, address) {
        return __awaiter(this, void 0, void 0, function () {
            var signature, error_2, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.signer || !this.address) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Not connected with WalletConnect'
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.signer.signMessage(message)];
                    case 2:
                        signature = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                signature: signature
                            }];
                    case 3:
                        error_2 = _a.sent();
                        err = error_2;
                        return [2 /*return*/, {
                                success: false,
                                error: err.message || 'Failed to sign message'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WalletConnectAdapter.prototype.isConnected = function () {
        try {
            // Use the currentAccount property instead of this.account
            return !!this.walletConnectProvider && !!this.currentAccount;
        }
        catch (error) {
            console.error("Error checking connection status:", error);
            return false;
        }
    };
    WalletConnectAdapter.prototype.getProvider = function () {
        return this.walletConnectProvider;
    };
    WalletConnectAdapter.prototype.getBlockchainType = function (chainId) {
        // Map chainId to BlockchainType (same as MetaMask)
        var chainIdMap = {
            '1': wallet_base_1.BlockchainType.ETHEREUM,
            '56': wallet_base_1.BlockchainType.BINANCE,
            '137': wallet_base_1.BlockchainType.POLYGON,
            '43114': wallet_base_1.BlockchainType.AVALANCHE,
            '42161': wallet_base_1.BlockchainType.ARBITRUM,
            '10': wallet_base_1.BlockchainType.OPTIMISM,
        };
        return chainIdMap[chainId] || wallet_base_1.BlockchainType.ETHEREUM;
    };
    return WalletConnectAdapter;
}());
exports.WalletConnectAdapter = WalletConnectAdapter;
