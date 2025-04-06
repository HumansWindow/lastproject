/**
 * Encrypted API Client
 * 
 * This service extends the secure API client and adds end-to-end encryption for sensitive data.
 * It automatically encrypts requests and decrypts responses for routes that require encryption.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { secureApiClient, SecureApiConfig } from './secure-api-client';
import { encryptionService } from './encryption-service';

// Extend AxiosRequestConfig to add custom encryption properties
interface EncryptedRequestConfig extends AxiosRequestConfig {
  encryptRequest?: boolean;
}

// Extend InternalAxiosRequestConfig to add custom encryption properties
interface EncryptedInternalRequestConfig extends InternalAxiosRequestConfig {
  encrypt?: boolean;
  encryptRequest?: boolean;
}

// Routes that should always be encrypted for maximum security
const SENSITIVE_ROUTES = [
  // User sensitive information
  '/user/kyc',
  '/user/update-email',
  '/user/update-password',
  '/user/financial-details',
  '/user/security-settings',
  '/user/personal-info',
  
  // Financial transactions
  '/wallet/withdraw',
  '/wallet/transfer',
  '/payment/process',
  '/payment/add-method',
  
  // Authentication
  '/auth/mfa-setup',
  '/auth/reset-password',
  '/auth/recovery-options',
  
  // Admin routes
  '/admin/user-management',
  '/admin/system-settings',
  '/admin/security-logs',
  
  // Other sensitive data
  '/security/',
  '/verification/'
];

// Configuration for encrypted API client
export interface EncryptedApiConfig extends SecureApiConfig {
  enableEncryption: boolean;
  alwaysEncryptSensitiveRoutes: boolean;
  encryptionHeaderName: string;
}

// Default configuration
const DEFAULT_CONFIG: EncryptedApiConfig = {
  enableSecurity: true,
  enableCaptcha: true,
  securityLevel: secureApiClient.config.securityLevel,
  captchaForHighRiskOnly: true,
  riskThresholdForCaptcha: 50,
  enableEncryption: true,
  alwaysEncryptSensitiveRoutes: true,
  encryptionHeaderName: 'X-Encrypted-Request'
};

/**
 * Encrypted API client service
 */
class EncryptedApiClient {
  private apiClient: AxiosInstance;
  public config: EncryptedApiConfig;
  
  constructor(config: Partial<EncryptedApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.apiClient = axios.create();
    
    this.setupInterceptors();
  }
  
  /**
   * Should this request be encrypted?
   */
  private shouldEncryptRequest(config: EncryptedInternalRequestConfig): boolean {
    // If encryption is disabled, don't encrypt anything
    if (!this.config.enableEncryption) {
      return false;
    }
    
    // If explicitly flagged for encryption
    if (config.encryptRequest === true) {
      return true;
    }
    
    // If sensitive routes should be automatically encrypted
    if (this.config.alwaysEncryptSensitiveRoutes && config.url) {
      // Check if URL contains any sensitive route patterns
      return SENSITIVE_ROUTES.some(route => config.url!.includes(route));
    }
    
    return false;
  }
  
  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Apply encryption interceptors
    if (this.config.enableEncryption) {
      const encryptionInterceptors = encryptionService.createInterceptors();
      
      // Request interceptor for encryption
      this.apiClient.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          const customConfig = config as EncryptedInternalRequestConfig;
          
          // Should this request be encrypted?
          if (this.shouldEncryptRequest(customConfig)) {
            customConfig.encrypt = true; // Mark for encryption
          }
          
          // Pass to encryption interceptor
          return await encryptionInterceptors.requestInterceptor(customConfig);
        },
        (error) => Promise.reject(error)
      );
      
      // Response interceptor for decryption
      this.apiClient.interceptors.response.use(
        encryptionInterceptors.responseInterceptor,
        encryptionInterceptors.responseErrorInterceptor
      );
    }
    
    // Final request interceptor to apply security
    this.apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Apply all security enhancements from secure API client
        const enhancedConfig = await secureApiClient.enhanceRequestWithSecurity(config);
        return enhancedConfig;
      },
      (error) => Promise.reject(error)
    );
    
    // Final response interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        // Any additional response processing can go here
        return response;
      },
      (error) => {
        // Handle error (same as secure API client)
        
        // Check if there's a specific error for encrypted requests
        if (error.config && (error.config as EncryptedInternalRequestConfig).encrypt) {
          // Log encryption-related error
          console.error('Error in encrypted request:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Create typed request methods
  
  /**
   * Make a GET request
   */
  public async get<T = any>(url: string, config?: EncryptedRequestConfig): Promise<AxiosResponse<T>> {
    return this.apiClient.get<T>(url, {
      ...config
    });
  }
  
  /**
   * Make a DELETE request
   */
  public async delete<T = any>(url: string, config?: EncryptedRequestConfig): Promise<AxiosResponse<T>> {
    return this.apiClient.delete<T>(url, {
      ...config
    });
  }
  
  /**
   * Make a HEAD request
   */
  public async head<T = any>(url: string, config?: EncryptedRequestConfig): Promise<AxiosResponse<T>> {
    return this.apiClient.head<T>(url, {
      ...config
    });
  }
  
  /**
   * Make an OPTIONS request
   */
  public async options<T = any>(url: string, config?: EncryptedRequestConfig): Promise<AxiosResponse<T>> {
    return this.apiClient.options<T>(url, {
      ...config
    });
  }
  
  /**
   * Make a POST request with optional encryption
   */
  public async post<T = any, D = any>(
    url: string, 
    data?: D, 
    config?: EncryptedRequestConfig
  ): Promise<AxiosResponse<T>> {
    const configWithEncryption: EncryptedRequestConfig = {
      ...config
    };
    
    return this.apiClient.post<T, AxiosResponse<T>, D>(url, data, configWithEncryption);
  }
  
  /**
   * Make a PUT request with optional encryption
   */
  public async put<T = any, D = any>(
    url: string, 
    data?: D, 
    config?: EncryptedRequestConfig
  ): Promise<AxiosResponse<T>> {
    const configWithEncryption: EncryptedRequestConfig = {
      ...config
    };
    
    return this.apiClient.put<T, AxiosResponse<T>, D>(url, data, configWithEncryption);
  }
  
  /**
   * Make a PATCH request with optional encryption
   */
  public async patch<T = any, D = any>(
    url: string, 
    data?: D, 
    config?: EncryptedRequestConfig
  ): Promise<AxiosResponse<T>> {
    const configWithEncryption: EncryptedRequestConfig = {
      ...config
    };
    
    return this.apiClient.patch<T, AxiosResponse<T>, D>(url, data, configWithEncryption);
  }
  
  /**
   * Request with explicit encryption
   */
  public async encryptedRequest<T = any, D = any>(
    method: string, 
    url: string, 
    data?: D, 
    config?: EncryptedRequestConfig
  ): Promise<AxiosResponse<T>> {
    const encryptedConfig: EncryptedRequestConfig = {
      method,
      url,
      ...(data && { data }),
      ...config,
      encryptRequest: true
    };
    
    return this.apiClient.request<T>(encryptedConfig);
  }
}

// Create and export singleton instance
export const encryptedApiClient = new EncryptedApiClient();

export default encryptedApiClient;