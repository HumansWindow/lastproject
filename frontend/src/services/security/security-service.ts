/**
 * Security Service
 * 
 * Provides enhanced security features for the API client:
 * - Device fingerprinting integration
 * - Risk-based authentication
 * - Suspicious activity detection
 * - Security event logging
 */

import { deviceFingerprint } from './protection/device-fingerprint';
import apiClient from '../api/api-client';
import { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Security level enum
export enum SecurityLevel {
  LOW = 'low',       // Basic security (just tokens)
  MEDIUM = 'medium', // Default level (tokens + fingerprinting)
  HIGH = 'high'      // High security (tokens + fingerprinting + additional verifications)
}

// Authentication factors
export enum AuthFactor {
  PASSWORD = 'password',     // Something you know
  DEVICE = 'device',         // Something you have (trusted device)
  BIOMETRIC = 'biometric',   // Something you are
  EMAIL = 'email',           // Email verification
  SMS = 'sms',               // SMS verification
  AUTHENTICATOR = 'authenticator', // Authenticator app
  PHONE = 'phone',
  TOTP = 'totp',
  WALLET = 'wallet',
  RECOVERY = 'recovery'
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  NEW_DEVICE = 'new_device',
  PASSWORD_CHANGE = 'password_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  LOGOUT = 'logout'
}

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  deviceFingerprint?: string;
  ipAddress?: string;
  userId?: string;
  success?: boolean;
  riskScore?: number;
  details?: Record<string, any>;
}

// Security service configuration
interface SecurityConfig {
  securityLevel: SecurityLevel;
  requiredFactors: AuthFactor[];
  maxRiskScore: number; // Maximum allowed risk score (0-100)
  riskThresholds: {
    requireMfa: number; // Risk score that triggers MFA requirement
    requireApproval: number; // Risk score that triggers manual approval
    block: number; // Risk score that blocks the action
  };
  persistEvents: boolean; // Whether to store security events locally
  reportEvents: boolean; // Whether to report security events to backend
}

// Default configuration
const DEFAULT_CONFIG: SecurityConfig = {
  securityLevel: SecurityLevel.MEDIUM,
  requiredFactors: [AuthFactor.PASSWORD, AuthFactor.DEVICE],
  maxRiskScore: 70,
  riskThresholds: {
    requireMfa: 30,
    requireApproval: 60,
    block: 80
  },
  persistEvents: true,
  reportEvents: true
};

// Add/update this interface before the SecurityService class
export interface ActionEvaluationResult {
  allowed: boolean;
  requiresMfa: boolean;
  requiresApproval: boolean;
  riskScore: number;
  reason?: string;
}

/**
 * Security service for enhanced API security
 */
