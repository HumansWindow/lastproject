import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      ...config,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    this.client.interceptors.response.use(
      (response) => response,
      this.handleResponseError
    );
  }
  
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }
  
  private async handleResponseError(error: any) {
    if (error?.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
  
  get(url: string, params?: any) {
    return this.client.get(url, { params });
  }
  
  post(url: string, data?: any) {
    return this.client.post(url, data);
  }
  
  put(url: string, data?: any) {
    return this.client.put(url, data);
  }
  
  delete(url: string) {
    return this.client.delete(url);
  }
}
