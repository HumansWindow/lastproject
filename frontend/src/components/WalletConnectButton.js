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
exports.WalletConnectButton = void 0;
var react_1 = __importStar(require("react"));
var wallet_1 = require("../contexts/wallet");
var auth_1 = require("../contexts/auth");
var wallet_2 = require("../services/wallet");
var WalletConnectButton = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.providerType, providerType = _c === void 0 ? wallet_2.WalletProviderType.METAMASK : _c, _d = _a.autoAuthenticate, autoAuthenticate = _d === void 0 ? true : _d;
    var _e = (0, wallet_1.useWallet)(), isConnected = _e.isConnected, isConnecting = _e.isConnecting, walletInfo = _e.walletInfo, connect = _e.connect, disconnect = _e.disconnect, error = _e.error;
    var _f = (0, auth_1.useAuth)(), authenticateWithWallet = _f.authenticateWithWallet, isAuthenticated = _f.isAuthenticated, isAuthLoading = _f.isLoading;
    var displayAddress = (walletInfo === null || walletInfo === void 0 ? void 0 : walletInfo.address)
        ? "".concat(walletInfo.address.substring(0, 6), "...").concat(walletInfo.address.substring(walletInfo.address.length - 4))
        : '';
    // Connect with specified provider
    var handleConnect = function (event) {
        event.preventDefault();
        connect(providerType);
    };
    // Disconnect wallet
    var handleDisconnect = function (event) {
        event.preventDefault();
        disconnect();
    };
    // Auto authenticate when wallet is connected
    (0, react_1.useEffect)(function () {
        var performAuthentication = function () { return __awaiter(void 0, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(autoAuthenticate && isConnected && !isAuthenticated && !isAuthLoading)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, authenticateWithWallet()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Authentication failed:", err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        performAuthentication();
    }, [isConnected, isAuthenticated, isAuthLoading, autoAuthenticate, authenticateWithWallet]);
    return (react_1.default.createElement("div", { className: "wallet-connect-container" },
        !isConnected ? (react_1.default.createElement("button", { className: "wallet-connect-button ".concat(className), onClick: handleConnect, disabled: isConnecting || isAuthLoading }, isConnecting ? 'Connecting...' : "Connect ".concat(getProviderName(providerType)))) : (react_1.default.createElement("div", { className: "wallet-connected" },
            react_1.default.createElement("span", { className: "wallet-address" }, displayAddress),
            react_1.default.createElement("button", { className: "disconnect-button", onClick: handleDisconnect }, "Disconnect"))),
        error && react_1.default.createElement("p", { className: "wallet-error" }, error)));
};
exports.WalletConnectButton = WalletConnectButton;
// Helper function to get provider display name
function getProviderName(providerType) {
    var _a;
    var providerNames = (_a = {},
        _a[wallet_2.WalletProviderType.METAMASK] = 'MetaMask',
        _a[wallet_2.WalletProviderType.COINBASE] = 'Coinbase',
        _a[wallet_2.WalletProviderType.WALLETCONNECT] = 'WalletConnect',
        _a[wallet_2.WalletProviderType.TRUST] = 'Trust Wallet',
        _a[wallet_2.WalletProviderType.PHANTOM] = 'Phantom',
        _a[wallet_2.WalletProviderType.BINANCE] = 'Binance Wallet',
        _a);
    return providerNames[providerType] || 'Wallet';
}