class SecurityService {
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private completedFactors: Set<AuthFactor> = new Set();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadEvents();
  }

  /**
   * Configure the security service
   */
  public configure(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the security level
   */
  public setSecurityLevel(level: SecurityLevel): void {
    this.config.securityLevel = level;
    
    // Update required factors based on security level
    switch (level) {
      case SecurityLevel.LOW:
        this.config.requiredFactors = [AuthFactor.PASSWORD];
        break;
      case SecurityLevel.MEDIUM:
        this.config.requiredFactors = [AuthFactor.PASSWORD, AuthFactor.DEVICE];
        break;
      case SecurityLevel.HIGH:
        this.config.requiredFactors = [
          AuthFactor.PASSWORD, 
          AuthFactor.DEVICE, 
          AuthFactor.AUTHENTICATOR
        ];
        break;
    }
  }

  /**
   * Get the current device fingerprint
   */
  public async getDeviceFingerprint(): Promise<string> {
    const result = await deviceFingerprint.getFingerprint();
    return result.fingerprint;
  }

  /**
   * Mark an authentication factor as completed
   */
  public completeAuthFactor(factor: AuthFactor): void {
    this.completedFactors.add(factor);
  }

  /**
   * Reset completed authentication factors
   */
  public resetAuthFactors(): void {
    this.completedFactors.clear();
  }

  /**
   * Check if all required authentication factors are completed
   */
  public isFullyAuthenticated(): boolean {
    if (this.config.requiredFactors.length === 0) return true;
    
    return this.config.requiredFactors.every(factor => 
      this.completedFactors.has(factor)
    );
  }

  /**
   * Get missing authentication factors
   */
  public getMissingFactors(): AuthFactor[] {
    return this.config.requiredFactors.filter(
      factor => !this.completedFactors.has(factor)
    );
  }

  /**
   * Evaluate security risk for an action
   * Returns a risk score (0-100, higher = riskier)
   */
  public async evaluateRisk(action: string, context: Record<string, any> = {}): Promise<number> {
    // Get base risk score from device fingerprint
    const deviceRiskScore = await deviceFingerprint.getRiskScore();
    
    // Initialize with device risk
    let riskScore = deviceRiskScore;
    
    // Factor in authentication level
    if (!this.isFullyAuthenticated()) {
      const missingFactors = this.getMissingFactors();
      // Add 10 points per missing factor
      riskScore += missingFactors.length * 10;
    }
    
    // Consider the action type
    switch (action) {
      case 'login':
        // Login risk depends on IP and device match
        if (context.newDevice) {
          riskScore += 15;
        }
        if (context.abnormalLocation) {
          riskScore += 20;
        }
        break;
        
      case 'transaction':
        // Transactions are higher risk
        riskScore += 10;
        
        // Large transactions are higher risk
        if (context.amount && context.amount > 1000) {
          riskScore += 15;
        }
        break;
        
      case 'password_change':
        // Password changes are high risk
        riskScore += 20;
        break;
        
      case 'account_update':
        // Account updates are medium risk
        riskScore += 10;
        break;
    }
    
    // Cap at 0-100
    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Check if action is allowed based on risk assessment
   */
  public async isActionAllowed(
    action: string, 
    context: Record<string, any> = {}
  ): Promise<ActionEvaluationResult> {
    const riskScore = await this.evaluateRisk(action, context);
    
    const result: ActionEvaluationResult = {
      allowed: riskScore < this.config.maxRiskScore,
      requiresMfa: riskScore >= this.config.riskThresholds.requireMfa,
      requiresApproval: riskScore >= this.config.riskThresholds.requireApproval,
      riskScore
    };
    
    // Add reason if not allowed
    if (!result.allowed) {
      result.reason = riskScore >= this.config.riskThresholds.block
        ? 'High risk score'
        : 'Maximum risk threshold exceeded';
    }
    
    return result;
  }

  /**
   * Enhance an API request with security headers
   */
  public async enhanceRequest(config: AxiosRequestConfig): Promise<InternalAxiosRequestConfig<any>> {
    // Create a new config object with the appropriate type
    const enhancedConfig = { ...config } as InternalAxiosRequestConfig;
    
    // Initialize headers properly
    if (!enhancedConfig.headers) {
      // Initialize with a simple object that will be converted by Axios internally
      enhancedConfig.headers = {
        'Content-Type': 'application/json'
      } as any; // Use type assertion as any to bypass the type check
    }
    
    // Add device fingerprint if available
    try {
      const fingerprint = await this.getDeviceFingerprint();
      if (fingerprint) {
        // Add to existing headers
        if (enhancedConfig.headers) {
          enhancedConfig.headers['X-Device-Fingerprint'] = fingerprint;
        }
      }
    } catch (e) {
      console.warn('Failed to add device fingerprint to request', e);
    }
    
    return enhancedConfig;
  }

  /**
   * Record a security event
   */
  public async recordEvent(
    type: SecurityEventType, 
    details: Record<string, any> = {},
    success: boolean = true
  ): Promise<void> {
    const event: SecurityEvent = {
      type,
      timestamp: Date.now(),
      success,
      details
    };
    
    // Add device fingerprint
    try {
      const fingerprint = await this.getDeviceFingerprint();
      event.deviceFingerprint = fingerprint;
    } catch (e) {
      // Ignore fingerprint errors
    }
    
    // Add IP if available
    // Note: Getting the client IP on the frontend is not reliable
    // The backend should associate the IP with this event
    
    // Store the event locally
    this.securityEvents.push(event);
    this.pruneEvents();
    this.saveEvents();
    
    // Report to backend if enabled
    if (this.config.reportEvents) {
      try {
        await this.reportEvent(event);
      } catch (e) {
        console.warn('Failed to report security event', e);
      }
    }
  }

  /**
   * Report a security event to the backend
   */
  private async reportEvent(event: SecurityEvent): Promise<void> {
    try {
      await apiClient.post('/security/events', event);
    } catch (e) {
      console.error('Error reporting security event:', e);
    }
  }

  /**
   * Load security events from storage
   */
  private loadEvents(): void {
    if (!this.config.persistEvents || typeof window === 'undefined') return;
    
    try {
      const storedEvents = localStorage.getItem('security_events');
      if (storedEvents) {
        this.securityEvents = JSON.parse(storedEvents);
      }
    } catch (e) {
      console.warn('Error loading security events', e);
    }
  }

  /**
   * Save security events to storage
   */
  private saveEvents(): void {
    if (!this.config.persistEvents || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('security_events', JSON.stringify(this.securityEvents));
    } catch (e) {
      console.warn('Error saving security events', e);
    }
  }

  /**
   * Remove old events to keep storage size manageable
   */
  private pruneEvents(): void {
    // Keep only last 50 events
    if (this.securityEvents.length > 50) {
      this.securityEvents = this.securityEvents.slice(-50);
    }
    
    // Remove events older than 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp >= thirtyDaysAgo
    );
  }

  /**
   * Get recent security events
   */
  public getEvents(
    limit: number = 10, 
    filterType?: SecurityEventType
  ): SecurityEvent[] {
    let events = [...this.securityEvents];
    
    // Apply type filter if provided
    if (filterType) {
      events = events.filter(event => event.type === filterType);
    }
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    return events.slice(0, limit);
  }

  /**
   * Register current device as trusted
   */
  public async trustCurrentDevice(): Promise<string> {
    return deviceFingerprint.registerTrustedDevice();
  }

  /**
   * Check if current device is trusted
   */
  public async isDeviceTrusted(): Promise<boolean> {
    return deviceFingerprint.isKnownDevice();
  }
  
  /**
   * Create an enhanced API client that automatically adds security headers
   */
  public createSecureApiClient() {
    const securityService = this;
    
    // Create interceptor for requests
    apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      return await securityService.enhanceRequest(config) as InternalAxiosRequestConfig;
    });
    
    return apiClient;
  }
}

// Create singleton instance
export const securityService = new SecurityService();

// Create secure API client
export const secureApiClient = securityService.createSecureApiClient();

export default securityService;