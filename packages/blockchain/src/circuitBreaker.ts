/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to a failing service.
 * States: CLOSED (normal), OPEN (blocked), HALF_OPEN (testing)
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;         // Time in ms before attempting to close circuit
  successThreshold: number;     // Number of successes needed to close circuit
  timeout: number;             // Timeout for individual operations in ms
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,          // 5 failures
  resetTimeout: 30000,          // 30 seconds
  successThreshold: 3,          // 3 successes
  timeout: 10000                // 10 seconds
};

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime: number = Date.now();
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  /**
   * Get current circuit breaker state
   */
  public getState(): CircuitBreakerState {
    this.checkAutoReset();
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  public getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      config: this.config
    };
  }

  /**
   * Execute an operation with circuit breaker protection
   * @param operation Async function to execute
   * @param fallback Optional fallback function if circuit is open or operation fails
   */
  public async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    // Check if we should auto-reset from OPEN to HALF_OPEN
    this.checkAutoReset();

    // If circuit is OPEN, immediately return fallback or throw
    if (this.state === CircuitBreakerState.OPEN) {
      console.warn(`🚨 Circuit breaker is OPEN, using fallback`);
      if (fallback) {
        return fallback();
      }
      throw new Error('Service unavailable (circuit breaker open)');
    }

    // If circuit is HALF_OPEN, we're testing if service is recovering
    const isHalfOpenTest = this.state === CircuitBreakerState.HALF_OPEN;

    try {
      // Execute the operation
      const result = await operation();
      
      // Record success
      this.recordSuccess(isHalfOpenTest);
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(error, isHalfOpenTest);
      
      // Try fallback if available
      if (fallback) {
        console.warn(`⚠️  Operation failed, using fallback:`, error instanceof Error ? error.message : 'Unknown error');
        return fallback();
      }
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Record a successful operation
   * @param isHalfOpenTest Whether this was a HALF_OPEN test
   */
  private recordSuccess(isHalfOpenTest: boolean): void {
    if (isHalfOpenTest) {
      this.successCount++;
      
      // If we have enough successes in HALF_OPEN state, close the circuit
      if (this.successCount >= this.config.successThreshold) {
        this.closeCircuit();
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   * @param error The error that occurred
   * @param isHalfOpenTest Whether this was a HALF_OPEN test
   */
  private recordFailure(error: unknown, isHalfOpenTest: boolean): void {
    console.error(`🔴 Circuit breaker recording failure:`, error instanceof Error ? error.message : 'Unknown error');
    
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (isHalfOpenTest) {
      // If HALF_OPEN test fails, immediately open circuit again
      this.openCircuit();
    } else if (this.failureCount >= this.config.failureThreshold) {
      // If we hit failure threshold in CLOSED state, open circuit
      this.openCircuit();
    }
  }

  /**
   * Open the circuit (stop allowing requests)
   */
  private openCircuit(): void {
    if (this.state !== CircuitBreakerState.OPEN) {
      console.warn(`🚨 Opening circuit breaker after ${this.failureCount} failures`);
      this.state = CircuitBreakerState.OPEN;
      this.lastStateChangeTime = Date.now();
      this.successCount = 0; // Reset success count for HALF_OPEN testing
    }
  }

  /**
   * Close the circuit (allow all requests)
   */
  private closeCircuit(): void {
    if (this.state !== CircuitBreakerState.CLOSED) {
      console.log(`✅ Closing circuit breaker after ${this.successCount} successful tests`);
      this.state = CircuitBreakerState.CLOSED;
      this.lastStateChangeTime = Date.now();
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  /**
   * Transition from OPEN to HALF_OPEN after reset timeout
   */
  private checkAutoReset(): void {
    if (this.state === CircuitBreakerState.OPEN && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceFailure >= this.config.resetTimeout) {
        console.log(`🔄 Circuit breaker reset timeout reached, transitioning to HALF_OPEN`);
        this.state = CircuitBreakerState.HALF_OPEN;
        this.lastStateChangeTime = Date.now();
        this.successCount = 0; // Start counting successes for HALF_OPEN
      }
    }
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  public reset(): void {
    console.log(`🔄 Manually resetting circuit breaker`);
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
  }

  /**
   * Check if circuit breaker is healthy (CLOSED or HALF_OPEN)
   */
  public isHealthy(): boolean {
    return this.state !== CircuitBreakerState.OPEN;
  }

  /**
   * Get health status for monitoring
   */
  public getHealthStatus() {
    return {
      state: this.state,
      isHealthy: this.isHealthy(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      timeSinceLastFailure: this.lastFailureTime ? Date.now() - this.lastFailureTime : null,
      timeSinceLastStateChange: Date.now() - this.lastStateChangeTime
    };
  }
}

// Singleton instance for global use
let globalCircuitBreaker: CircuitBreaker | null = null;

/**
 * Get or create the global circuit breaker instance
 */
export function getCircuitBreaker(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new CircuitBreaker(config);
  }
  return globalCircuitBreaker;
}

/**
 * Reset the global circuit breaker
 */
export function resetCircuitBreaker(): void {
  if (globalCircuitBreaker) {
    globalCircuitBreaker.reset();
  }
}

/**
 * Get global circuit breaker health status
 */
export function getCircuitBreakerHealth() {
  return globalCircuitBreaker?.getHealthStatus() || { state: 'NOT_INITIALIZED', isHealthy: false };
}
