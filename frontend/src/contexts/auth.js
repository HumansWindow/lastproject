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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
var react_1 = __importStar(require("react"));
var wallet_1 = __importDefault(require("../services/wallet"));
var profile_service_1 = require("../profile/profile-service");
var wallet_2 = require("./wallet");
var AuthContext = (0, react_1.createContext)(undefined);
// Local storage keys
var TOKEN_KEY = 'accessToken';
var REFRESH_TOKEN_KEY = 'refreshToken';
var USER_KEY = 'user_profile';
var AuthProvider = function (_a) {
    var children = _a.children;
    var _b = (0, wallet_2.useWallet)(), isConnected = _b.isConnected, walletInfo = _b.walletInfo;
    var _c = (0, react_1.useState)(null), user = _c[0], setUser = _c[1];
    var _d = (0, react_1.useState)(false), isAuthenticated = _d[0], setIsAuthenticated = _d[1];
    var _e = (0, react_1.useState)(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = (0, react_1.useState)(null), error = _f[0], setError = _f[1];
    var _g = (0, react_1.useState)(false), isProfileComplete = _g[0], setIsProfileComplete = _g[1];
    // Initialize user from local storage and fetch current profile if authenticated
    (0, react_1.useEffect)(function () {
        var init = function () { return __awaiter(void 0, void 0, void 0, function () {
            var token, profile, err_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token = localStorage.getItem(TOKEN_KEY);
                        if (!token) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, profile_service_1.profileService.getUserProfile()];
                    case 2:
                        profile = _b.sent();
                        setUser(profile);
                        setIsAuthenticated(true);
                        // Check if profile is complete
                        setIsProfileComplete(!!(profile.firstName &&
                            profile.lastName &&
                            (profile.email || ((_a = profile.walletAddresses) === null || _a === void 0 ? void 0 : _a.length))));
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _b.sent();
                        // Invalid token or other error, clear it
                        console.error('Error initializing user:', err_1);
                        localStorage.removeItem(TOKEN_KEY);
                        localStorage.removeItem(REFRESH_TOKEN_KEY);
                        localStorage.removeItem(USER_KEY);
                        return [3 /*break*/, 4];
                    case 4:
                        setIsLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        init();
    }, []);
    var authenticateWithWallet = function (email) { return __awaiter(void 0, void 0, void 0, function () {
        var result, profile, isComplete, profileErr_1, err_2, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isConnected || !walletInfo) {
                        setError('No wallet connected');
                        return [2 /*return*/, false];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, 10, 11]);
                    setIsLoading(true);
                    setError(null);
                    return [4 /*yield*/, wallet_1.default.authenticate(email)];
                case 2:
                    result = _b.sent();
                    if (!(result.success && result.token && result.refreshToken)) return [3 /*break*/, 7];
                    // Store tokens
                    localStorage.setItem(TOKEN_KEY, result.token);
                    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, profile_service_1.profileService.getUserProfile()];
                case 4:
                    profile = _b.sent();
                    setUser(profile);
                    // Store user in localStorage
                    localStorage.setItem(USER_KEY, JSON.stringify(profile));
                    isComplete = !!(profile.firstName &&
                        profile.lastName &&
                        (profile.email || ((_a = profile.walletAddresses) === null || _a === void 0 ? void 0 : _a.length)));
                    setIsProfileComplete(isComplete);
                    setIsAuthenticated(true);
                    return [2 /*return*/, true];
                case 5:
                    profileErr_1 = _b.sent();
                    console.error('Error fetching profile after authentication:', profileErr_1);
                    // Even if profile fetch fails, user is still authenticated
                    setIsAuthenticated(true);
                    setIsProfileComplete(false);
                    return [2 /*return*/, true];
                case 6: return [3 /*break*/, 8];
                case 7:
                    setError(result.error || 'Authentication failed');
                    return [2 /*return*/, false];
                case 8: return [3 /*break*/, 11];
                case 9:
                    err_2 = _b.sent();
                    error_1 = err_2;
                    setError((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Authentication error');
                    return [2 /*return*/, false];
                case 10:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () { return __awaiter(void 0, void 0, void 0, function () {
        var refreshToken, err_3, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
                    if (!refreshToken) return [3 /*break*/, 2];
                    // Try to logout on backend
                    return [4 /*yield*/, wallet_1.default.logout(refreshToken)];
                case 1:
                    // Try to logout on backend
                    _a.sent();
                    _a.label = 2;
                case 2:
                    // Clear local storage
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    // Clear state
                    setUser(null);
                    setIsAuthenticated(false);
                    setIsProfileComplete(false);
                    return [2 /*return*/, true];
                case 3:
                    err_3 = _a.sent();
                    error_2 = err_3;
                    setError((error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || 'Logout error');
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var updateUserProfile = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedProfile, isComplete, err_4, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (!isAuthenticated)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, profile_service_1.profileService.updateUserProfile(data)];
                case 1:
                    updatedProfile = _b.sent();
                    // Update local state
                    setUser(updatedProfile);
                    localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
                    isComplete = !!(updatedProfile.firstName &&
                        updatedProfile.lastName &&
                        (updatedProfile.email || ((_a = updatedProfile.walletAddresses) === null || _a === void 0 ? void 0 : _a.length)));
                    setIsProfileComplete(isComplete);
                    return [2 /*return*/, true];
                case 2:
                    err_4 = _b.sent();
                    error_3 = err_4;
                    setError((error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || 'Failed to update profile');
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var completeUserProfile = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var completedProfile, err_5, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!isAuthenticated)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, profile_service_1.profileService.completeUserProfile(data)];
                case 1:
                    completedProfile = _a.sent();
                    // Update local state
                    setUser(completedProfile);
                    localStorage.setItem(USER_KEY, JSON.stringify(completedProfile));
                    setIsProfileComplete(true);
                    return [2 /*return*/, true];
                case 2:
                    err_5 = _a.sent();
                    error_4 = err_5;
                    setError((error_4 === null || error_4 === void 0 ? void 0 : error_4.message) || 'Failed to complete profile');
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (react_1.default.createElement(AuthContext.Provider, { value: {
            user: user,
            isAuthenticated: isAuthenticated,
            isLoading: isLoading,
            error: error,
            isProfileComplete: isProfileComplete,
            authenticateWithWallet: authenticateWithWallet,
            logout: logout,
            updateUserProfile: updateUserProfile,
            completeUserProfile: completeUserProfile,
        } }, children));
};
exports.AuthProvider = AuthProvider;
var useAuth = function () {
    var context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
