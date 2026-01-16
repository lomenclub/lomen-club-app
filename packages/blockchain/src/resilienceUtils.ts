/**
 * Resilience utilities combining circuit breaker, timeout, and retry patterns
 */

import { getCircuitBreaker, CircuitBreakerConfig } from './circuitBreaker.js';
import { withTimeout, DEFAULT_RPC_TIMEOUT_MS, createRpcTimeoutMessage } from './timeoutUtils.js';

export interface ResilienceConfig {
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export const DEFAULT_RESILIENCE_CONFIG: ResilienceConfig = {
  circuitBreaker: {},
  timeoutMs: DEFAULT_RPC_TIMEOUT_MS,
  maxRetries: 3,
  retryDelayMs: 1000
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay calculator
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Check if error is retryable (network errors, timeouts)
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const retryableMessages = [
    'timeout',
    'network',
    'connection',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return retryableMessages.some(keyword => errorMessage.includes(keyword));
}

/**
 * Execute an operation with resilience patterns:
 * 1. Circuit breaker protection
 * 2. Timeout wrapper
 * 3. Retry with exponential backoff
 * 
 * @param operation Async function to execute
 * @param operationName Name for logging and timeout messages
 * @param config Resilience configuration
 * @param fallback Optional fallback function if all attempts fail
 */
export async function executeWithResilience<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: ResilienceConfig = DEFAULT_RESILIENCE_CONFIG,
  fallback?: () => Promise<T> | T
): Promise<T> {
  const circuitBreaker = getCircuitBreaker(config.circuitBreaker);
  const timeoutMs = config.timeoutMs || DEFAULT_RPC_TIMEOUT_MS;
  const maxRetries = config.maxRetries || 3;
  const retryDelayMs = config.retryDelayMs || 1000;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wrap operation with timeout
      const timeoutMessage = createRpcTimeoutMessage(operationName);
      const operationWithTimeout = () => withTimeout(operation(), timeoutMs, timeoutMessage);
      
      // Execute with circuit breaker protection
      const result = await circuitBreaker.execute(operationWithTimeout, fallback);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = attempt < maxRetries && isRetryableError(error);
      
      if (shouldRetry) {
        const backoffDelay = calculateBackoffDelay(attempt, retryDelayMs);
        console.warn(`🔄 Retry attempt ${attempt}/${maxRetries} for ${operationName} after ${backoffDelay}ms:`, lastError.message);
        await sleep(backoffDelay);
        continue;
      }
      
      // No more retries, use fallback if available
      if (fallback) {
        console.warn(`⚠️  All retries failed for ${operationName}, using fallback:`, lastError.message);
        return fallback();
      }
      
      // No fallback, throw the error
      throw lastError;
    }
  }
  
  // This should never be reached due to the loop structure, but TypeScript needs it
  throw lastError || new Error(`Failed to execute ${operationName} after ${maxRetries} attempts`);
}

/**
 * Create a resilient function wrapper
 */
export function createResilientFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  config: ResilienceConfig = DEFAULT_RESILIENCE_CONFIG,
  fallback?: () => Promise<ReturnType<T>> | ReturnType<T>
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const operation = () => fn(...args);
    return executeWithResilience(operation, operationName, config, fallback);
  }) as T;
}

/**
 * Get resilience health status
 */
export function getResilienceHealth() {
  const circuitBreaker = getCircuitBreaker();
  return {
    circuitBreaker: circuitBreaker.getHealthStatus(),
    config: DEFAULT_RESILIENCE_CONFIG
  };
}

/**
 * Reset resilience components
 */
export function resetResilience(): void {
  const circuitBreaker = getCircuitBreaker();
  circuitBreaker.reset();
}
