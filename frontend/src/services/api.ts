import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with proper CORS configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This ensures credentials are included in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create an Axios instance with default configs
export const apiClient = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies / CORS
});

// Define a type for our extended Axios request config
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set content type if not already set for POST, PUT, PATCH
    if (config.headers && 
        (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for refreshing token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to refresh token
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data.accessToken) {
          localStorage.setItem('access_token', response.data.accessToken);
          
          // Update the failed request with new token and retry
          apiClient.defaults.headers.common.Authorization = `Bearer ${response.data.accessToken}`;
          
          // Make sure headers exists before setting Authorization
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          }
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, clear auth and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      console.error('API error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API request made but no response received:', error.request);
    } else {
      console.error('API request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  // Wallet authentication should only be handled through the walletAuthService
  // for consistent security and device validation
  
  register: (email: string, password: string, referralCode?: string) => 
    apiClient.post('/auth/register', { email, password, referralCode }),
  
  forgotPassword: (email: string) => 
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    apiClient.post('/auth/reset-password', { token, password }),
  
  getUserInfo: () => 
    apiClient.get('/auth/me'),
};

export const referralService = {
  getReferralStats: () => 
    apiClient.get('/referral/stats'),
  
  generateReferralCode: () => 
    apiClient.post('/referral/code'),
  
  toggleReferralCode: (isActive: boolean) => 
    apiClient.patch('/referral/code/toggle', { isActive }),
  
  getReferralByCode: (code: string) => 
    apiClient.get(`/referral/code/${code}`),
};

export const shajiTokenService = {
  getBalance: () => 
    apiClient.get('/blockchain/token/balance'),
  
  mintFirstTime: () => 
    apiClient.post('/blockchain/minting/first-time'),
  
  mintAnnual: () => 
    apiClient.post('/blockchain/minting/annual'),
};

// Remove the duplicate connectWallet function - use walletAuthService instead

export default api;
