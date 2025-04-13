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
exports.apiClient = void 0;
/**
 * Core API Client
 *
 * This is the main API client that should be used throughout the application.
 * It integrates caching, security features, and more.
 */
var axios_1 = __importDefault(require("axios"));
var axios_cache_adapter_1 = require("axios-cache-adapter");
var api_config_1 = require("@/config/api.config");
// Import API_URL separately since it's a named export
var api_config_2 = __importDefault(require("@/config/api.config"));
var API_URL = api_config_2.default.API_URL;
// Define routes that should be cached
var CACHEABLE_ROUTES = [
    '/user/profile',
    '/wallets/list',
    '/token/info',
    '/referral/stats',
    '/nft/list',
    '/diary/stats',
];
// Track request queue during token refresh
var isRefreshing = false;
var failedRequestsQueue = [];
// Process the request queue
var processQueue = function (error, token) {
    if (token === void 0) { token = null; }
    failedRequestsQueue.forEach(function (request) {
        if (error) {
            request.reject(error);
        }
        else if (token) {
            request.config.headers['Authorization'] = "Bearer ".concat(token);
            request.resolve((0, axios_1.default)(request.config));
        }
    });
    failedRequestsQueue = [];
};
// Create axios instance with default config
var apiClient = axios_1.default.create({
    baseURL: API_URL,
    timeout: api_config_1.apiClientConfig.timeout,
    headers: api_config_1.apiClientConfig.headers,
    withCredentials: api_config_1.apiClientConfig.withCredentials
});
// Create cache with appropriate configuration
var cache = (0, axios_cache_adapter_1.setupCache)({
    maxAge: 15 * 60 * 1000, // 15 minutes
    exclude: {
        // Don't cache POST, PUT, DELETE requests
        methods: ['post', 'put', 'delete', 'patch'],
        // Don't cache auth endpoints
        filter: function (request) {
            // Skip caching for auth endpoints
            if (request.url && request.url.includes('/auth/')) {
                return true; // exclude from cache
            }
            // Only cache specific GET endpoints
            if (request.method === 'get') {
                // Check if this is a cacheable route
                return !CACHEABLE_ROUTES.some(function (route) {
                    return request.url && request.url.includes(route);
                });
            }
            return true; // exclude by default
        }
    },
    debug: process.env.NODE_ENV !== 'production'
});
// Use the cache adapter
apiClient.defaults.adapter = cache.adapter;
// Add request interceptor to inject auth token and handle wallet requests specially
apiClient.interceptors.request.use(function (config) {
    var _a;
    // Special handling for wallet authentication endpoints
    if ((_a = config.url) === null || _a === void 0 ? void 0 : _a.includes('/auth/wallet')) {
        // For wallet endpoints, ensure proper content type and timeout
        config.headers['Content-Type'] = 'application/json';
        config.timeout = config.timeout || 30000; // Use longer timeout for wallet operations
        // Add additional header to indicate wallet request (helps with debugging)
        config.headers['X-Wallet-Request'] = 'true';
        // Log wallet request for debugging
        console.log('Sending wallet request to:', config.url);
    }
    // Get JWT token from localStorage
    var token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = "Bearer ".concat(token);
    }
    return config;
}, function (error) {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});
// Add response interceptor to handle token refresh and wallet-specific errors
apiClient.interceptors.response.use(function (response) { return response; }, function (error) { return __awaiter(void 0, void 0, void 0, function () {
    var originalConfig, isAuthRefreshEndpoint, errorMessage, enhancedError, refreshToken, response, _a, accessToken, newRefreshToken, refreshError_1;
    var _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                originalConfig = error.config;
                if (!originalConfig) {
                    return [2 /*return*/, Promise.reject(error)];
                }
                isAuthRefreshEndpoint = (_b = originalConfig.url) === null || _b === void 0 ? void 0 : _b.includes('/auth/refresh-token');
                // Special handling for wallet authentication errors
                if ((_c = originalConfig.url) === null || _c === void 0 ? void 0 : _c.includes('/auth/wallet')) {
                    // Enhanced error for wallet connection issues
                    console.error('Wallet connection error:', error.message);
                    errorMessage = ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || error.message;
                    enhancedError = new Error("Wallet connection error: ".concat(errorMessage, ". Please check your wallet extension and try again."));
                    // Add additional context to the error
                    enhancedError.originalError = error;
                    enhancedError.isWalletError = true;
                    return [2 /*return*/, Promise.reject(enhancedError)];
                }
                if (!(((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) === 401 && !isAuthRefreshEndpoint && !originalConfig._retry)) return [3 /*break*/, 5];
                // Mark to avoid retry loops
                originalConfig._retry = true;
                // If token refresh is in progress, queue this request
                if (isRefreshing) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            failedRequestsQueue.push({
                                resolve: resolve,
                                reject: reject,
                                config: originalConfig,
                            });
                        })];
                }
                isRefreshing = true;
                _g.label = 1;
            case 1:
                _g.trys.push([1, 3, 4, 5]);
                refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // No refresh token available
                    processQueue(new Error('No refresh token available'));
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    // If in browser, redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login?session=expired';
                    }
                    return [2 /*return*/, Promise.reject(error)];
                }
                return [4 /*yield*/, axios_1.default.post("".concat(API_URL, "/auth/refresh-token"), { refreshToken: refreshToken })];
            case 2:
                response = _g.sent();
                _a = response.data, accessToken = _a.accessToken, newRefreshToken = _a.refreshToken;
                // Store new tokens
                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
                // Update auth header for the original request
                originalConfig.headers['Authorization'] = "Bearer ".concat(accessToken);
                // Process queued requests
                processQueue(null, accessToken);
                // Retry the original request
                return [2 /*return*/, apiClient(originalConfig)];
            case 3:
                refreshError_1 = _g.sent();
                // Token refresh failed
                processQueue(refreshError_1);
                // Clear tokens
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                // If in browser, redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login?session=expired';
                }
                return [2 /*return*/, Promise.reject(refreshError_1)];
            case 4:
                isRefreshing = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/, Promise.reject(error)];
        }
    });
}); });
// Add additional methods to the API client
var enhancedApiClient = apiClient;
exports.apiClient = enhancedApiClient;
// Reset the API client state
enhancedApiClient.resetState = function () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    // Clear cache by replacing the current adapter with a fresh one
    var freshCache = (0, axios_cache_adapter_1.setupCache)({
        maxAge: 15 * 60 * 1000,
        exclude: {
            methods: ['post', 'put', 'delete', 'patch'],
            filter: function (request) {
                if (request.url && request.url.includes('/auth/')) {
                    return true;
                }
                if (request.method === 'get') {
                    return !CACHEABLE_ROUTES.some(function (route) {
                        return request.url && request.url.includes(route);
                    });
                }
                return true;
            }
        },
        debug: process.env.NODE_ENV !== 'production'
    });
    // Update adapter with the fresh cache
    apiClient.defaults.adapter = freshCache.adapter;
};
// Get the current authorization token
enhancedApiClient.getToken = function () {
    return localStorage.getItem('accessToken');
};
// Check if the user is authenticated
enhancedApiClient.isAuthenticated = function () {
    return !!localStorage.getItem('accessToken');
};
// Set a new authorization token
enhancedApiClient.setToken = function (token) {
    localStorage.setItem('accessToken', token);
    apiClient.defaults.headers.common['Authorization'] = "Bearer ".concat(token);
};
// Clear the authorization token
enhancedApiClient.clearToken = function () {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
};
// Check if user is currently connected to the system
enhancedApiClient.isUserConnected = function () {
    return !!localStorage.getItem('accessToken');
};
// Get detailed authentication state
enhancedApiClient.getAuthState = function () {
    var accessToken = localStorage.getItem('accessToken');
    var refreshToken = localStorage.getItem('refreshToken');
    return {
        isAuthenticated: !!accessToken,
        hasRefreshToken: !!refreshToken
    };
};
// Add wallet-specific methods
enhancedApiClient.connectWallet = function (address) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, apiClient.post(api_config_1.endpoints.walletAuth.connect, { address: address })];
            case 1:
                response = _a.sent();
                console.log('Wallet connect response:', response.data);
                return [2 /*return*/, response.data];
            case 2:
                error_1 = _a.sent();
                console.error('Wallet connect error:', error_1);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
enhancedApiClient.authenticateWallet = function (address, signature, nonce) { return __awaiter(void 0, void 0, void 0, function () {
    var response, _a, accessToken, refreshToken, user, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, apiClient.post(api_config_1.endpoints.walletAuth.authenticate, {
                        address: address,
                        signature: signature,
                        nonce: nonce
                    })];
            case 1:
                response = _b.sent();
                _a = response.data, accessToken = _a.accessToken, refreshToken = _a.refreshToken, user = _a.user;
                // Store tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('walletAddress', address);
                // Set auth header
                apiClient.defaults.headers.common['Authorization'] = "Bearer ".concat(accessToken);
                return [2 /*return*/, response.data];
            case 2:
                error_2 = _b.sent();
                console.error('Wallet authentication error:', error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.default = enhancedApiClient;
