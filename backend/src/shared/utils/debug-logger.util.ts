import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Enhanced debug logger with request tracing
 */
export class DebugLogger extends Logger {
  private static configService: ConfigService;
  private static debugEnabled: boolean;

  static setConfigService(configService: ConfigService) {
    DebugLogger.configService = configService;
    DebugLogger.debugEnabled = configService.get<string>('DEBUG_MODE') === 'true';
  }

  constructor(context: string) {
    super(context);
  }

  /**
   * Log a message with request tracing
   */
  traceRequest(message: string, requestId?: string, metadata?: any) {
    const tracePrefix = requestId ? `[${requestId}]` : '';
    
    super.log(`${tracePrefix} ${message}`);
    
    if (DebugLogger.debugEnabled && metadata) {
      super.debug(`${tracePrefix} Details: ${JSON.stringify(metadata)}`);
    }
  }
  
  /**
   * Log an API request
   */
  apiRequest(method: string, path: string, params?: any) {
    super.log(`API ${method} ${path}`);
    
    if (DebugLogger.debugEnabled && params) {
      // Sanitize sensitive data
      const sanitizedParams = this.sanitizeParams(params);
      super.debug(`Request params: ${JSON.stringify(sanitizedParams)}`);
    }
  }
  
  /**
   * Remove sensitive data from logs
   */
  private sanitizeParams(params: any): any {
    if (!params) return params;
    
    const sanitized = { ...params };
    
    // Mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'signature', 'privateKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '******';
      }
    });
    
    return sanitized;
  }
}
