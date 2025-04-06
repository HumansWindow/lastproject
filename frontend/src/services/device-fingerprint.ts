/**
 * Device Fingerprinting Service
 * 
 * This service creates and manages device fingerprints for enhanced security.
 * It collects various non-PII (Personally Identifiable Information) device characteristics
 * to create a unique device identifier that helps with:
 * 
 * - Detecting suspicious login attempts
 * - Preventing account takeovers
 * - Enabling risk-based authentication
 * - Supporting multi-factor authentication decisions
 */

// Configuration interface for fingerprinting service
interface FingerprintConfig {
  // Storage key for device ID
  storageKey: string;
  
  // Components to use for fingerprinting
  components: {
    userAgent: boolean;      // Browser user agent
    language: boolean;       // Browser language
    colorDepth: boolean;     // Screen color depth
    screenResolution: boolean; // Screen resolution
    timezoneOffset: boolean; // Timezone offset
    sessionStorage: boolean; // SessionStorage availability
    localStorage: boolean;   // LocalStorage availability
    indexedDb: boolean;      // IndexedDB availability
    cpuCores: boolean;       // CPU core count
    touchSupport: boolean;   // Touch support details
    canvas: boolean;         // Canvas fingerprinting
    webgl: boolean;          // WebGL fingerprinting
    doNotTrack: boolean;     // DNT header
    fonts: boolean;          // System fonts
    audio: boolean;          // AudioContext fingerprinting
    plugins: boolean;        // Browser plugins
  };
  
  // Should fingerprint be stored in localStorage
  persistFingerprint: boolean;
  
  // Should detailed components be included in the report
  includeComponents: boolean;
  
  // Function to hash the fingerprint
  hashFunction?: (value: string) => string;
}

// Fingerprint result interface
interface FingerprintResult {
  // The main fingerprint hash/ID
  fingerprint: string;
  
  // Timestamp when the fingerprint was generated
  timestamp: number;
  
  // Optional raw component values
  components?: Record<string, any>;
  
  // Confidence score (0-1) that this is an accurate fingerprint
  confidence: number;
}

// Simple hash function (for non-cryptographic use)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36).replace(/-/g, '_');
}

// SHA-256 hash function (if available in the browser)
async function sha256Hash(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto API not supported, falling back to simple hash', e);
      return simpleHash(str);
    }
  }
  return simpleHash(str);
}

// Default configuration
const DEFAULT_CONFIG: FingerprintConfig = {
  storageKey: 'device_fingerprint',
  components: {
    userAgent: true,
    language: true,
    colorDepth: true,
    screenResolution: true,
    timezoneOffset: true,
    sessionStorage: true,
    localStorage: true,
    indexedDb: true,
    cpuCores: true,
    touchSupport: true,
    canvas: true,
    webgl: false, // Disabled by default as it's more intrusive
    doNotTrack: true,
    fonts: false, // Disabled by default as it's more intrusive
    audio: false, // Disabled by default as it's more intrusive
    plugins: true
  },
  persistFingerprint: true,
  includeComponents: false,
  hashFunction: undefined // Will use SHA-256 when available, fallback to simple hash
};

/**
 * DeviceFingerprint service creates and manages device fingerprints
 */
class DeviceFingerprintService {
  private config: FingerprintConfig;
  private cachedFingerprint: FingerprintResult | null = null;

