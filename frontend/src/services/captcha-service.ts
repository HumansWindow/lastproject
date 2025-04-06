/**
 * CAPTCHA Service
 * 
 * This service integrates with popular CAPTCHA providers (Google reCAPTCHA, hCaptcha)
 * to protect sensitive operations from automated attacks.
 * 
 * Features:
 * - Support for multiple CAPTCHA providers
 * - Automatic script loading
 * - Verification token management
 * - Invisible and challenge modes
 */

// Supported CAPTCHA providers
export enum CaptchaProvider {
  RECAPTCHA = 'recaptcha',
  HCAPTCHA = 'hcaptcha',
}

// CAPTCHA configuration
export interface CaptchaConfig {
  provider: CaptchaProvider;
  siteKey: string;
  invisible?: boolean;
  scriptLoaded?: boolean;
  containerId?: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  onLoadCallback?: string;
  scriptSrc?: string;
  languageCode?: string;
}

// Default configuration
const DEFAULT_CONFIG: CaptchaConfig = {
  provider: CaptchaProvider.RECAPTCHA,
  siteKey: '',
  invisible: false,
  scriptLoaded: false,
  containerId: 'captcha-container',
  theme: 'light',
  size: 'normal',
  onLoadCallback: 'onCaptchaLoad',
  languageCode: 'en',
};

/**
 * CAPTCHA Service for protecting sensitive operations
 */
class CaptchaService {
  private config: CaptchaConfig;
  private widgetId: number | string | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolver: (() => void) | null = null;
  private readyRejector: ((error: any) => void) | null = null;
  
