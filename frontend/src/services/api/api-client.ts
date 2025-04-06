import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Base URL for API calls - replace with actual API URL
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';

/**
 * Configuration for API client
 */
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials: boolean;
}

/**
 * Default client configuration
 */
const defaultConfig: ApiClientConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
};

/**
 * API client for making HTTP requests
 */
class ApiClient {
  private client: AxiosInstance;
  
  // Expose defaults for compatibility with interceptor code
  public defaults: any;
  
  // Expose interceptors for compatibility with other services
  public interceptors: typeof axios.interceptors;
  
  /**
   * Creates a new API client
   * @param config Configuration options
   */
  constructor(config: Partial<ApiClientConfig> = {}) {
    // Merge default config with provided config
    const mergedConfig: ApiClientConfig = {
      ...defaultConfig,
      ...config,
      headers: {
        ...defaultConfig.headers,
        ...(config.headers || {})
      }
    };
    
    // Create Axios instance
    this.client = axios.create(mergedConfig);
    
    // Expose client defaults for compatibility
    this.defaults = this.client.defaults;
    
    // Expose interceptors property
    this.interceptors = this.client.interceptors;
    
    // Set up request interceptor
    this.client.interceptors.request.use(
      this.handleRequest,
      this.handleRequestError
    );
    
    // Set up response interceptor
    this.client.interceptors.response.use(
      this.handleResponse,
      this.handleResponseError
    );
  }
  
  /**
   * Handle request before sending
   * @param config Request configuration
   */
  private handleRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add to headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  };
  
  /**
   * Handle request error
   * @param error Request error
   */
  private handleRequestError = (error: any): Promise<any> => {
    console.error('Request error:', error);
    return Promise.reject(error);
  };
  
  /**
   * Handle successful response
   * @param response Axios response
   */
  private handleResponse = (response: AxiosResponse): AxiosResponse => {
    return response;
  };
  
  /**
   * Handle response error, including token refresh on 401
   * @param error Response error
   */
  private handleResponseError = async (error: any): Promise<any> => {
    const originalRequest = error.config;
    
    // Check if error is a 401 Unauthorized
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        // If no refresh token, reject
        if (!refreshToken) {
          this.handleAuthError();
          return Promise.reject(error);
        }
        
        // Call refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );
        
        if (response.data.accessToken) {
          // Store new tokens
          localStorage.setItem('accessToken', response.data.accessToken);
          
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          // Update Authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          
          // Retry the original request
          return this.client(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        this.handleAuthError();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  };
  
  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page (adjust for your routing setup)
    if (typeof window !== 'undefined') {
      window.location.href = '/login?session=expired';
    }
  }
  
  /**
   * Make a GET request
   * @param url URL to request
   * @param config Request configuration
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config).then(response => response.data);
  }
  
  /**
   * Make a POST request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   */
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config).then(response => response.data);
  }
  
  /**
   * Make a PUT request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   */
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config).then(response => response.data);
  }
  
  /**
   * Make a DELETE request
   * @param url URL to request
   * @param config Request configuration
   */
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config).then(response => response.data);
  }
  
  /**
   * Make a PATCH request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   */
  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config).then(response => response.data);
  }
  
  /**
   * Make a custom request
   * @param config Request configuration
   */
  public request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.client.request(config).then(response => response.data);
  }
  
  /**
   * Get the underlying Axios instance
   */
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Default export
export default apiClient;