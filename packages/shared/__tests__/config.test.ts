import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getBatchSize,
  isValidWalletAddress,
  KUSWAP_LISTING_WALLET,
  DEFAULT_BATCH_SIZE,
  CACHE_TTL
} from '../src/config.js';

describe('Config Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('getBatchSize', () => {
    it('should return default batch size when env var is not set', () => {
      delete process.env.BATCH_SIZE;
      expect(getBatchSize()).toBe(DEFAULT_BATCH_SIZE);
    });

    it('should return parsed batch size from env var', () => {
      process.env.BATCH_SIZE = '50';
      expect(getBatchSize()).toBe(50);
    });

    it('should return default when env var is not a number', () => {
      process.env.BATCH_SIZE = 'invalid';
      expect(getBatchSize()).toBe(DEFAULT_BATCH_SIZE);
    });

    it('should return default when env var is zero or negative', () => {
      process.env.BATCH_SIZE = '0';
      expect(getBatchSize()).toBe(DEFAULT_BATCH_SIZE);

      process.env.BATCH_SIZE = '-10';
      expect(getBatchSize()).toBe(DEFAULT_BATCH_SIZE);
    });
  });

  describe('isValidWalletAddress', () => {
    it('should return true for valid Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3C',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        '0x1234567890abcdef1234567890abcdef12345678'
      ];

      validAddresses.forEach(address => {
        expect(isValidWalletAddress(address)).toBe(true);
      });
    });

    it('should return false for invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '', // empty
        '0x', // too short
        '0x123', // too short
        '0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3', // 39 chars
        '0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3CC', // 41 chars
        '0x742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3G', // invalid char G
        '742d35Cc6634C0532925a3b844Bc9eC0c6Dd6d3C', // missing 0x
        null as any, // null
        undefined as any, // undefined
        123 as any // number
      ];

      invalidAddresses.forEach(address => {
        expect(isValidWalletAddress(address)).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('should have correct KuSwap listing wallet address', () => {
      expect(KUSWAP_LISTING_WALLET).toBe('0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C');
      expect(KUSWAP_LISTING_WALLET).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have correct default batch size', () => {
      expect(DEFAULT_BATCH_SIZE).toBe(100);
    });

    it('should have correct cache TTL values', () => {
      expect(CACHE_TTL.OWNER_CHECK).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_TTL.SALE_CHECK).toBe(2 * 60 * 1000); // 2 minutes
    });
  });
});
