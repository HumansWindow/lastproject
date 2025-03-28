interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  failureTimeout: number;
  [key: string]: any;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  circuitOpen: boolean;
  circuitOpenTime: number;
}

/**
 * Circuit breaker pattern implementation for RPC endpoints
 */
export class CircuitBreaker {
  private readonly name: string;
  private readonly options: CircuitBreakerOptions;
  private state: CircuitBreakerState;

  /**
   * Create a new circuit breaker
   */
  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: 5,
      resetTimeout: 30000,
      failureTimeout: 60000,
      ...options
    };
    
    this.state = {
      failures: 0,
      lastFailure: 0,
      circuitOpen: false,
      circuitOpenTime: 0
    };
  }
  
  /**
   * Check if the circuit is closed (ready to process requests)
   * @returns {boolean} Whether the circuit is closed
   */
  private isCircuitClosed(): boolean {
    // If circuit is open, check if we've waited long enough to try again
    if (this.state.circuitOpen) {
      const now = Date.now();
      const timeInOpen = now - this.state.circuitOpenTime;
      
      if (timeInOpen >= this.options.resetTimeout) {
        // Reset to half-open state to allow one request through
        this.state.circuitOpen = false;
        return true;
      }
      
      return false;
    }
    
    // Check for old failures that should be forgotten
    const now = Date.now();
    if (this.state.failures > 0 && now - this.state.lastFailure > this.options.failureTimeout) {
      this.state.failures = 0;
    }
    
    return true;
  }
  
  /**
   * Record a successful operation
   */
  public recordSuccess(): void {
    // If we were in half-open state, fully close the circuit
    this.state.failures = 0;
    this.state.circuitOpen = false;
  }
  
  /**
   * Record a failed operation
   */
  public recordFailure(): void {
    const now = Date.now();
    this.state.failures++;
    this.state.lastFailure = now;
    
    // Check if we need to open the circuit
    if (this.state.failures >= this.options.failureThreshold) {
      this.state.circuitOpen = true;
      this.state.circuitOpenTime = now;
    }
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {Function} fallback - Fallback function if circuit is open
   * @returns {Promise<any>} Result of the function or fallback
   */
  public async execute<T>(
    fn: () => Promise<T>,
    fallback: ((error?: any) => Promise<T>) | null = null
  ): Promise<T> {
    // Check if circuit is closed
    if (!this.isCircuitClosed()) {
      console.warn(`Circuit breaker ${this.name} is open, using fallback`);
      if (fallback) {
        return await fallback();
      }
      throw new Error(`Circuit breaker ${this.name} is open`);
    }
    
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (fallback) {
        return await fallback(error);
      }
      throw error;
    }
  }
}

/**
 * Create a circuit breaker map for different services
 */
export class CircuitBreakerMap {
  private breakers: Record<string, CircuitBreaker>;
  private defaults: CircuitBreakerOptions;

  /**
   * Create a new circuit breaker map
   * @param {Object} defaults - Default options for all circuit breakers
   */
  constructor(defaults: Partial<CircuitBreakerOptions> = {}) {
    this.breakers = {};
    this.defaults = {
      failureThreshold: 5,
      resetTimeout: 30000,
      failureTimeout: 60000,
      ...defaults
    };
  }
  
  /**
   * Get a circuit breaker for a specific service
   * @param {string} serviceName - Service identifier
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  public getBreaker(
    serviceName: string,
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    if (!this.breakers[serviceName]) {
      this.breakers[serviceName] = new CircuitBreaker(serviceName, {
        ...this.defaults,
        ...options
      });
    }
    return this.breakers[serviceName];
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param {string} serviceName - Service identifier
   * @param {Function} fn - Function to execute
   * @param {Function} fallback - Fallback function if circuit is open
   * @param {Object} options - Circuit breaker options
   * @returns {Promise<any>} Result of the function or fallback
   */
  public async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback: ((error?: any) => Promise<T>) | null = null,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, options);
    return breaker.execute(fn, fallback);
  }
}

// Export a default instance
export default new CircuitBreakerMap();