  constructor(config?: Partial<CaptchaConfig>) {
    // Initialize config with defaults and provided values
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Create a promise that will resolve when the CAPTCHA is loaded
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolver = resolve;
      this.readyRejector = reject;
    });
    
    // If in browser environment, set up the callback function for when CAPTCHA loads
    if (typeof window !== 'undefined') {
      (window as any)[this.config.onLoadCallback!] = () => {
        this.onScriptLoad();
      };
    }
  }
  
  /**
   * Initialize the CAPTCHA service
   */
  public async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('CAPTCHA service can only be initialized in browser environment.');
    }
    
    // Return existing promise if script is already loading
    if (this.readyPromise) {
      return this.readyPromise;
    }
    
    // Create a new ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolver = resolve;
      this.readyRejector = reject;
    });
    
    // Load the CAPTCHA script if not already loaded
    if (!this.config.scriptLoaded) {
      await this.loadScript();
    }
    
    return this.readyPromise;
  }
  
  /**
   * Load the CAPTCHA script based on the provider
   */
  private async loadScript(): Promise<void> {
    if (typeof document === 'undefined') return;
    
    // Determine script URL based on provider
    let scriptSrc = this.config.scriptSrc;
    if (!scriptSrc) {
      if (this.config.provider === CaptchaProvider.RECAPTCHA) {
        scriptSrc = `https://www.google.com/recaptcha/api.js?onload=${this.config.onLoadCallback}&render=${this.config.invisible ? this.config.siteKey : 'explicit'}`;
        
        // Add language code if specified
        if (this.config.languageCode) {
          scriptSrc += `&hl=${this.config.languageCode}`;
        }
      } else if (this.config.provider === CaptchaProvider.HCAPTCHA) {
        scriptSrc = `https://js.hcaptcha.com/1/api.js?onload=${this.config.onLoadCallback}&render=explicit`;
        
        // Add language code if specified
        if (this.config.languageCode) {
          scriptSrc += `&hl=${this.config.languageCode}`;
        }
      } else {
        this.readyRejector && this.readyRejector(new Error('Unsupported CAPTCHA provider.'));
        return;
      }
    }
    
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src^="${scriptSrc.split('?')[0]}"]`);
    if (existingScript) {
      this.config.scriptLoaded = true;
      this.readyResolver && this.readyResolver();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    
    // Handle script load error
    script.onerror = (error) => {
      console.error('Error loading CAPTCHA script:', error);
      this.readyRejector && this.readyRejector(new Error('Failed to load CAPTCHA script.'));
    };
    
    // Add script to document
    document.head.appendChild(script);
  }
  
  /**
   * Callback for when the CAPTCHA script has loaded
   */
  private onScriptLoad(): void {
    this.config.scriptLoaded = true;
    
    // Render widget if not invisible
    if (!this.config.invisible) {
      this.renderWidget();
    }
    
    // Resolve the ready promise
    this.readyResolver && this.readyResolver();
  }
  
  /**
   * Render a visible CAPTCHA widget
   */
  private renderWidget(): void {
    // Make sure the container element exists
    if (!this.config.containerId) {
      console.error('No container ID provided for CAPTCHA widget.');
      return;
    }
    
    const containerElement = document.getElementById(this.config.containerId);
    if (!containerElement) {
      console.error(`CAPTCHA container element with ID "${this.config.containerId}" not found.`);
      return;
    }
    
    try {
      // Render based on provider
      if (this.config.provider === CaptchaProvider.RECAPTCHA) {
        this.widgetId = (window as any).grecaptcha.render(this.config.containerId, {
          sitekey: this.config.siteKey,
          theme: this.config.theme,
          size: this.config.size,
          callback: (token: string) => this.onCaptchaSuccess(token),
          'expired-callback': () => this.onCaptchaExpired(),
          'error-callback': () => this.onCaptchaError(),
        });
      } else if (this.config.provider === CaptchaProvider.HCAPTCHA) {
        this.widgetId = (window as any).hcaptcha.render(this.config.containerId, {
          sitekey: this.config.siteKey,
          theme: this.config.theme,
          size: this.config.size,
          callback: (token: string) => this.onCaptchaSuccess(token),
          'expired-callback': () => this.onCaptchaExpired(),
          'error-callback': () => this.onCaptchaError(),
        });
      }
    } catch (error) {
      console.error('Error rendering CAPTCHA widget:', error);
    }
  }
  
  /**
   * Handle successful CAPTCHA verification
   */
  private onCaptchaSuccess(token: string): void {
    // Store the token
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('captcha_token', token);
      sessionStorage.setItem('captcha_timestamp', Date.now().toString());
    }
    
    // Dispatch event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('captcha:success', { detail: { token } });
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Handle CAPTCHA expiration
   */
  private onCaptchaExpired(): void {
    // Clear stored token
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('captcha_token');
    }
    
    // Dispatch event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('captcha:expired');
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Handle CAPTCHA error
   */
  private onCaptchaError(): void {
    // Dispatch event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('captcha:error');
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Execute an invisible CAPTCHA check
   */
  public async execute(): Promise<string> {
    // Make sure CAPTCHA is initialized
    await this.initialize();
    
    // If not invisible, get the response from the widget
    if (!this.config.invisible) {
      return this.getResponse();
    }
    
    return new Promise((resolve, reject) => {
      try {
        if (this.config.provider === CaptchaProvider.RECAPTCHA) {
          (window as any).grecaptcha.ready(() => {
            (window as any).grecaptcha.execute(this.config.siteKey, { action: 'submit' })
              .then((token: string) => {
                this.onCaptchaSuccess(token);
                resolve(token);
              })
              .catch((error: any) => {
                console.error('Error executing invisible reCAPTCHA:', error);
                reject(error);
              });
          });
        } else if (this.config.provider === CaptchaProvider.HCAPTCHA) {
          (window as any).hcaptcha.execute(this.widgetId, { async: true })
            .then((token: string) => {
              this.onCaptchaSuccess(token);
              resolve(token);
            })
            .catch((error: any) => {
              console.error('Error executing invisible hCaptcha:', error);
              reject(error);
            });
        } else {
          reject(new Error('Unsupported CAPTCHA provider.'));
        }
      } catch (error) {
        console.error('Error executing CAPTCHA:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Get the current CAPTCHA response
   */
  public getResponse(): string {
    if (typeof window === 'undefined' || !this.widgetId) {
      return '';
    }
    
    try {
      // Get response based on provider
      if (this.config.provider === CaptchaProvider.RECAPTCHA) {
        return (window as any).grecaptcha.getResponse(this.widgetId);
      } else if (this.config.provider === CaptchaProvider.HCAPTCHA) {
        return (window as any).hcaptcha.getResponse(this.widgetId);
      }
    } catch (error) {
      console.error('Error getting CAPTCHA response:', error);
    }
    
    return '';
  }
  
  /**
   * Reset the CAPTCHA widget
   */
  public reset(): void {
    if (typeof window === 'undefined' || !this.widgetId) {
      return;
    }
    
    try {
      // Reset based on provider
      if (this.config.provider === CaptchaProvider.RECAPTCHA) {
        (window as any).grecaptcha.reset(this.widgetId);
      } else if (this.config.provider === CaptchaProvider.HCAPTCHA) {
        (window as any).hcaptcha.reset(this.widgetId);
      }
      
      // Clear stored token
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('captcha_token');
      }
    } catch (error) {
      console.error('Error resetting CAPTCHA:', error);
    }
  }
  
  /**
   * Check if a stored CAPTCHA token is still valid
   */
  public isTokenValid(): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    
    const token = sessionStorage.getItem('captcha_token');
    const timestamp = sessionStorage.getItem('captcha_timestamp');
    
    if (!token || !timestamp) {
      return false;
    }
    
    // Check if token is less than 2 minutes old
    const now = Date.now();
    const tokenTime = parseInt(timestamp, 10);
    const expirationTime = 2 * 60 * 1000; // 2 minutes
    
    return now - tokenTime < expirationTime;
  }
  
  /**
   * Get the last verified CAPTCHA token
   */
  public getToken(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    
    return sessionStorage.getItem('captcha_token');
  }
  
  /**
   * Create an API interceptor function to add CAPTCHA tokens to requests
   */
  public createRequestInterceptor() {
    const captchaService = this;
    
    return async (config: any) => {
      // Check if the request requires CAPTCHA verification
      const requiresCaptcha = config.requiresCaptcha || false;
      
      if (requiresCaptcha) {
        // Check if we have a valid token
        if (!captchaService.isTokenValid()) {
          // Get a new token
          try {
            const token = await captchaService.execute();
            
            // Add token to request headers or data
            if (config.method && config.method.toLowerCase() === 'get') {
              // For GET requests, add as a query parameter
              config.params = config.params || {};
              config.params['captcha_token'] = token;
            } else {
              // For other requests, add to the data
              config.data = config.data || {};
              config.data['captcha_token'] = token;
            }
          } catch (error) {
            console.error('Error getting CAPTCHA token for request:', error);
            throw new Error('CAPTCHA verification failed. Please try again.');
          }
        } else {
          // Use existing token
          const token = captchaService.getToken();
          
          // Add token to request headers or data
          if (config.method && config.method.toLowerCase() === 'get') {
            // For GET requests, add as a query parameter
            config.params = config.params || {};
            config.params['captcha_token'] = token;
          } else {
            // For other requests, add to the data
            config.data = config.data || {};
            config.data['captcha_token'] = token;
          }
        }
      }
      
      return config;
    };
  }
}

// Create instance for Google reCAPTCHA (invisible mode)
export const invisibleRecaptcha = new CaptchaService({
  provider: CaptchaProvider.RECAPTCHA,
  siteKey: process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
  invisible: true,
});

// Create instance for visible CAPTCHA
export const visibleCaptcha = new CaptchaService({
  provider: CaptchaProvider.RECAPTCHA,
  siteKey: process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
  invisible: false,
  containerId: 'captcha-container',
});

// Create instance for hCaptcha
export const hCaptchaService = new CaptchaService({
  provider: CaptchaProvider.HCAPTCHA,
  siteKey: process.env.HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001', // Test key
  invisible: false,
  containerId: 'hcaptcha-container',
});

export default invisibleRecaptcha;