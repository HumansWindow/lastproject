import axios, { AxiosResponse, InternalAxiosRequestConfig, AxiosInstance, AxiosHeaders } from 'axios';
import pako from 'pako'; // Library for gzip compression
import apiClient from "../../apiClient";

/**
 * Enhanced API client with request/response compression
 * Reduces network payload size by applying GZIP compression
 */
export const compressedApiClient: AxiosInstance = axios.create({
  ...apiClient.defaults,
  headers: {
    ...apiClient.defaults.headers,
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Encoding': 'gzip'
  }
});

// Copy all the interceptors from the main API client
// This ensures we maintain authentication, token refresh etc.
const reqInterceptors = apiClient.interceptors.request as any;
if (reqInterceptors.handlers) {
  reqInterceptors.handlers.forEach((handler: any) => {
    compressedApiClient.interceptors.request.use(handler.fulfilled, handler.rejected);
  });
}

const resInterceptors = apiClient.interceptors.response as any;
if (resInterceptors.handlers) {
  resInterceptors.handlers.forEach((handler: any) => {
    compressedApiClient.interceptors.response.use(handler.fulfilled, handler.rejected);
  });
}

// Define a type with only the properties we're actually using from InternalAxiosRequestConfig
interface CompressedRequestConfig {
  data?: any;
  method?: string;
  headers?: AxiosHeaders;
  [key: string]: any;
}

// Add compression interceptor for requests
compressedApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Cast to our custom type for modification
    const modifiedConfig = { ...config } as unknown as CompressedRequestConfig;
    
    // Only compress requests with bodies (POST, PUT, PATCH)
    if (modifiedConfig.data && 
        (modifiedConfig.method === 'post' || 
         modifiedConfig.method === 'put' || 
         modifiedConfig.method === 'patch')) {
      try {
        // Convert data to JSON string
        const jsonData = JSON.stringify(modifiedConfig.data);
        
        // Skip compression for small payloads (less than 1KB)
        if (jsonData.length < 1024) {
          return modifiedConfig as unknown as InternalAxiosRequestConfig;
        }
        
        // Compress data using gzip
        const compressedData = pako.gzip(jsonData);
        
        // Convert binary data to base64 for transmission
        const base64Data = Buffer.from(compressedData).toString('base64');
        
        // Replace the original data with compressed data
        modifiedConfig.data = base64Data;
        
        // Add compression info to headers
        if (!modifiedConfig.headers) {
          modifiedConfig.headers = new AxiosHeaders();
        }
        modifiedConfig.headers.set('Content-Encoding', 'gzip');
        modifiedConfig.headers.set('X-Compressed', 'true');
        
        return modifiedConfig as unknown as InternalAxiosRequestConfig;
      } catch (error) {
        console.warn('Failed to compress request data:', error);
        // Fall back to uncompressed request
        return modifiedConfig as unknown as InternalAxiosRequestConfig;
      }
    }
    return modifiedConfig as unknown as InternalAxiosRequestConfig;
  },
  (error) => Promise.reject(error)
);

// Add decompression interceptor for responses
compressedApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response is compressed
    if (response.headers?.['content-encoding'] === 'gzip' || 
        response.headers?.['x-compressed'] === 'true') {
      try {
        // If the response is already parsed JSON, it's already decompressed by Axios/browser
        if (typeof response.data === 'object') {
          return response;
        }
        
        // If response is base64 compressed data
        if (typeof response.data === 'string') {
          // Convert base64 to binary
          const binaryData = Buffer.from(response.data, 'base64');
          
          // Decompress the data
          const decompressedData = pako.ungzip(binaryData);
          
          // Convert back to string and parse as JSON
          const jsonData = new TextDecoder().decode(decompressedData);
          response.data = JSON.parse(jsonData);
        }
      } catch (error) {
        console.warn('Failed to decompress response data:', error);
        // Return the original response if decompression fails
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

/**
 * Configuration options for the compressed API client
 */
export const compressionConfig = {
  enabled: true,
  compressionThreshold: 1024, // Don't compress payloads smaller than 1KB
  
  /**
   * Enable or disable compression
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    // Update the header for subsequent requests
    if (enabled) {
      compressedApiClient.defaults.headers['Content-Encoding'] = 'gzip';
      compressedApiClient.defaults.headers['Accept-Encoding'] = 'gzip, deflate, br';
    } else {
      delete compressedApiClient.defaults.headers['Content-Encoding'];
    }
  },
  
  /**
   * Set minimum size threshold for compression (in bytes)
   */
  setCompressionThreshold(bytes: number) {
    this.compressionThreshold = bytes;
  }
};

// Export specific services with compression enabled
// This follows the same pattern as the main API client

export default compressedApiClient;