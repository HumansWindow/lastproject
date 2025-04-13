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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaMaskProvider = void 0;
var ethers_1 = require("ethers");
var wallet_base_1 = require("../../core/wallet-base");
var MetaMaskProvider = /** @class */ (function () {
    function MetaMaskProvider() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.checkForProvider();
    }
    MetaMaskProvider.prototype.checkForProvider = function () {
        // Check if window.ethereum exists
        if (typeof window !== 'undefined' && window.ethereum) {
            this.provider = window.ethereum;
            return true;
        }
        return false;
    };
    MetaMaskProvider.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ethersProvider, accounts, address, chainId, walletInfo, error_1, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.checkForProvider()) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'MetaMask is not installed'
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        ethersProvider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
                        return [4 /*yield*/, this.provider.request({ method: 'eth_requestAccounts' })];
                    case 2:
                        accounts = _a.sent();
                        if (!accounts || accounts.length === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'No accounts found'
                                }];
                        }
                        address = accounts[0];
                        return [4 /*yield*/, ethersProvider.getNetwork()];
                    case 3:
                        chainId = (_a.sent()).chainId;
                        this.address = address;
                        this.chainId = chainId.toString();
                        this.signer = ethersProvider.getSigner();
                        walletInfo = {
                            address: address,
                            chainId: chainId.toString(),
                            blockchain: this.getBlockchainType(chainId.toString()),
                            providerType: wallet_base_1.WalletProviderType.METAMASK
                        };
                        return [2 /*return*/, {
                                success: true,
                                walletInfo: walletInfo,
                                provider: this.provider
                            }];
                    case 4:
                        error_1 = _a.sent();
                        err = error_1;
                        return [2 /*return*/, {
                                success: false,
                                error: err.message || 'Failed to connect to MetaMask'
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MetaMaskProvider.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // MetaMask doesn't support programmatic disconnection
                // We'll just clear our local state
                this.signer = null;
                this.address = null;
                this.chainId = null;
                return [2 /*return*/, true];
            });
        });
    };
    MetaMaskProvider.prototype.signMessage = function (message, address) {
        return __awaiter(this, void 0, void 0, function () {
            var signature, error_2, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.signer) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Not connected to MetaMask'
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
    MetaMaskProvider.prototype.isConnected = function () {
        return !!this.signer && !!this.address;
    };
    MetaMaskProvider.prototype.getProvider = function () {
        return this.provider;
    };
    MetaMaskProvider.prototype.switchNetwork = function (chainId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.provider)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.provider.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: "0x".concat(parseInt(chainId).toString(16)) }],
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MetaMaskProvider.prototype.getBlockchainType = function (chainId) {
        // Map chainId to BlockchainType
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
    return MetaMaskProvider;
}());
exports.MetaMaskProvider = MetaMaskProvider;
