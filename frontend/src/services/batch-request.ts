/**
 * Batch Request Manager
 * 
 * Enables batching multiple API requests into a single HTTP request
 * to reduce network overhead and improve application performance.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from './api';

// Define request batch entry
interface BatchEntry {
  id: string;
  path: string;
  method: string;
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

// Define batch response from the server
interface BatchResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}

// Batch configuration options
interface BatchConfig {
  maxBatchSize: number;       // Maximum number of requests in a batch
  batchTimeWindow: number;    // Time window to collect requests (ms)
  endpoint: string;           // Batch API endpoint
  enabled: boolean;           // Whether batching is enabled
  autoDisableThreshold: number; // Disable batching after this many errors
}

/**
 * Request Batch Manager
 * 
 * Collects API requests within a time window and sends them as a batch
 */
export class RequestBatchManager {
  private config: BatchConfig;
  private pendingBatch: BatchEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessingBatch = false;
  private consecutiveErrors = 0;
  private enabled: boolean = true;

  /**
   * Create a new RequestBatchManager instance
   * @param config Override default configuration
   */
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: 10,
      batchTimeWindow: 50, // 50ms
      endpoint: '/api/batch',
      enabled: true,
      autoDisableThreshold: 3,
      ...config
    };
    
    this.enabled = this.config.enabled;
  }

  /**
   * Add a request to the current batch
   * @param path API endpoint path
   * @param method HTTP method
   * @param data Request payload data
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise that resolves with the response
   */
  public add<T = any>(
    path: string, 
    method: string = 'GET',
    data?: any, 
    params?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // If batching is disabled, make a direct request
    if (!this.enabled) {
      return this.makeDirectRequest<T>(path, method, data, params, headers);
    }

    // Check if this request type can be batched
    if (!this.canBatchRequest(path, method)) {
      return this.makeDirectRequest<T>(path, method, data, params, headers);
    }

    return new Promise<T>((resolve, reject) => {
      // Create a unique ID for this request
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add to pending batch
      this.pendingBatch.push({
        id,
        path,
        method,
        data,
        params,
        headers,
        resolve,
        reject
      });
      
      // Start or reset the batch timer
      this.scheduleBatch();
      
      // If batch size reached max, process immediately
      if (this.pendingBatch.length >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Enable or disable request batching
   * @param enabled Whether batching should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.pendingBatch.length > 0) {
      // Process any pending batch items individually
      const batch = [...this.pendingBatch];
      this.pendingBatch = [];
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      
      batch.forEach(item => {
        this.makeDirectRequest(
          item.path, 
          item.method, 
          item.data, 
          item.params, 
          item.headers
        )
          .then(item.resolve)
          .catch(item.reject);
      });
    }
  }

  /**
   * Check if batching is currently enabled
   * @returns True if batching is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset the error counter (e.g., after a successful batch)
   */
  public resetErrorCount(): void {
    this.consecutiveErrors = 0;
  }

  /**
   * Make a direct API request (without batching)
   * @param path API endpoint path
   * @param method HTTP method
   * @param data Request payload data
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise resolving with the response
   */
  private makeDirectRequest<T = any>(
    path: string, 
    method: string = 'GET',
    data?: any, 
    params?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      url: path,
      method,
      params,
      headers
    };
    
    if (data !== undefined) {
      config.data = data;
    }
    
    return apiClient.request<T>(config)
      .then(response => response.data);
  }

  /**
   * Schedule a batch to be processed
   */
  private scheduleBatch(): void {
    // Clear any existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set a new timer
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.batchTimeWindow);
  }

  /**
   * Process the current batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessingBatch || this.pendingBatch.length === 0) {
      return;
    }
    
    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    this.isProcessingBatch = true;
    
    // Get the current batch and reset for next round
    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    
    try {
      // Format batch request
      const batchRequest = batch.map(item => ({
        id: item.id,
        method: item.method,
        path: item.path,
        body: item.data,
        query: item.params,
        headers: item.headers
      }));
      
      // Send batch request
      const response = await apiClient.post<BatchResponse[]>(
        this.config.endpoint, 
        batchRequest
      );
      
      // Process batch responses
      const responseMap = new Map<string, BatchResponse>();
      response.data.forEach(item => {
        responseMap.set(item.id, item);
      });
      
      // Resolve/reject individual promises
      batch.forEach(item => {
        const batchResponse = responseMap.get(item.id);
        
        if (!batchResponse) {
          item.reject(new Error('No response received for this request in batch'));
          return;
        }
        
        if (batchResponse.status >= 200 && batchResponse.status < 300) {
          item.resolve(batchResponse.body);
        } else {
          item.reject({
            status: batchResponse.status,
            data: batchResponse.body,
            headers: batchResponse.headers
          });
        }
      });
      
      // Reset error count on success
      this.resetErrorCount();
      
    } catch (error) {
      // Handle batch request failure
      this.consecutiveErrors++;
      
      // Auto-disable batching after threshold is reached
      if (this.consecutiveErrors >= this.config.autoDisableThreshold) {
        console.warn(`Disabling API request batching after ${this.consecutiveErrors} consecutive errors`);
        this.setEnabled(false);
      }
      
      // Individual fallback: make direct requests for each item
      batch.forEach(item => {
        this.makeDirectRequest(
          item.path, 
          item.method, 
          item.data, 
          item.params, 
          item.headers
        )
          .then(item.resolve)
          .catch(item.reject);
      });
    }
    
    this.isProcessingBatch = false;
    
    // Process any requests that came in while we were processing this batch
    if (this.pendingBatch.length > 0) {
      this.scheduleBatch();
    }
  }

  /**
   * Check if a request can be batched
   * @param path Request path
   * @param method HTTP method
   * @returns True if the request can be batched
   */
  private canBatchRequest(path: string, method: string): boolean {
    // Only batch GET, POST, and PUT requests
    if (!['GET', 'POST', 'PUT'].includes(method.toUpperCase())) {
      return false;
    }
    
    // Don't batch auth/sensitive endpoints
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return false;
    }
    
    // Don't batch file uploads
    if (path.includes('/upload')) {
      return false;
    }
    
    return true;
  }
}

