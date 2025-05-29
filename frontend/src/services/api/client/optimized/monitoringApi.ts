import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import apiClient from "../../apiClient";

/**
 * Interface for API metrics
 */
export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimesMs: Record<string, number[]>;
  averageResponseTime: Record<string, number>;
  requestSizes: Record<string, number[]>;
  responseSizes: Record<string, number[]>;
  errorCounts: Record<string, number>;
  endpoints: Record<string, {
    calls: number;
    successRate: number;
    averageResponseTime: number;
    errors: number;
  }>;
  statusCodes: Record<string, number>;
  timestamps: number[];
  overallAverageResponseTime?: number;
  endpointCount?: number;
  errorsByType?: Record<string, number>;
  statusCodeDistribution?: Record<string, number>;
  topSlowEndpoints?: Array<{endpoint: string, averageTime: number}>;
  topErrorEndpoints?: Array<{endpoint: string, errors: number}>;
  uptime?: number;
}

/**
 * Interface for metrics by endpoint
 */
export interface EndpointMetrics {
  endpoint: string;
  method: string;
  callCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  lastCalledAt: Date | null;
}

/**
 * Interface for a single request log
 */
export interface RequestLog {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  status: number;
  durationMs: number;
  requestSize: number;
  responseSize: number;
  error: boolean;
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;
}

/**
 * Logging level configuration
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

/**
 * Configuration for monitoring system
 */
export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number;
  maxLogs: number;
  logLevel: LogLevel;
  consoleOutput: boolean;
  remoteLogging: boolean;
  remoteLoggingEndpoint?: string;
  remoteLoggingInterval?: number;
  excludedUrls?: RegExp[];
  reportSizes: boolean;
}

/**
 * Extended InternalAxiosRequestConfig with monitoring properties
 */
interface MonitoringRequestConfig extends InternalAxiosRequestConfig {
  monitoringStartTime?: number;
  monitoringRequestSize?: number;
}

/**
 * Enhanced API client with monitoring and telemetry capabilities
 * Tracks response times, error rates, and other performance metrics
 */
