/**
 * Secure API Client
 * 
 * Combines security service, device fingerprinting, and CAPTCHA protection into a
 * single API client that can be used for sensitive operations.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { securityService, SecurityLevel, SecurityEventType } from "../../../security/securityService";
import { invisibleRecaptcha } from "../../../security/protection/captchaService";
import apiClient from "../../apiClient";

// Custom request config with additional security properties
export interface SecureRequestConfig extends InternalAxiosRequestConfig {
  riskScore?: number;
  requiresCaptcha?: boolean;
  encryptRequest?: boolean;
}

// Configuration for secure API client
export interface SecureApiConfig {
  enableSecurity: boolean;
  enableCaptcha: boolean;
  securityLevel: SecurityLevel;
  captchaForHighRiskOnly: boolean;
  riskThresholdForCaptcha: number;
}

// Default configuration
const DEFAULT_CONFIG: SecureApiConfig = {
  enableSecurity: true,
  enableCaptcha: true,
  securityLevel: SecurityLevel.MEDIUM,
  captchaForHighRiskOnly: true,
  riskThresholdForCaptcha: 50 // Only trigger CAPTCHA for risk scores >= 50
};

// Operations that are high risk and may require additional verification
const HIGH_RISK_OPERATIONS = [
  {
    method: 'post',
    urlPattern: /\/auth\/reset-password/
  },
  {
    method: 'post',
    urlPattern: /\/auth\/change-password/
  },
  {
    method: 'post',
    urlPattern: /\/wallet\/withdraw/
  },
  {
    method: 'post',
    urlPattern: /\/wallet\/transfer/
  },
  {
    method: 'post',
    urlPattern: /\/user\/update-email/
  },
  {
    method: 'post',
    urlPattern: /\/nft\/mint/
  },
  {
    method: 'post',
    urlPattern: /\/admin\/.*/
  }
];

/**
 * Secure API Client with enhanced security and CAPTCHA support
 */
class SecureApiClient {
  public apiClient: AxiosInstance;
  public config: SecureApiConfig;
  
  constructor(config?: Partial<SecureApiConfig>) {
    // Initialize configuration
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Set security level
    securityService.setSecurityLevel(this.config.securityLevel);
    
    // Create API client instance
    this.apiClient = axios.create({
      baseURL: apiClient.defaults.baseURL,
      timeout: apiClient.defaults.timeout,
      headers: { ...apiClient.defaults.headers }
    });
    
    // Apply interceptors
    this.setupInterceptors();
  }
  
