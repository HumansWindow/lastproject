import axios, { AxiosError } from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(new Error(error.message));
  }
);

// Add response interceptor to handle token expiry
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear tokens if they're invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(error.message));
  }
);

export interface WalletAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    address: string;
    isNewUser?: boolean;
  };
}

// Wallet authentication endpoints
export const authenticateWallet = async (
  address: string,
  signature: string,
  message: string
): Promise<WalletAuthResponse> => {
  try {
    const response = await apiClient.post<WalletAuthResponse>('/auth/wallet/authenticate', {
      address: address.toLowerCase(),
      signature,
      message
    });
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to authenticate wallet');
  }
};

export const getWalletChallenge = async (address: string): Promise<{ challenge: string; message: string }> => {
  try {
    const response = await apiClient.get(`/auth/wallet/challenge?address=${address.toLowerCase()}`);
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get wallet challenge');
  }
};

export default apiClient;
