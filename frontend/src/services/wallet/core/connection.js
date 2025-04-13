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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnection = void 0;
var events_1 = require("events");
var wallet_base_1 = require("./wallet-base");
var WalletConnection = /** @class */ (function () {
    function WalletConnection() {
        this.provider = null;
        this.walletInfo = null;
        this.eventEmitter = new events_1.EventEmitter();
        this.setupListeners();
    }
    WalletConnection.prototype.setupListeners = function () {
        // Will be extended with provider-specific listeners
    };
    WalletConnection.prototype.connect = function (provider) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, provider.connect()];
                    case 1:
                        result = _a.sent();
                        if (result.success && result.walletInfo) {
                            this.provider = provider;
                            this.walletInfo = result.walletInfo;
                            this.emit(wallet_base_1.WalletEvent.CONNECTED, this.walletInfo);
                            return [2 /*return*/, this.walletInfo];
                        }
                        else {
                            this.emit(wallet_base_1.WalletEvent.ERROR, result.error || 'Unknown connection error');
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.emit(wallet_base_1.WalletEvent.ERROR, error_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WalletConnection.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var success, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.provider)
                            return [2 /*return*/, true];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.provider.disconnect()];
                    case 2:
                        success = _a.sent();
                        if (success) {
                            this.emit(wallet_base_1.WalletEvent.DISCONNECTED);
                            this.walletInfo = null;
                            this.provider = null;
                        }
                        return [2 /*return*/, success];
                    case 3:
                        error_2 = _a.sent();
                        this.emit(wallet_base_1.WalletEvent.ERROR, error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WalletConnection.prototype.signMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.provider || !this.walletInfo) {
                            this.emit(wallet_base_1.WalletEvent.ERROR, 'No connected wallet');
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.provider.signMessage(message, this.walletInfo.address)];
                    case 2:
                        result = _a.sent();
                        if (result.success && result.signature) {
                            return [2 /*return*/, result.signature];
                        }
                        else {
                            this.emit(wallet_base_1.WalletEvent.ERROR, result.error || 'Unknown signing error');
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.emit(wallet_base_1.WalletEvent.ERROR, error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WalletConnection.prototype.isConnected = function () {
        return !!this.provider && this.provider.isConnected();
    };
    WalletConnection.prototype.getWalletInfo = function () {
        return this.walletInfo;
    };
    // Event emitter methods
    WalletConnection.prototype.on = function (event, listener) {
        this.eventEmitter.on(event, listener);
    };
    WalletConnection.prototype.off = function (event, listener) {
        this.eventEmitter.off(event, listener);
    };
    WalletConnection.prototype.emit = function (event) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        (_a = this.eventEmitter).emit.apply(_a, __spreadArray([event], args, false));
    };
    return WalletConnection;
}());
exports.WalletConnection = WalletConnection;
