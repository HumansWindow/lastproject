import axios, { AxiosInstance, AxiosRequestConfig, AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from './api/api-client';

/**
 * Enhanced API client that allows selective field fetching
 * Reduces payload size by requesting only needed fields
 */
export const selectiveApiClient: AxiosInstance = axios.create({
  ...apiClient.defaults
});

// Copy all the interceptors from the main API client
// This ensures we maintain authentication, token refresh etc.
const reqInterceptors = apiClient.interceptors.request as any;
if (reqInterceptors.handlers) {
  reqInterceptors.handlers.forEach((handler: any) => {
    selectiveApiClient.interceptors.request.use(handler.fulfilled, handler.rejected);
  });
}

const resInterceptors = apiClient.interceptors.response as any;
if (resInterceptors.handlers) {
  resInterceptors.handlers.forEach((handler: any) => {
    selectiveApiClient.interceptors.response.use(handler.fulfilled, handler.rejected);
  });
}

/**
 * Interface for field selection options
 */
export interface FieldSelectionOptions {
  fields: string[];
  include?: string[];
  exclude?: string[];
  depth?: number;
}

/**
 * Helper to build field selection params
 */
export const fieldSelection = {
  /**
   * Create a GET request with field selection
   * @param url API endpoint
   * @param options Field selection options
   */
  get: <T>(url: string, options: FieldSelectionOptions) => {
    const params = buildFieldSelectionParams(options);
    return selectiveApiClient.get<T>(url, { params });
  },

  /**
   * Create a POST request with field selection
   * @param url API endpoint
   * @param data Request payload
   * @param options Field selection options
   */
  post: <T>(url: string, data: any, options: FieldSelectionOptions) => {
    const params = buildFieldSelectionParams(options);
    return selectiveApiClient.post<T>(url, data, { params });
  },

  /**
   * Create a PUT request with field selection
   * @param url API endpoint
   * @param data Request payload
   * @param options Field selection options
   */
  put: <T>(url: string, data: any, options: FieldSelectionOptions) => {
    const params = buildFieldSelectionParams(options);
    return selectiveApiClient.put<T>(url, data, { params });
  },

  /**
   * Create a PATCH request with field selection
   * @param url API endpoint
   * @param data Request payload
   * @param options Field selection options
   */
  patch: <T>(url: string, data: any, options: FieldSelectionOptions) => {
    const params = buildFieldSelectionParams(options);
    return selectiveApiClient.patch<T>(url, data, { params });
  },

  /**
   * Create a DELETE request with field selection
   * @param url API endpoint
   * @param options Field selection options
   */
  delete: <T>(url: string, options: FieldSelectionOptions) => {
    const params = buildFieldSelectionParams(options);
    return selectiveApiClient.delete<T>(url, { params });
  }
};

/**
 * Build query parameters for field selection
 * @param options Field selection options
 */
function buildFieldSelectionParams(options: FieldSelectionOptions): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (options.fields && options.fields.length > 0) {
    params.fields = options.fields.join(',');
  }
  
  if (options.include && options.include.length > 0) {
    params.include = options.include.join(',');
  }
  
  if (options.exclude && options.exclude.length > 0) {
    params.exclude = options.exclude.join(',');
  }
  
  if (options.depth !== undefined) {
    params.depth = options.depth.toString();
  }
  
  return params;
}

// Field selection shortcuts for common entities
export const userFields = {
  basic: ['id', 'email', 'username'],
  profile: ['id', 'email', 'username', 'name', 'avatar'],
  complete: ['id', 'email', 'username', 'name', 'avatar', 'bio', 'createdAt', 'lastLogin']
};

export const nftFields = {
  list: ['id', 'name', 'imageUrl', 'tokenId', 'contractAddress'],
  detail: ['id', 'name', 'imageUrl', 'description', 'tokenId', 'contractAddress', 'owner', 'createdAt']
};

export const diaryFields = {
  list: ['id', 'title', 'createdAt', 'location', 'feeling'],
  detail: ['id', 'title', 'content', 'createdAt', 'location', 'feeling', 'attachments']
};

export default selectiveApiClient;