import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import apiClient from "../../apiClient";

// Unique ID for operations
let operationIdCounter = 0;

/**
 * Offline operation types
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  CUSTOM = 'custom'
}

/**
 * Offline operation status
 */
export enum OperationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

/**
 * Interface for offline operations
 */
export interface OfflineOperation {
  id: string;
  timestamp: number;
  type: OperationType;
  url: string;
  method: string;
  data?: any;
  config?: AxiosRequestConfig;
  status: OperationStatus;
  retries: number;
  entityId?: string;
  entityType?: string;
  error?: any;
  hash?: string; // Used for conflict detection
}

/**
 * Interface for sync conflict resolution
 */
export interface SyncConflict {
  operation: OfflineOperation;
  serverData: any;
  localData: any;
  resolved: boolean;
  resolvedData?: any;
}

/**
 * Configuration options for offline support
 */
export interface OfflineConfig {
  enabled: boolean;
  maxRetries: number;
  syncInterval: number;
  persistenceKey: string;
  conflictHandler?: (conflict: SyncConflict) => Promise<any>;
}

/**
 * Enhanced API client with offline support
 * Queues operations when offline and syncs when back online
 */
export class OfflineApiClient {
  private config: OfflineConfig = {
    enabled: true,
    maxRetries: 3,
    syncInterval: 30000, // 30 seconds
    persistenceKey: 'offline_operations'
  };
  
  private operations: OfflineOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncTimer: number | null = null;
  private isInitialized: boolean = false;
  private isSyncing: boolean = false;
  private eventHandlers: { [event: string]: Array<Function> } = {};
  
  private client: AxiosInstance;
  
  // In the constructor, change the type to accept our custom ApiClient instead of requiring AxiosInstance
  constructor(client: any = apiClient) {
    this.client = client;
    
    // Initialize if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }
  
  /**
   * Initialize offline support
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Load any persisted operations
    this.loadOperations();
    
    // Set up network status listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start sync timer if online
    if (navigator.onLine) {
      this.startSyncTimer();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (!this.isInitialized) return;
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.isInitialized = false;
  }
  
  /**
   * Configure offline support options
   */
  public configure(config: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart sync timer with new interval if running
    if (this.syncTimer) {
      this.stopSyncTimer();
      this.startSyncTimer();
    }
  }
  
  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.isOnline = true;
    this.emit('connectionChange', { online: true });
    
    // Start sync timer
    this.startSyncTimer();
    
    // Try to sync immediately
    this.sync();
  };
  
  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    this.emit('connectionChange', { online: false });
    
