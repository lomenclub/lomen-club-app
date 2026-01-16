/**
 * Shared configuration utilities for the Lomen Club application.
 * 
 * This module provides centralized configuration management, validation,
 * and constants used across the application.
 */

/**
 * Get batch size from environment variable with default.
 * 
 * Reads the BATCH_SIZE environment variable and returns it as a number.
 * If not set or invalid, returns the default value of 100.
 * 
 * @returns {number} Batch size for processing operations
 * @example
 * // Returns 100 if BATCH_SIZE is not set
 * const batchSize = getBatchSize();
 * 
 * // Returns 50 if BATCH_SIZE=50
 * process.env.BATCH_SIZE = '50';
 * const batchSize = getBatchSize(); // 50
 */
export function getBatchSize(): number {
  const batchSize = parseInt(process.env.BATCH_SIZE || '100');
  return isNaN(batchSize) || batchSize <= 0 ? 100 : batchSize;
}

/**
 * Get MongoDB URI from environment variable.
 * 
 * Reads the MONGODB_URI environment variable and validates it's set.
 * Throws an error if the environment variable is not set.
 * 
 * @returns {string} MongoDB connection URI
 * @throws {Error} If MONGODB_URI environment variable is not set
 * @example
 * // Throws error if MONGODB_URI is not set
 * const uri = getMongoDBUri();
 */
export function getMongoDBUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  return uri;
}

/**
 * Get blockchain service URL from environment variable with default.
 * 
 * Reads the BLOCKCHAIN_SERVICE_URL environment variable.
 * Defaults to 'http://localhost:3003' if not set.
 * 
 * @returns {string} Blockchain service URL
 * @example
 * // Returns 'http://localhost:3003' if not set
 * const url = getBlockchainServiceUrl();
 */
export function getBlockchainServiceUrl(): string {
  return process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3003';
}

/**
 * Get backend service URL from environment variable with default.
 * 
 * Reads the BACKEND_SERVICE_URL environment variable.
 * Defaults to 'http://localhost:3002' if not set.
 * 
 * @returns {string} Backend service URL
 * @example
 * // Returns 'http://localhost:3002' if not set
 * const url = getBackendServiceUrl();
 */
export function getBackendServiceUrl(): string {
  return process.env.BACKEND_SERVICE_URL || 'http://localhost:3002';
}

/**
 * Default batch size for processing operations.
 * Used when BATCH_SIZE environment variable is not set or invalid.
 */
export const DEFAULT_BATCH_SIZE = 100;

/**
 * Cache TTL (Time To Live) configuration for various operations.
 * 
 * OWNER_CHECK: How long owner information is cached (5 minutes)
 * SALE_CHECK: How long sale status is cached (2 minutes)
 */
export const CACHE_TTL = {
  OWNER_CHECK: 5 * 60 * 1000, // 5 minutes
  SALE_CHECK: 2 * 60 * 1000,  // 2 minutes
};

/**
 * Check if a string is a valid Ethereum wallet address.
 * 
 * Validates that the address:
 * - Starts with '0x'
 * - Contains exactly 40 hexadecimal characters (0-9, a-f, A-F)
 * - Is not empty or null
 * 
 * @param {string} address - The wallet address to validate
 * @returns {boolean} True if the address is valid, false otherwise
 * @example
 * isValidWalletAddress('0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3C'); // true
 * isValidWalletAddress('0x123'); // false (too short)
 * isValidWalletAddress(''); // false (empty)
 */
export function isValidWalletAddress(address: string): boolean {
  return !!address && /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * KuSwap listing wallet address (constant).
 * 
 * This is the wallet address used by the KuSwap marketplace to list NFTs for sale.
 * NFTs owned by this address are considered "on sale" in the marketplace.
 */
export const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
