/* global NodeJS */

/**
 * Utility functions for adding timeouts to async operations
 */

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message to throw on timeout
 * @returns The promise result or throws on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Default timeout for RPC calls (30 seconds)
 */
export const DEFAULT_RPC_TIMEOUT_MS = 30 * 1000;

/**
 * Creates a timeout error message for RPC calls
 */
export function createRpcTimeoutMessage(operation: string, tokenId?: number): string {
  if (tokenId !== undefined) {
    return `RPC timeout: ${operation} for NFT ${tokenId} took too long`;
  }
  return `RPC timeout: ${operation} took too long`;
}