// Create a singleton instance
const batchManager = new RequestBatchManager();

/**
 * Enhanced API client with batching capabilities
 */
export const batchedApiClient = {
  /**
   * Make a GET request, potentially batched
   * @param path API endpoint path
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise with response
   */
  get: <T = any>(path: string, params?: any, headers?: Record<string, string>): Promise<T> => {
    return batchManager.add<T>(path, 'GET', undefined, params, headers);
  },
  
  /**
   * Make a POST request, potentially batched
   * @param path API endpoint path
   * @param data Request payload
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise with response
   */
  post: <T = any>(path: string, data?: any, params?: any, headers?: Record<string, string>): Promise<T> => {
    return batchManager.add<T>(path, 'POST', data, params, headers);
  },
  
  /**
   * Make a PUT request, potentially batched
   * @param path API endpoint path
   * @param data Request payload
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise with response
   */
  put: <T = any>(path: string, data?: any, params?: any, headers?: Record<string, string>): Promise<T> => {
    return batchManager.add<T>(path, 'PUT', data, params, headers);
  },
  
  /**
   * Make a DELETE request (not batched)
   * @param path API endpoint path
   * @param params Query parameters
   * @param headers Request headers
   * @returns Promise with response
   */
  delete: <T = any>(path: string, params?: any, headers?: Record<string, string>): Promise<T> => {
    // Delete requests are not batched for safety
    return apiClient.delete<T>(path, { params, headers }).then(res => res.data);
  },
  
  /**
   * Configure request batching
   * @param enabled Whether batching should be enabled
   */
  configureBatching: (enabled: boolean): void => {
    batchManager.setEnabled(enabled);
  },
  
  /**
   * Check if batching is enabled
   * @returns True if request batching is enabled
   */
  isBatchingEnabled: (): boolean => {
    return batchManager.isEnabled();
  }
};

export { batchManager };