  /**
   * Configure the secure API client
   */
  public configure(config: Partial<SecureApiConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update security level if specified
    if (config.securityLevel) {
      securityService.setSecurityLevel(config.securityLevel);
    }
  }
  
  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Security interceptor
    if (this.config.enableSecurity) {
      this.apiClient.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          const secureConfig = await securityService.enhanceRequest(config);
          return secureConfig as InternalAxiosRequestConfig;
        },
        (error) => Promise.reject(error)
      );
    }
    
    // CAPTCHA interceptor
    if (this.config.enableCaptcha) {
      this.apiClient.interceptors.request.use(
        invisibleRecaptcha.createRequestInterceptor(),
        (error) => Promise.reject(error)
      );
    }
    
    // Risk assessment interceptor
    this.apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Convert to secure config type
        const secureConfig = config as SecureRequestConfig;
        
        // Check if this is a high-risk operation
        const isHighRisk = this.isHighRiskOperation(secureConfig);
        
        if (isHighRisk) {
          // Determine the action type based on the URL
          const action = this.getActionTypeFromUrl(secureConfig.url || '');
          
          // Evaluate the risk for this action
          const riskAssessment = await securityService.isActionAllowed(action, {
            method: secureConfig.method,
            path: secureConfig.url
          });
          
          // Store the risk score in the request for later use
          secureConfig.riskScore = riskAssessment.riskScore;
          
          // If the action is not allowed, reject the request
          if (!riskAssessment.allowed) {
            // Record the blocked attempt
            securityService.recordEvent(
              SecurityEventType.SUSPICIOUS_ACTIVITY, 
              {
                action,
                method: secureConfig.method,
                path: secureConfig.url,
                riskScore: riskAssessment.riskScore,
                reason: riskAssessment.reason
              },
              false
            );
            
            return Promise.reject(new Error(`Action blocked: ${riskAssessment.reason}`));
          }
          
          // If the risk is high enough to require CAPTCHA
          if (
            this.config.enableCaptcha && 
            this.config.captchaForHighRiskOnly &&
            riskAssessment.riskScore >= this.config.riskThresholdForCaptcha
          ) {
            // Mark the request as requiring CAPTCHA
            secureConfig.requiresCaptcha = true;
          }
        }
        
        return secureConfig;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for security events
    this.apiClient.interceptors.response.use(
      (response) => {
        // Record successful high-risk operations
        const secureConfig = response.config as SecureRequestConfig;
        if (this.isHighRiskOperation(secureConfig)) {
          const action = this.getActionTypeFromUrl(secureConfig.url || '');
          securityService.recordEvent(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            {
              action,
              method: secureConfig.method,
              path: secureConfig.url,
              riskScore: secureConfig.riskScore || 0,
              result: 'success'
            }
          );
        }
        return response;
      },
      (error) => {
        // Record failed operations
        if (error.config && this.isHighRiskOperation(error.config)) {
          const secureConfig = error.config as SecureRequestConfig;
          const action = this.getActionTypeFromUrl(secureConfig.url || '');
          securityService.recordEvent(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            {
              action,
              method: secureConfig.method,
              path: secureConfig.url,
              riskScore: secureConfig.riskScore || 0,
              error: error.message,
              result: 'failure'
            },
            false
          );
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Check if a request matches one of our high-risk operations
   */
  private isHighRiskOperation(config: AxiosRequestConfig): boolean {
    const url = config.url || '';
    const method = (config.method || '').toLowerCase();
    
    return HIGH_RISK_OPERATIONS.some(op => 
      op.method.toLowerCase() === method && 
      op.urlPattern.test(url)
    );
  }
  
  /**
   * Get action type from URL for risk assessment
   */
  private getActionTypeFromUrl(url: string): string {
    if (/\/auth\/reset-password/.test(url)) return 'password_change';
    if (/\/auth\/change-password/.test(url)) return 'password_change';
    if (/\/wallet\/withdraw/.test(url)) return 'transaction';
    if (/\/wallet\/transfer/.test(url)) return 'transaction';
    if (/\/user\/update-email/.test(url)) return 'account_update';
    if (/\/nft\/mint/.test(url)) return 'transaction';
    if (/\/admin\//.test(url)) return 'admin_action';
    
    // Default to generic action
    return 'api_request';
  }
  
  /**
   * Enhance a request with security measures
   * This is a public method that can be used by other services
   */
  public async enhanceRequestWithSecurity(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    // Convert to our secure config type
    const secureConfig = config as SecureRequestConfig;
    
    // Add security headers via security service
    const enhancedConfig = await securityService.enhanceRequest(secureConfig);
    
    return enhancedConfig as InternalAxiosRequestConfig;
  }
  
  /**
   * Make a GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.get<T>(url, config);
  }
  
  /**
   * Make a POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.post<T>(url, data, config);
  }
  
  /**
   * Make a PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.put<T>(url, data, config);
  }
  
  /**
   * Make a PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.patch<T>(url, data, config);
  }
  
  /**
   * Make a DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.delete<T>(url, config);
  }
  
  /**
   * Execute a request with explicit CAPTCHA verification
   * regardless of risk assessment
   */
  public async withCaptcha<T = any>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    // Get a CAPTCHA token first
    await invisibleRecaptcha.execute();
    
    // Execute the request (token will be automatically included)
    return requestFn();
  }
  
  /**
   * Execute a request with enhanced security measures
   * including MFA if required by risk assessment
   */
  public async withEnhancedSecurity<T = any>(
    requestFn: () => Promise<AxiosResponse<T>>,
    securityOptions: {
      action: string;
      context?: Record<string, any>;
      mfaCallback?: () => Promise<boolean>;
    }
  ): Promise<AxiosResponse<T>> {
    const { action, context, mfaCallback } = securityOptions;
    
    // Evaluate risk
    const riskAssessment = await securityService.isActionAllowed(action, context || {});
    
    // If not allowed, reject
    if (!riskAssessment.allowed) {
      throw new Error(`Action blocked: ${riskAssessment.reason || 'High security risk'}`);
    }
    
    // If MFA is required and a callback is provided
    if (riskAssessment.requiresMfa && mfaCallback) {
      // Call MFA verification callback
      const mfaSuccess = await mfaCallback();
      
      if (!mfaSuccess) {
        throw new Error('MFA verification failed');
      }
    }
    
    // If high risk and CAPTCHA is enabled, get a token
    if (
      this.config.enableCaptcha &&
      riskAssessment.riskScore >= this.config.riskThresholdForCaptcha
    ) {
      await invisibleRecaptcha.execute();
    }
    
    // Execute the request
    return requestFn();
  }
}

// Create and export instance
export const secureApiClient = new SecureApiClient();

export default secureApiClient;