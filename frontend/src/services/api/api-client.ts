// Base API client that can be imported by any service
import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

// Create axios instance with default config
const cache = setupCache({
  maxAge: 15 * 60 * 1000, // 15 minutes cache
});

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: cache.adapter,
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
