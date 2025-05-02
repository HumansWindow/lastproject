import jsonServerProvider from 'ra-data-json-server';
import axios from 'axios';

// Create an Axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout to prevent long-hanging requests
  timeout: 10000
});

// Add request interceptor for authentication if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth token logic here if needed
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Use the jsonServerProvider with our custom Axios instance
const dataProvider = jsonServerProvider(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  axiosInstance
);

// Default fallback values for when API calls fail
const defaultResponses = {
  health: { status: 'unknown', uptime: 0 },
  memory: { heapUsed: 0, heapTotal: 0, rss: 0 },
  blockchain: { 
    healthy: false, 
    activeNodes: 0,
    networks: {
      ethereum: { isConnected: false },
      polygon: { isConnected: false },
      bsc: { isConnected: false }
    }
  },
  users: { users: [], total: 0 }
};

// Helper function to extract error message safely
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// You can extend the provider with custom methods if needed
const extendedDataProvider = {
  ...dataProvider,
  
  // Custom method for system health check
  checkSystemHealth: async () => {
    try {
      const response = await axiosInstance.get('/admin/system/health');
      return { data: response.data };
    } catch (error: unknown) {
      console.warn('System health check failed:', getErrorMessage(error));
      return { data: defaultResponses.health };
    }
  },

  // Custom method for memory usage metrics
  getSystemMetrics: async () => {
    try {
      const response = await axiosInstance.get('/admin/system/metrics');
      return { data: response.data };
    } catch (error: unknown) {
      console.warn('System metrics fetch failed:', getErrorMessage(error));
      return { data: defaultResponses.memory };
    }
  },

  // Custom method for blockchain status
  getBlockchainStatus: async () => {
    try {
      const response = await axiosInstance.get('/admin/blockchain/status');
      return { data: response.data };
    } catch (error: unknown) {
      console.warn('Blockchain status fetch failed:', getErrorMessage(error));
      return { data: defaultResponses.blockchain };
    }
  },
  
  // Custom method for blockchain network overview
  getNetworkOverview: async () => {
    try {
      const response = await axiosInstance.get('/admin/blockchain/network-overview');
      return { data: response.data };
    } catch (error: unknown) {
      console.warn('Blockchain network overview fetch failed:', getErrorMessage(error));
      return { data: defaultResponses.blockchain };
    }
  },
  
  // Custom method for blockchain transactions
  getBlockchainTransactions: async (params: any) => {
    try {
      const { page = 1, perPage = 10 } = params;
      const response = await axiosInstance.get('/admin/blockchain/transactions', {
        params: {
          _start: (page - 1) * perPage,
          _end: page * perPage,
        }
      });
      return { 
        data: response.data.transactions,
        total: response.data.total
      };
    } catch (error: unknown) {
      console.warn('Blockchain transactions fetch failed:', getErrorMessage(error));
      return { data: [], total: 0 };
    }
  },
  
  // Custom method for blockchain wallet monitoring
  getHotWallets: async (params: any) => {
    try {
      const { page = 1, perPage = 10 } = params;
      const response = await axiosInstance.get('/admin/blockchain/wallets', {
        params: {
          _start: (page - 1) * perPage,
          _end: page * perPage,
        }
      });
      return { 
        data: response.data.wallets,
        total: response.data.total
      };
    } catch (error: unknown) {
      console.warn('Hot wallets fetch failed:', getErrorMessage(error));
      return { data: [], total: 0 };
    }
  },
  
  // User management methods
  getUsers: async (params: any) => {
    try {
      const { page = 1, perPage = 10, sortField = 'createdAt', sortOrder = 'DESC', filter = {} } = params;
      const response = await axiosInstance.get('/admin/users', {
        params: {
          _start: (page - 1) * perPage,
          _end: page * perPage,
          _sort: sortField,
          _order: sortOrder,
          ...filter
        }
      });
      return { 
        data: response.data.users,
        total: response.data.total
      };
    } catch (error: unknown) {
      console.warn('Users fetch failed:', getErrorMessage(error));
      return { data: [], total: 0 };
    }
  },
  
  // Admin login method
  adminLogin: async (credentials: { username: string, password: string }) => {
    try {
      const response = await axiosInstance.post('/admin/login', credentials);
      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.token);
      return { data: response.data };
    } catch (error: unknown) {
      console.error('Admin login failed:', getErrorMessage(error));
      throw error;
    }
  }
};

export default extendedDataProvider;