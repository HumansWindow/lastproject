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
exports.WalletAuthenticator = void 0;
var axios_1 = __importDefault(require("axios"));
var WalletAuthenticator = /** @class */ (function () {
    function WalletAuthenticator(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }
    WalletAuthenticator.prototype.getAuthChallenge = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1, err;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiBaseUrl, "/auth/wallet/connect"), { address: address })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data.nonce];
                    case 2:
                        error_1 = _c.sent();
                        err = error_1;
                        throw new Error(((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to get auth challenge');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WalletAuthenticator.prototype.authenticate = function (walletInfo, signature, email, nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, response, error_2, err;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        payload = {
                            address: walletInfo.address,
                            signature: signature,
                            nonce: nonce || '', // Use the original challenge nonce if provided
                            email: email || undefined
                        };
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiBaseUrl, "/auth/wallet/authenticate"), payload)];
                    case 1:
                        response = _d.sent();
                        return [2 /*return*/, {
                                success: true,
                                token: response.data.accessToken,
                                refreshToken: response.data.refreshToken,
                                userId: (_a = response.data.user) === null || _a === void 0 ? void 0 : _a.id,
                                isNewUser: response.data.isNewUser
                            }];
                    case 2:
                        error_2 = _d.sent();
                        err = error_2;
                        return [2 /*return*/, {
                                success: false,
                                error: ((_c = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Authentication failed'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WalletAuthenticator.prototype.refreshToken = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3, err;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiBaseUrl, "/auth/refresh-token"), { refreshToken: refreshToken })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, {
                                success: true,
                                token: response.data.accessToken,
                                refreshToken: response.data.refreshToken,
                            }];
                    case 2:
                        error_3 = _c.sent();
                        err = error_3;
                        return [2 /*return*/, {
                                success: false,
                                error: ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to refresh token'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WalletAuthenticator.prototype.logout = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiBaseUrl, "/auth/logout"), { refreshToken: refreshToken })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Logout error:', error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return WalletAuthenticator;
}());
exports.WalletAuthenticator = WalletAuthenticator;
