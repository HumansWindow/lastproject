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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.useWallet = exports.WalletProvider = void 0;
var react_1 = __importStar(require("react"));
var wallet_1 = __importStar(require("../services/wallet"));
var WalletContext = (0, react_1.createContext)(undefined);
var WalletProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(false), isConnected = _b[0], setIsConnected = _b[1];
    var _c = (0, react_1.useState)(false), isConnecting = _c[0], setIsConnecting = _c[1];
    var _d = (0, react_1.useState)(null), walletInfo = _d[0], setWalletInfo = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var _f = (0, react_1.useState)(null), providerType = _f[0], setProviderType = _f[1];
    (0, react_1.useEffect)(function () {
        // Set up event listeners for wallet events
        var handleConnection = function (info) {
            setWalletInfo(info);
            setIsConnected(true);
            setIsConnecting(false);
            setError(null);
        };
        var handleDisconnection = function () {
            setWalletInfo(null);
            setIsConnected(false);
            setProviderType(null);
            setError(null);
        };
        var handleError = function (err) {
            setError(typeof err === 'string' ? err : ((err === null || err === void 0 ? void 0 : err.message) || 'Unknown wallet error'));
            setIsConnecting(false);
        };
        var handleAccountChanged = function (newInfo) {
            setWalletInfo(newInfo);
        };
        var handleChainChanged = function (newInfo) {
            setWalletInfo(newInfo);
        };
        // Register event listeners
        wallet_1.default.on(wallet_1.WalletEvent.CONNECTED, handleConnection);
        wallet_1.default.on(wallet_1.WalletEvent.DISCONNECTED, handleDisconnection);
        wallet_1.default.on(wallet_1.WalletEvent.ERROR, handleError);
        wallet_1.default.on(wallet_1.WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
        wallet_1.default.on(wallet_1.WalletEvent.CHAIN_CHANGED, handleChainChanged);
        // Remove event listeners on cleanup
        return function () {
            wallet_1.default.off(wallet_1.WalletEvent.CONNECTED, handleConnection);
            wallet_1.default.off(wallet_1.WalletEvent.DISCONNECTED, handleDisconnection);
            wallet_1.default.off(wallet_1.WalletEvent.ERROR, handleError);
            wallet_1.default.off(wallet_1.WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
            wallet_1.default.off(wallet_1.WalletEvent.CHAIN_CHANGED, handleChainChanged);
        };
    }, []);
    // Try to restore wallet connection on initial load
    (0, react_1.useEffect)(function () {
        var checkConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
            var isAlreadyConnected, info;
            return __generator(this, function (_a) {
                isAlreadyConnected = wallet_1.default.isConnected();
                if (isAlreadyConnected) {
                    info = wallet_1.default.getWalletInfo();
                    setWalletInfo(info);
                    setIsConnected(true);
                }
                return [2 /*return*/];
            });
        }); };
        checkConnection();
    }, []);
    var connect = function (type) { return __awaiter(void 0, void 0, void 0, function () {
        var info, err_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    setIsConnecting(true);
                    setError(null);
                    setProviderType(type);
                    return [4 /*yield*/, wallet_1.default.connect(type)];
                case 1:
                    info = _a.sent();
                    return [2 /*return*/, !!info];
                case 2:
                    err_1 = _a.sent();
                    error_1 = err_1;
                    setError((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Failed to connect wallet');
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var disconnect = function () { return __awaiter(void 0, void 0, void 0, function () {
        var success, err_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, wallet_1.default.disconnect()];
                case 1:
                    success = _a.sent();
                    return [2 /*return*/, success];
                case 2:
                    err_2 = _a.sent();
                    error_2 = err_2;
                    setError((error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || 'Failed to disconnect wallet');
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var switchNetwork = function (chainId) { return __awaiter(void 0, void 0, void 0, function () {
        var success, err_3, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!providerType) {
                        setError('No wallet provider connected');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wallet_1.default.switchNetwork(chainId, providerType)];
                case 2:
                    success = _a.sent();
                    if (!success) {
                        setError('Failed to switch network');
                    }
                    return [2 /*return*/, success];
                case 3:
                    err_3 = _a.sent();
                    error_3 = err_3;
                    setError((error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || 'Failed to switch network');
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (react_1.default.createElement(WalletContext.Provider, { value: {
            connect: connect,
            disconnect: disconnect,
            switchNetwork: switchNetwork,
            isConnected: isConnected,
            isConnecting: isConnecting,
            walletInfo: walletInfo,
            error: error,
            providerType: providerType
        } }, children));
};
exports.WalletProvider = WalletProvider;
var useWallet = function () {
    var context = (0, react_1.useContext)(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
exports.useWallet = useWallet;