export class MonitoringApiClient {
  private metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimesMs: {},
    averageResponseTime: {},
    requestSizes: {},
    responseSizes: {},
    errorCounts: {},
    endpoints: {},
    statusCodes: {},
    timestamps: []
  };
  
  private requestLogs: RequestLog[] = [];
  private client: AxiosInstance;
  private startTime = Date.now();
  private remoteLoggingTimer: number | null = null;
  private logIdCounter = 0;
  
  private config: MonitoringConfig = {
    enabled: true,
    sampleRate: 1.0, // 100% of requests are monitored
    maxLogs: 1000,   // Maximum number of request logs to store
    logLevel: LogLevel.ERROR,
    consoleOutput: true,
    remoteLogging: false,
    remoteLoggingEndpoint: undefined,
    remoteLoggingInterval: 60000, // 1 minute
    excludedUrls: [/health/, /ping/],
    reportSizes: true
  };
  
  constructor(client = apiClient) {
    // Create a new axios instance using the defaults from the provided client
    // We don't rely on getAxiosInstance which doesn't exist on standard AxiosInstance
    this.client = axios.create({
      ...client.defaults
    });
    
    // Copy interceptors from original client
    const axiosInstance = client;
    const reqInterceptors = axiosInstance.interceptors.request as any;
    if (reqInterceptors.handlers) {
      reqInterceptors.handlers.forEach((handler: any) => {
        this.client.interceptors.request.use(handler.fulfilled, handler.rejected);
      });
    }
    
    const resInterceptors = axiosInstance.interceptors.response as any;
    if (resInterceptors.handlers) {
      resInterceptors.handlers.forEach((handler: any) => {
        this.client.interceptors.response.use(handler.fulfilled, handler.rejected);
      });
    }
    
    // Add monitoring interceptors
    this.setupMonitoringInterceptors();
    
    // Start remote logging if configured
    this.setupRemoteLogging();
  }
  
  /**
   * Configure monitoring options
   */
  public configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update remote logging based on new configuration
    this.setupRemoteLogging();
  }
  
  /**
   * Set up remote logging timer
   */
  private setupRemoteLogging(): void {
    // Clear existing timer if present
    if (this.remoteLoggingTimer !== null) {
      clearInterval(this.remoteLoggingTimer);
      this.remoteLoggingTimer = null;
    }
    
    // Set up new timer if remote logging is enabled
    if (this.config.enabled && 
        this.config.remoteLogging && 
        this.config.remoteLoggingEndpoint && 
        this.config.remoteLoggingInterval) {
      
      this.remoteLoggingTimer = window.setInterval(() => {
        this.sendLogsToRemoteEndpoint();
      }, this.config.remoteLoggingInterval);
    }
  }
  
  /**
   * Set up request and response monitoring interceptors
   */
  private setupMonitoringInterceptors(): void {
    // Request interceptor for monitoring
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Cast to our extended config type
        const requestConfig = config as MonitoringRequestConfig;
        
        if (!this.config.enabled || this.shouldSkipMonitoring(requestConfig.url)) {
          return requestConfig;
        }
        
        // Add request start time to config for later calculation
        requestConfig.monitoringStartTime = Date.now();
        
        // Calculate request size if enabled
        if (this.config.reportSizes && requestConfig.data) {
          try {
            const requestSize = this.calculateDataSize(requestConfig.data);
            requestConfig.monitoringRequestSize = requestSize;
          } catch (e) {
            this.log(LogLevel.WARN, 'Failed to calculate request size', e);
          }
        }
        
        return requestConfig;
      },
      (error: any) => {
        this.trackError(error, 'request');
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for monitoring
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestConfig = response.config as MonitoringRequestConfig;
        
        if (!this.config.enabled || this.shouldSkipMonitoring(requestConfig.url)) {
          return response;
        }
        
        this.trackResponse(response);
        return response;
      },
      (error: any) => {
        if (this.config.enabled && error.config && !this.shouldSkipMonitoring(error.config.url)) {
          this.trackError(error, 'response');
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Check if a URL should be excluded from monitoring
   */
  private shouldSkipMonitoring(url?: string): boolean {
    if (!url) return false;
    
    // Check if URL is in excluded list
    if (this.config.excludedUrls) {
      for (const pattern of this.config.excludedUrls) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }
    
    // Apply sampling rate
    if (this.config.sampleRate < 1.0) {
      return Math.random() > this.config.sampleRate;
    }
    
    return false;
  }
  
  /**
   * Track a successful response
   */
  private trackResponse(response: AxiosResponse): void {
    const config = response.config as MonitoringRequestConfig;
    const { status, data } = response;
    const startTime = config.monitoringStartTime || 0;
    const requestSize = config.monitoringRequestSize || 0;
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endpoint = this.normalizeUrl(config.url || '');
    const method = (config.method || 'get').toUpperCase();
    const endpointKey = `${method}:${endpoint}`;
    
    // Update general metrics
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.timestamps.push(endTime);
    
    // Update status code metrics
    const statusKey = status.toString();
    this.metrics.statusCodes[statusKey] = (this.metrics.statusCodes[statusKey] || 0) + 1;
    
    // Update response time metrics
    if (!this.metrics.responseTimesMs[endpointKey]) {
      this.metrics.responseTimesMs[endpointKey] = [];
    }
    this.metrics.responseTimesMs[endpointKey].push(duration);
    
    // Calculate and update average response time
    const responseTimes = this.metrics.responseTimesMs[endpointKey];
    const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
    this.metrics.averageResponseTime[endpointKey] = totalTime / responseTimes.length;
    
    // Update endpoint metrics
    if (!this.metrics.endpoints[endpointKey]) {
      this.metrics.endpoints[endpointKey] = {
        calls: 0,
        successRate: 1.0,
        averageResponseTime: 0,
        errors: 0
      };
    }
    
    const endpointMetrics = this.metrics.endpoints[endpointKey];
    endpointMetrics.calls++;
    endpointMetrics.averageResponseTime = 
      ((endpointMetrics.averageResponseTime * (endpointMetrics.calls - 1)) + duration) / 
      endpointMetrics.calls;
    endpointMetrics.successRate = 
      (endpointMetrics.calls - endpointMetrics.errors) / endpointMetrics.calls;
    
    // Track sizes if enabled
    if (this.config.reportSizes) {
      // Track request size
      if (requestSize) {
        if (!this.metrics.requestSizes[endpointKey]) {
          this.metrics.requestSizes[endpointKey] = [];
        }
        this.metrics.requestSizes[endpointKey].push(requestSize);
      }
      
      // Track response size
      try {
        const responseSize = this.calculateDataSize(data);
        if (!this.metrics.responseSizes[endpointKey]) {
          this.metrics.responseSizes[endpointKey] = [];
        }
        this.metrics.responseSizes[endpointKey].push(responseSize);
      } catch (e) {
        this.log(LogLevel.WARN, 'Failed to calculate response size', e);
      }
    }
    
    // Add to request logs with limited size
    const log: RequestLog = {
      id: `req_${Date.now()}_${this.logIdCounter++}`,
      timestamp: endTime,
      url: endpoint,
      method,
      status: status,
      durationMs: duration,
      requestSize: requestSize || 0,
      responseSize: data ? this.calculateDataSize(data) : 0,
      error: false
    };
    
    this.addLogEntry(log);
    
    // Log to console if configured
    this.log(LogLevel.DEBUG, `✅ ${method} ${endpoint} (${status}) - ${duration}ms`);
  }
  
  /**
   * Track an error response
   */
  private trackError(error: AxiosError, phase: 'request' | 'response'): void {
    // Skip if no config (this means it's not an API request error)
    if (!error.config) {
      return;
    }
    
    const config = error.config as MonitoringRequestConfig;
    const startTime = config.monitoringStartTime || Date.now() - 1;
    const requestSize = config.monitoringRequestSize || 0;
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endpoint = this.normalizeUrl(config.url || '');
    const method = (config.method || 'get').toUpperCase();
    const endpointKey = `${method}:${endpoint}`;
    
    // Determine error type
    let errorType = 'Unknown';
    let status = 0;
    
    if (error.response) {
      // Server responded with an error status code
      status = error.response.status;
      errorType = `HTTP${status}`;
    } else if (error.request) {
      // No response received (network error)
      errorType = 'Network';
    } else {
      // Error in setting up the request
      errorType = 'Request';
    }
    
    // Update general metrics
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.timestamps.push(endTime);
    
    // Update error metrics
    this.metrics.errorCounts[errorType] = (this.metrics.errorCounts[errorType] || 0) + 1;
    
    // Update status code metrics if available
    if (status > 0) {
      const statusKey = status.toString();
      this.metrics.statusCodes[statusKey] = (this.metrics.statusCodes[statusKey] || 0) + 1;
    }
    
    // Update endpoint metrics
    if (!this.metrics.endpoints[endpointKey]) {
      this.metrics.endpoints[endpointKey] = {
        calls: 0,
        successRate: 0,
        averageResponseTime: 0,
        errors: 0
      };
    }
    
    const endpointMetrics = this.metrics.endpoints[endpointKey];
    endpointMetrics.calls++;
    endpointMetrics.errors++;
    endpointMetrics.successRate = 
      (endpointMetrics.calls - endpointMetrics.errors) / endpointMetrics.calls;
    
    if (!this.metrics.responseTimesMs[endpointKey]) {
      this.metrics.responseTimesMs[endpointKey] = [];
    }
    this.metrics.responseTimesMs[endpointKey].push(duration);
    
    // Calculate and update average response time
    const responseTimes = this.metrics.responseTimesMs[endpointKey];
    const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
    this.metrics.averageResponseTime[endpointKey] = totalTime / responseTimes.length;
    
    // Add to request logs
    const log: RequestLog = {
      id: `err_${Date.now()}_${this.logIdCounter++}`,
      timestamp: endTime,
      url: endpoint,
      method,
      status: status,
      durationMs: duration,
      requestSize: requestSize || 0,
      responseSize: error.response?.data ? this.calculateDataSize(error.response.data) : 0,
      error: true,
      errorType,
      errorMessage: error.message,
      stackTrace: error.stack
    };
    
    this.addLogEntry(log);
    
    // Log to console if configured
    const responseInfo = status ? `(${status})` : '';
    this.log(LogLevel.ERROR, `❌ ${method} ${endpoint} ${responseInfo} - ${errorType}: ${error.message}`);
  }
  
  /**
   * Add a log entry, maintaining the max size limit
   */
  private addLogEntry(log: RequestLog): void {
    this.requestLogs.push(log);
    
    // Trim logs if exceeding max size
    if (this.requestLogs.length > this.config.maxLogs) {
      this.requestLogs = this.requestLogs.slice(-this.config.maxLogs);
    }
  }
  
  /**
   * Send collected logs to a remote endpoint
   */
  private async sendLogsToRemoteEndpoint(): Promise<void> {
    if (!this.config.remoteLoggingEndpoint || !this.requestLogs.length) {
      return;
    }
    
    try {
      // Copy logs to avoid race conditions
      const logsToSend = [...this.requestLogs];
      
      // Send logs to remote endpoint
      const response = await axios.post(
        this.config.remoteLoggingEndpoint,
        {
          metrics: this.getMetricsSummary(),
          logs: logsToSend,
          timestamp: Date.now(),
          sessionId: this.getSessionId()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Telemetry': 'true'
          }
        }
      );
      
      if (response.status === 200) {
        // After successful submission, clear the logs that were sent
        // to avoid duplicate reporting
        this.log(LogLevel.INFO, `Successfully sent ${logsToSend.length} logs to remote endpoint`);
        
        // Remove sent logs (keeping any new logs that arrived during the API call)
        const sentLogIds = new Set(logsToSend.map(log => log.id));
        this.requestLogs = this.requestLogs.filter(log => !sentLogIds.has(log.id));
      }
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to send logs to remote endpoint', error);
      // Logs will be attempted to be sent in the next interval
    }
  }
  
  /**
   * Get session ID for tracking
   */
  private getSessionId(): string {
    // Use an existing session ID or create a new one
    let sessionId = localStorage.getItem('api_monitoring_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('api_monitoring_session', sessionId);
    }
    return sessionId;
  }
  
  /**
   * Calculate size of data in bytes
   */
  private calculateDataSize(data: any): number {
    if (!data) return 0;
    
    try {
      if (typeof data === 'string') {
        return new Blob([data]).size;
      } else {
        return new Blob([JSON.stringify(data)]).size;
      }
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Normalize URL by removing query params and IDs
   * This helps group similar endpoints together in metrics
   */
  private normalizeUrl(url: string): string {
    try {
      // Remove query string
      const baseUrl = url.split('?')[0];
      
      // Replace IDs in URL paths with placeholders
      // Example: /users/123 -> /users/:id
      return baseUrl.replace(/\/[0-9a-f]{8,}(?=\/|$)/g, '/:id')
                    .replace(/\/[0-9]+(?=\/|$)/g, '/:id');
    } catch (e) {
      return url;
    }
  }
  
  /**
   * Log to console based on configured log level
   */
  private log(level: LogLevel, message: string, error?: any): void {
    if (!this.config.consoleOutput || level > this.config.logLevel) {
      return;
    }
    
    const prefix = 'API Monitoring:';
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, error || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, error || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, message, error || '');
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, message, error || '');
        break;
    }
  }
  
  /**
   * Get a summary of the current metrics
   */
  public getMetricsSummary(): Partial<APIMetrics> {
    // Calculate success rate
    const successRate = this.metrics.totalRequests > 0
      ? this.metrics.successfulRequests / this.metrics.totalRequests
      : 0;
    
    // Calculate overall average response time
    let totalResponseTime = 0;
    let totalResponses = 0;
    
    Object.values(this.metrics.responseTimesMs).forEach(times => {
      totalResponseTime += times.reduce((sum, time) => sum + time, 0);
      totalResponses += times.length;
    });
    
    const averageResponseTime = totalResponses > 0
      ? totalResponseTime / totalResponses
      : 0;
    
    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      overallAverageResponseTime: averageResponseTime,
      endpointCount: Object.keys(this.metrics.endpoints).length,
      errorsByType: { ...this.metrics.errorCounts },
      statusCodeDistribution: { ...this.metrics.statusCodes },
      topSlowEndpoints: this.getTopSlowEndpoints(5),
      topErrorEndpoints: this.getTopErrorEndpoints(5),
      uptime: Date.now() - this.startTime
    };
  }
  
  /**
   * Get the top slow endpoints
   */
  private getTopSlowEndpoints(count: number): Array<{endpoint: string, averageTime: number}> {
    return Object.entries(this.metrics.averageResponseTime)
      .map(([endpoint, time]) => ({ endpoint, averageTime: time }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, count);
  }
  
  /**
   * Get the endpoints with the most errors
   */
  private getTopErrorEndpoints(count: number): Array<{endpoint: string, errors: number}> {
    return Object.entries(this.metrics.endpoints)
      .map(([endpoint, data]) => ({ endpoint, errors: data.errors }))
      .sort((a, b) => b.errors - a.errors)
      .filter(item => item.errors > 0)
      .slice(0, count);
  }
  
  /**
   * Get detailed metrics for specific endpoints
   */
  public getEndpointMetrics(): EndpointMetrics[] {
    return Object.entries(this.metrics.endpoints).map(([key, data]) => {
      const [method, ...urlParts] = key.split(':');
      const endpoint = urlParts.join(':');
      const responseTimesMs = this.metrics.responseTimesMs[key] || [];
      
      const metrics: EndpointMetrics = {
        endpoint,
        method,
        callCount: data.calls,
        successCount: data.calls - data.errors,
        errorCount: data.errors,
        averageResponseTimeMs: data.averageResponseTime,
        minResponseTimeMs: responseTimesMs.length ? Math.min(...responseTimesMs) : 0,
        maxResponseTimeMs: responseTimesMs.length ? Math.max(...responseTimesMs) : 0,
        lastCalledAt: this.metrics.timestamps.length ? new Date(this.metrics.timestamps[this.metrics.timestamps.length - 1]) : null
      };
      
      return metrics;
    });
  }
  
  /**
   * Get detailed logs
   */
  public getLogs(limit?: number): RequestLog[] {
    if (limit && limit > 0) {
      return this.requestLogs.slice(-limit);
    }
    return [...this.requestLogs];
  }
  
  /**
   * Clear collected metrics and logs
   */
  public clearMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimesMs: {},
      averageResponseTime: {},
      requestSizes: {},
      responseSizes: {},
      errorCounts: {},
      endpoints: {},
      statusCodes: {},
      timestamps: []
    };
    
    this.requestLogs = [];
    this.startTime = Date.now();
    this.log(LogLevel.INFO, 'Metrics and logs cleared');
  }
  
  /**
   * HTTP request methods with monitoring
   */
  public request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }
  
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }
  
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
  
  public head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.head<T>(url, config);
  }
  
  public options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.options<T>(url, config);
  }
  
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }
  
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }
  
  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }
}

// Create and export default instance
export const monitoringApiClient = new MonitoringApiClient();

export default monitoringApiClient;