    // Stop sync timer
    this.stopSyncTimer();
  };
  
  /**
   * Start sync timer
   */
  private startSyncTimer(): void {
    if (this.syncTimer) return;
    
    this.syncTimer = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.operations.length > 0) {
        this.sync();
      }
    }, this.config.syncInterval);
  }
  
  /**
   * Stop sync timer
   */
  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Load persisted operations
   */
  private loadOperations(): void {
    try {
      const savedData = localStorage.getItem(this.config.persistenceKey);
      if (savedData) {
        this.operations = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load offline operations:', error);
      this.operations = [];
    }
  }
  
  /**
   * Save operations to persistent storage
   */
  private saveOperations(): void {
    try {
      localStorage.setItem(
        this.config.persistenceKey,
        JSON.stringify(this.operations)
      );
    } catch (error) {
      console.error('Failed to save offline operations:', error);
    }
  }
  
  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `${Date.now()}-${operationIdCounter++}`;
  }
  
  /**
   * Add an operation to the queue
   */
  private addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'status' | 'retries'>): OfflineOperation {
    const newOperation: OfflineOperation = {
      id: this.generateOperationId(),
      timestamp: Date.now(),
      status: OperationStatus.PENDING,
      retries: 0,
      ...operation
    };
    
    this.operations.push(newOperation);
    this.saveOperations();
    
    // Notify about new pending operation
    this.emit('operationAdded', newOperation);
    
    return newOperation;
  }
  
  /**
   * Update an operation in the queue
   */
  private updateOperation(id: string, updates: Partial<OfflineOperation>): void {
    const index = this.operations.findIndex(op => op.id === id);
    if (index >= 0) {
      this.operations[index] = { ...this.operations[index], ...updates };
      this.saveOperations();
    }
  }
  
  /**
   * Remove an operation from the queue
   */
  private removeOperation(id: string): void {
    const index = this.operations.findIndex(op => op.id === id);
    if (index >= 0) {
      const operation = this.operations[index];
      this.operations.splice(index, 1);
      this.saveOperations();
      
      // Notify about operation removal
      this.emit('operationRemoved', operation);
    }
  }
  
  /**
   * Sync all pending operations
   */
  public async sync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;
    
    this.isSyncing = true;
    this.emit('syncStart', { count: this.getPendingOperationsCount() });
    
    try {
      const pendingOperations = this.operations.filter(
        op => op.status === OperationStatus.PENDING
      );
      
      for (const operation of pendingOperations) {
        try {
          this.updateOperation(operation.id, { status: OperationStatus.PROCESSING });
          
          // Process operation
          const response = await this.processOperation(operation);
          
          // Mark as completed
          this.updateOperation(operation.id, {
            status: OperationStatus.COMPLETED
          });
          
          // Remove completed operation
          this.removeOperation(operation.id);
          
          this.emit('operationSuccess', { operation, response });
        } catch (error) {
          // Handle operation failure
          const retryCount = operation.retries + 1;
          
          if (retryCount <= this.config.maxRetries) {
            // Update retry count for next attempt
            this.updateOperation(operation.id, {
              status: OperationStatus.PENDING,
              retries: retryCount,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            this.emit('operationRetry', { operation, error, retryCount });
          } else {
            // Mark as failed after max retries
            this.updateOperation(operation.id, {
              status: OperationStatus.FAILED,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            this.emit('operationFailed', { operation, error });
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.emit('syncComplete', { 
        success: this.operations.filter(op => op.status === OperationStatus.COMPLETED).length,
        failed: this.operations.filter(op => op.status === OperationStatus.FAILED).length,
        pending: this.operations.filter(op => op.status === OperationStatus.PENDING).length
      });
    }
  }
  
  /**
   * Process a single operation
   */
  private async processOperation(operation: OfflineOperation): Promise<AxiosResponse> {
    const { url, method, data, config = {} } = operation;
    
    // Check for conflict first if handler is provided
    if (this.config.conflictHandler && (method === 'put' || method === 'patch')) {
      try {
        // Get current server state for the resource
        const serverResponse = await this.client.get(url);
        
        // Create hash from server data for conflict detection
        const serverHash = JSON.stringify(serverResponse.data);
        
        // If we have a stored hash and it's different, we have a conflict
        if (operation.hash && operation.hash !== serverHash) {
          const conflict: SyncConflict = {
            operation,
            serverData: serverResponse.data,
            localData: data,
            resolved: false
          };
          
          // Mark as conflict while resolution is in progress
          this.updateOperation(operation.id, { status: OperationStatus.CONFLICT });
          
          // Wait for conflict resolution
          const resolvedData = await this.config.conflictHandler(conflict);
          
          // Use resolved data
          return this.client.request({
            url,
            method,
            data: resolvedData,
            ...config
          });
        }
      } catch (error) {
        // If conflict detection fails, proceed with normal operation
        console.warn('Conflict detection failed:', error);
      }
    }
    
    // Perform the operation
    return this.client.request({
      url,
      method,
      data,
      ...config
    });
  }
  
  /**
   * Register event handler
   */
  public on(event: string, handler: Function): () => void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    
    // Return unsubscribe function
    return () => {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    };
  }
  
  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    if (!this.eventHandlers[event]) return;
    
    for (const handler of this.eventHandlers[event]) {
      try {
        handler(data);
      } catch (error: unknown) {
        console.error(`Error in event handler for ${event}:`, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  
  /**
   * Get number of pending operations
   */
  public getPendingOperationsCount(): number {
    return this.operations.filter(op => op.status === OperationStatus.PENDING).length;
  }
  
  /**
   * Get all operations
   */
  public getOperations(): OfflineOperation[] {
    return [...this.operations];
  }
  
  /**
   * Clear all operations
   */
  public clearOperations(): void {
    this.operations = [];
    this.saveOperations();
    this.emit('operationsCleared', {});
  }
  
  /**
   * Perform an HTTP request with offline support
   */
  public async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // If online, try the request immediately
    if (this.isOnline) {
      try {
        return await this.client.request<T>(config);
      } catch (error: unknown) {
        // If it's a network error and offline support is enabled, queue it
        if (this.config.enabled && axios.isAxiosError(error) && !error.response) {
          const operation = this.queueRequest(config);
          
          // Return a mock response to avoid breaking the app flow
          const mockResponse: AxiosResponse<T> = {
            data: config.data as T,
            status: 202,
            statusText: 'Accepted (Offline)',
            headers: {},
            config: config as InternalAxiosRequestConfig<any>,
            request: {},
          };
          
          return mockResponse;
        }
        
        // Rethrow other errors
        throw error;
      }
    } else if (this.config.enabled) {
      // If offline and enabled, queue the request
      const operation = this.queueRequest(config);
      
      // Return a mock response
      const mockResponse: AxiosResponse<T> = {
        data: config.data as T,
        status: 202,
        statusText: 'Accepted (Offline)',
        headers: {},
        config: config as InternalAxiosRequestConfig<any>,
        request: {},
      };
      
      return mockResponse;
    } else {
      // Offline support disabled, throw network error
      throw new Error('Network unavailable and offline support is disabled');
    }
  }
  
  /**
   * Queue a request for offline processing
   */
  public queueRequest(config: AxiosRequestConfig): OfflineOperation {
    // Determine operation type
    let type = OperationType.CUSTOM;
    if (config.method) {
      const method = config.method.toLowerCase();
      if (method === 'post') type = OperationType.CREATE;
      else if (method === 'put' || method === 'patch') type = OperationType.UPDATE;
      else if (method === 'delete') type = OperationType.DELETE;
    }
    
    // For updates, store current state hash for conflict detection
    let hash: string | undefined;
    if (config.data) {
      try {
        hash = JSON.stringify(config.data);
      } catch (e) {
        // Ignore serialization errors
      }
    }
    
    // Extract entity information if available
    const entityInfo = this.extractEntityInfo(config);
    
    const operation = this.addOperation({
      type,
      url: config.url || '',
      method: config.method?.toLowerCase() || 'get',
      data: config.data,
      config: {
        headers: config.headers,
        params: config.params,
        timeout: config.timeout,
        responseType: config.responseType
      },
      entityId: entityInfo?.id,
      entityType: entityInfo?.type,
      hash
    });
    
    return operation;
  }
  
  /**
   * Extract entity information from request config
   */
  private extractEntityInfo(config: AxiosRequestConfig): { id?: string, type?: string } | undefined {
    if (!config.url) return undefined;
    
    try {
      // Try to extract entity type and ID from URL
      // Example: /api/users/123 -> { type: 'users', id: '123' }
      const urlParts = config.url.split('/').filter(Boolean);
      if (urlParts.length >= 2) {
        const type = urlParts[urlParts.length - 2];
        const id = urlParts[urlParts.length - 1];
        
        // Check if ID is actually an ID (not an action)
        if (/^[a-zA-Z0-9-_]+$/.test(id) && !id.includes('action')) {
          return { type, id };
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return undefined;
  }
  
  /**
   * HTTP request methods with offline support
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: 'get' });
  }
  
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: 'delete' });
  }
  
  public head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: 'head' });
  }
  
  public options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, method: 'options' });
  }
  
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, data, method: 'post' });
  }
  
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, data, method: 'put' });
  }
  
  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, url, data, method: 'patch' });
  }
}

// Create and export default instance
export const offlineApiClient = new OfflineApiClient();

// Default conflict resolution strategy
export const defaultConflictResolution = async (conflict: SyncConflict): Promise<any> => {
  // Default strategy: Use local changes but merge with server data
  // This is a very simple strategy, real apps should use more sophisticated approaches
  
  if (typeof conflict.localData === 'object' && conflict.localData !== null &&
      typeof conflict.serverData === 'object' && conflict.serverData !== null) {
    // Merge objects, with local data taking precedence
    return { ...conflict.serverData, ...conflict.localData };
  }
  
  // For non-objects, prefer local data
  return conflict.localData;
};

export default offlineApiClient;