  constructor(config: Partial<FingerprintConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get a device fingerprint
   */
  public async getFingerprint(): Promise<FingerprintResult> {
    // Check for cached fingerprint
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }
    
    // Check for stored fingerprint
    if (this.config.persistFingerprint && typeof window !== 'undefined') {
      const storedFingerprint = localStorage.getItem(this.config.storageKey);
      if (storedFingerprint) {
        try {
          const fingerprint = JSON.parse(storedFingerprint) as FingerprintResult;
          // Verify that it's not too old (max 30 days)
          if (fingerprint.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000) {
            this.cachedFingerprint = fingerprint;
            return fingerprint;
          }
        } catch (e) {
          // Invalid stored fingerprint, continue to generate new one
        }
      }
    }
    
    // Generate new fingerprint
    const fingerprint = await this.generateFingerprint();
    
    // Store the fingerprint
    if (this.config.persistFingerprint && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(fingerprint));
      } catch (e) {
        console.warn('Failed to store fingerprint in localStorage', e);
      }
    }
    
    this.cachedFingerprint = fingerprint;
    return fingerprint;
  }

  /**
   * Generate a new device fingerprint
   */
  private async generateFingerprint(): Promise<FingerprintResult> {
    // Collect component values
    const components: Record<string, any> = {};
    const availableComponents: string[] = [];
    let confidence = 1.0; // Start with perfect confidence
    
    // Only collect browser components in browser environment
    if (typeof window === 'undefined') {
      return {
        fingerprint: 'server-side',
        timestamp: Date.now(),
        confidence: 0
      };
    }
    
    // User Agent
    if (this.config.components.userAgent) {
      components.userAgent = navigator.userAgent;
      availableComponents.push('userAgent');
    }
    
    // Language
    if (this.config.components.language) {
      components.language = navigator.language;
      components.languages = navigator.languages ? navigator.languages.join(',') : '';
      availableComponents.push('language');
    }
    
    // Screen properties
    if (this.config.components.colorDepth) {
      components.colorDepth = window.screen.colorDepth;
      availableComponents.push('colorDepth');
    }
    
    if (this.config.components.screenResolution) {
      components.screenResolution = `${window.screen.width}x${window.screen.height}`;
      components.availableScreenResolution = `${window.screen.availWidth}x${window.screen.availHeight}`;
      availableComponents.push('screenResolution');
    }
    
    // Timezone
    if (this.config.components.timezoneOffset) {
      components.timezoneOffset = new Date().getTimezoneOffset();
      components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      availableComponents.push('timezoneOffset');
    }
    
    // Storage availability
    if (this.config.components.sessionStorage) {
      components.sessionStorage = this.hasSessionStorage();
      availableComponents.push('sessionStorage');
    }
    
    if (this.config.components.localStorage) {
      components.localStorage = this.hasLocalStorage();
      availableComponents.push('localStorage');
    }
    
    if (this.config.components.indexedDb) {
      components.indexedDb = this.hasIndexedDB();
      availableComponents.push('indexedDb');
    }
    
    // Hardware
    if (this.config.components.cpuCores) {
      components.cpuCores = navigator.hardwareConcurrency || 0;
      availableComponents.push('cpuCores');
    }
    
    // Touch support
    if (this.config.components.touchSupport) {
      components.touchSupport = 'ontouchstart' in window || 
        (navigator.maxTouchPoints > 0) || 
        ('msMaxTouchPoints' in navigator && (navigator as any).msMaxTouchPoints > 0);
      components.maxTouchPoints = navigator.maxTouchPoints || 0;
      availableComponents.push('touchSupport');
    }
    
    // Canvas fingerprinting (simplified, non-invasive version)
    if (this.config.components.canvas) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw a simple shape
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#F60';
          ctx.fillRect(1, 1, 280, 60);
          ctx.fillStyle = '#069';
          ctx.fillText('Browser fingerprinting', 8, 12);
          
          // Get the canvas data
          components.canvas = canvas.toDataURL().substr(-8); // Just take the last few chars
        } else {
          components.canvas = 'unsupported';
          confidence *= 0.95; // Reduce confidence slightly
        }
        availableComponents.push('canvas');
      } catch (e) {
        components.canvas = 'error';
        confidence *= 0.9; // Reduce confidence more significantly
        console.warn('Canvas fingerprinting failed', e);
      }
    }
    
    // WebGL fingerprinting (simplified, non-invasive version)
    if (this.config.components.webgl) {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          const renderer = (gl as any).getParameter((gl as any).RENDERER);
          const vendor = (gl as any).getParameter((gl as any).VENDOR);
          components.webglRenderer = renderer;
          components.webglVendor = vendor;
        } else {
          components.webgl = 'unsupported';
          confidence *= 0.97; // Reduce confidence slightly
        }
        availableComponents.push('webgl');
      } catch (e) {
        components.webgl = 'error';
        confidence *= 0.92; // Reduce confidence significantly
        console.warn('WebGL fingerprinting failed', e);
      }
    }
    
    // Do Not Track
    if (this.config.components.doNotTrack) {
      components.doNotTrack = navigator.doNotTrack === '1' || 
        navigator.doNotTrack === 'yes' || 
        (window as any).doNotTrack === '1' || 
        navigator.doNotTrack === '1';
      availableComponents.push('doNotTrack');
    }
    
    // Browser plugins (simplified, just count them)
    if (this.config.components.plugins && navigator.plugins) {
      components.plugins = navigator.plugins.length;
      availableComponents.push('plugins');
    }
    
    // Compute confidence based on available components
    confidence *= Math.min(1, availableComponents.length / 8);
    
    // Generate the component string for hashing
    const componentStr = JSON.stringify(components);
    
    // Hash the fingerprint
    const hashFn = this.config.hashFunction || sha256Hash;
    const fingerprintHash = await hashFn(componentStr);
    
    // Prepare result object
    const result: FingerprintResult = {
      fingerprint: fingerprintHash,
      timestamp: Date.now(),
      confidence
    };
    
    if (this.config.includeComponents) {
      result.components = components;
    }
    
    return result;
  }

  /**
   * Detect if sessionStorage is available
   */
  private hasSessionStorage(): boolean {
    try {
      return !!window.sessionStorage;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect if localStorage is available
   */
  private hasLocalStorage(): boolean {
    try {
      return !!window.localStorage;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect if IndexedDB is available
   */
  private hasIndexedDB(): boolean {
    try {
      return !!window.indexedDB;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear the cached fingerprint
   */
  public clearCache(): void {
    this.cachedFingerprint = null;
  }

  /**
   * Reset the saved fingerprint
   */
  public reset(): void {
    this.clearCache();
    if (typeof window !== 'undefined' && this.config.persistFingerprint) {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * Get device risk score (0-100, higher = riskier)
   * This is a basic implementation - you can enhance it based on your requirements
   */
  public async getRiskScore(): Promise<number> {
    const fingerprint = await this.getFingerprint();
    
    let riskScore = 0;
    
    // Base risk on confidence (low confidence = higher risk)
    riskScore += (1 - fingerprint.confidence) * 50;
    
    // Check if this is a new device
    if (typeof window !== 'undefined') {
      const knownDevices = this.getKnownDevices();
      if (!knownDevices.includes(fingerprint.fingerprint)) {
        riskScore += 20; // New device adds 20 points to risk
      }
    }
    
    // Check unusual patterns
    if (typeof window !== 'undefined') {
      // Unusual user agent patterns (browsers reporting other browsers, etc)
      const ua = navigator.userAgent.toLowerCase();
      if (
        (ua.includes('chrome') && ua.includes('firefox')) ||
        (ua.includes('chrome') && ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) ||
        (ua.includes('msie') && ua.includes('firefox'))
      ) {
        riskScore += 15; // Inconsistent user agent adds 15 points to risk
      }
      
      // Unusual behavior like touch support on desktop
      if (
        ('ontouchstart' in window) && 
        window.screen.width > 1024 && 
        !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      ) {
        riskScore += 10;
      }
    }
    
    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Register a device as known/trusted
   */
  public async registerTrustedDevice(): Promise<string> {
    const fingerprint = await this.getFingerprint();
    
    if (typeof window !== 'undefined') {
      const knownDevices = this.getKnownDevices();
      
      if (!knownDevices.includes(fingerprint.fingerprint)) {
        knownDevices.push(fingerprint.fingerprint);
        localStorage.setItem('known_devices', JSON.stringify(knownDevices));
      }
    }
    
    return fingerprint.fingerprint;
  }

  /**
   * Get list of known/trusted device fingerprints
   */
  private getKnownDevices(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('known_devices');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading known devices', e);
    }
    
    return [];
  }

  /**
   * Check if device is known/trusted
   */
  public async isKnownDevice(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const fingerprint = await this.getFingerprint();
    const knownDevices = this.getKnownDevices();
    
    return knownDevices.includes(fingerprint.fingerprint);
  }
}

// Create and export singleton instance
export const deviceFingerprint = new DeviceFingerprintService();

export default deviceFingerprint;