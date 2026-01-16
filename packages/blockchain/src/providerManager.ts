/**
 * Provider Manager for managing multiple RPC providers with health monitoring
 * and automatic failover.
 */

import { ethers } from 'ethers';

export interface ProviderHealth {
  url: string;
  isHealthy: boolean;
  latency: number; // in milliseconds
  blockHeight: number;
  chainId: string;
  lastCheck: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  totalChecks: number;
  successRate: number; // percentage
}

export interface ProviderConfig {
  primary: string;
  backups: string[];
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number;  // milliseconds
  failureThreshold: number;    // consecutive failures to mark as unhealthy
  successThreshold: number;    // consecutive successes to mark as healthy
  maxBackupProviders: number;  // maximum number of backup providers to use
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  primary: 'http://localhost:8545',
  backups: [
    'https://rpc-mainnet.kcc.network'
    // Removed https://kcc-rpc.com due to timeout issues
    // Removed https://kcc.mytokenpocket.vip due to 404 errors
  ],
  healthCheckInterval: 30000, // 30 seconds
  healthCheckTimeout: 5000,   // 5 seconds
  failureThreshold: 3,        // 3 consecutive failures
  successThreshold: 5,        // 5 consecutive successes
  maxBackupProviders: 1       // use up to 1 backup provider
};

export class ProviderManager {
  private config: ProviderConfig;
  private providers: Map<string, ProviderHealth> = new Map();
  private currentProvider: string;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config?: Partial<ProviderConfig>) {
    this.config = { ...DEFAULT_PROVIDER_CONFIG, ...config };
    this.currentProvider = this.config.primary;
    
    // Initialize all providers
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Add primary provider
    this.providers.set(this.config.primary, {
      url: this.config.primary,
      isHealthy: false, // will be updated by health check
      latency: 0,
      blockHeight: 0,
      chainId: '',
      lastCheck: new Date(0),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalChecks: 0,
      successRate: 0
    });

    // Add backup providers (up to maxBackupProviders)
    const backupProviders = this.config.backups.slice(0, this.config.maxBackupProviders);
    backupProviders.forEach(backup => {
      this.providers.set(backup, {
        url: backup,
        isHealthy: false,
        latency: 0,
        blockHeight: 0,
        chainId: '',
        lastCheck: new Date(0),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        totalChecks: 0,
        successRate: 0
      });
    });

    console.log(`🔧 ProviderManager initialized with ${this.providers.size} providers`);
    console.log(`   Primary: ${this.config.primary}`);
    console.log(`   Backups: ${backupProviders.join(', ')}`);
  }

  /**
   * Start health monitoring
   */
  public startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      console.log('⚠️  Health monitoring already started');
      return;
    }

    console.log(`🔍 Starting health monitoring (interval: ${this.config.healthCheckInterval}ms)`);
    
    // Run initial health check
    this.checkAllProviders().catch(error => {
      console.error('Initial health check failed:', error);
    });

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkAllProviders().catch(error => {
        console.error('Periodic health check failed:', error);
      });
    }, this.config.healthCheckInterval);

    this.isInitialized = true;
  }

  /**
   * Stop health monitoring
   */
  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 Health monitoring stopped');
    }
  }

  /**
   * Get the current healthy provider
   */
  public getHealthyProvider(): string {
    // If current provider is healthy, use it
    const currentHealth = this.providers.get(this.currentProvider);
    if (currentHealth?.isHealthy) {
      return this.currentProvider;
    }

    // Find the first healthy provider
    for (const [url, health] of this.providers) {
      if (health.isHealthy) {
        console.log(`🔄 Switching from ${this.currentProvider} to ${url} (healthier)`);
        this.currentProvider = url;
        return url;
      }
    }

    // If no healthy providers, return the primary (even if unhealthy)
    console.warn(`⚠️  No healthy providers found, using primary: ${this.config.primary}`);
    return this.config.primary;
  }

  /**
   * Get a provider with fallback support
   */
  public async getProviderWithFallback(): Promise<ethers.JsonRpcProvider> {
    const healthyUrl = this.getHealthyProvider();
    return new ethers.JsonRpcProvider(healthyUrl, undefined, {
      staticNetwork: true,
      batchMaxCount: 1,
    });
  }

  /**
   * Check health of a single provider
   */
  private async checkProviderHealth(url: string): Promise<ProviderHealth & { syncProgress?: number; isSyncing?: boolean }> {
    const startTime = Date.now();
    const provider = new ethers.JsonRpcProvider(url, undefined, {
      staticNetwork: true,
      batchMaxCount: 1,
    });

    try {
      // Set timeout for health check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Health check timeout for ${url}`)), this.config.healthCheckTimeout);
      });

      // Run health checks in parallel
      const healthCheckPromise = (async () => {
        const [chainId, blockNumber, syncStatus] = await Promise.all([
          provider.send('eth_chainId', []),
          provider.getBlockNumber(),
          provider.send('eth_syncing', [])
        ]);

        const latency = Date.now() - startTime;
        const isSyncing = syncStatus !== false;
        let syncProgress = 0;

        // Calculate sync progress if syncing
        if (isSyncing && typeof syncStatus === 'object' && syncStatus !== null) {
          const current = parseInt(syncStatus.currentBlock, 16);
          const highest = parseInt(syncStatus.highestBlock, 16);
          const starting = parseInt(syncStatus.startingBlock, 16);
          
          if (highest > starting) {
            syncProgress = ((current - starting) / (highest - starting)) * 100;
          }
        }

        return {
          url,
          isHealthy: !isSyncing && chainId === '0x141', // KCC Mainnet chainId
          latency,
          blockHeight: blockNumber,
          chainId,
          lastCheck: new Date(),
          isSyncing,
          syncProgress: Math.round(syncProgress * 100) / 100 // Round to 2 decimal places
        };
      })();

      const result = await Promise.race([healthCheckPromise, timeoutPromise]);
      
      return {
        url,
        isHealthy: result.isHealthy,
        latency: result.latency,
        blockHeight: result.blockHeight,
        chainId: result.chainId,
        lastCheck: result.lastCheck,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0, // will be updated by updateProviderHealth
        totalChecks: 0, // will be updated by updateProviderHealth
        successRate: 0,  // will be updated by updateProviderHealth
        isSyncing: result.isSyncing,
        syncProgress: result.syncProgress
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`❌ Health check failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        url,
        isHealthy: false,
        latency,
        blockHeight: 0,
        chainId: '',
        lastCheck: new Date(),
        consecutiveFailures: 0, // will be updated by updateProviderHealth
        consecutiveSuccesses: 0,
        totalChecks: 0,
        successRate: 0,
        isSyncing: false,
        syncProgress: 0
      };
    }
  }

  /**
   * Update provider health based on check result
   */
  private updateProviderHealth(url: string, checkResult: Omit<ProviderHealth, 'consecutiveFailures' | 'consecutiveSuccesses' | 'totalChecks' | 'successRate'>): void {
    const existing = this.providers.get(url);
    if (!existing) {
      console.warn(`⚠️  Provider not found: ${url}`);
      return;
    }

    const totalChecks = existing.totalChecks + 1;
    const wasHealthy = existing.isHealthy;
    
    // Update consecutive counters
    let consecutiveFailures = existing.consecutiveFailures;
    let consecutiveSuccesses = existing.consecutiveSuccesses;
    
    if (checkResult.isHealthy) {
      consecutiveFailures = 0;
      consecutiveSuccesses = existing.consecutiveSuccesses + 1;
    } else {
      consecutiveFailures = existing.consecutiveFailures + 1;
      consecutiveSuccesses = 0;
    }

    // Determine new health status based on thresholds
    let isHealthy = checkResult.isHealthy;
    if (wasHealthy && consecutiveFailures >= this.config.failureThreshold) {
      isHealthy = false;
      console.warn(`🔴 Provider ${url} marked as unhealthy (${consecutiveFailures} consecutive failures)`);
    } else if (!wasHealthy && consecutiveSuccesses >= this.config.successThreshold) {
      isHealthy = true;
      console.log(`🟢 Provider ${url} marked as healthy (${consecutiveSuccesses} consecutive successes)`);
    }

    // Calculate success rate
    const successRate = totalChecks > 0 
      ? ((existing.successRate * existing.totalChecks) + (checkResult.isHealthy ? 1 : 0)) / totalChecks
      : checkResult.isHealthy ? 1 : 0;

    // Update provider health
    this.providers.set(url, {
      ...existing,
      ...checkResult,
      consecutiveFailures,
      consecutiveSuccesses,
      totalChecks,
      successRate,
      isHealthy
    });

    // Log health status change
    if (wasHealthy !== isHealthy) {
      console.log(`📊 Provider ${url} health changed: ${wasHealthy ? 'healthy' : 'unhealthy'} → ${isHealthy ? 'healthy' : 'unhealthy'}`);
    }
  }

  /**
   * Check health of all providers
   */
  public async checkAllProviders(): Promise<void> {
    console.log(`🔍 Running health check for ${this.providers.size} providers...`);
    
    const checkPromises = Array.from(this.providers.keys()).map(async (url) => {
      try {
        const checkResult = await this.checkProviderHealth(url);
        this.updateProviderHealth(url, checkResult);
        
        if (checkResult.isHealthy) {
          console.log(`✅ ${url}: healthy (${checkResult.latency}ms, block ${checkResult.blockHeight})`);
        } else {
          // Check if provider is syncing and show progress
          const syncInfo = checkResult as any; // Type assertion to access syncProgress
          if (syncInfo.isSyncing && syncInfo.syncProgress > 0) {
            console.log(`🔄 ${url}: syncing ${syncInfo.syncProgress}% (${checkResult.latency}ms)`);
          } else {
            console.log(`❌ ${url}: unhealthy (${checkResult.latency}ms)`);
          }
        }
      } catch (error) {
        console.error(`Failed to check provider ${url}:`, error);
      }
    });

    await Promise.allSettled(checkPromises);
    
    // Log summary
    const healthyCount = Array.from(this.providers.values()).filter(p => p.isHealthy).length;
    console.log(`📊 Health check complete: ${healthyCount}/${this.providers.size} providers healthy`);
  }

  /**
   * Get health status of all providers
   */
  public getProviderHealth(): Map<string, ProviderHealth> {
    return new Map(this.providers);
  }

  /**
   * Get current provider URL
   */
  public getCurrentProvider(): string {
    return this.currentProvider;
  }

  /**
   * Get provider health summary
   */
  public getHealthSummary() {
    const providers = Array.from(this.providers.values());
    const healthyProviders = providers.filter(p => p.isHealthy);
    const unhealthyProviders = providers.filter(p => !p.isHealthy);
    
    return {
      totalProviders: providers.length,
      healthyProviders: healthyProviders.length,
      unhealthyProviders: unhealthyProviders.length,
      currentProvider: this.currentProvider,
      providers: providers.map(p => ({
        url: p.url,
        isHealthy: p.isHealthy,
        latency: p.latency,
        blockHeight: p.blockHeight,
        lastCheck: p.lastCheck,
        successRate: Math.round(p.successRate * 100)
      }))
    };
  }

  /**
   * Manually mark a provider as unhealthy (for testing)
   */
  public markProviderUnhealthy(url: string): void {
    const provider = this.providers.get(url);
    if (provider) {
      provider.isHealthy = false;
      provider.consecutiveFailures = this.config.failureThreshold;
      provider.consecutiveSuccesses = 0;
      this.providers.set(url, provider);
      console.log(`🔴 Manually marked provider ${url} as unhealthy`);
    }
  }

  /**
   * Reset provider health (for testing)
   */
  public resetProviderHealth(url: string): void {
    const provider = this.providers.get(url);
    if (provider) {
      provider.isHealthy = false;
      provider.consecutiveFailures = 0;
      provider.consecutiveSuccesses = 0;
      provider.totalChecks = 0;
      provider.successRate = 0;
      this.providers.set(url, provider);
      console.log(`🔄 Reset provider health for ${url}`);
    }
  }

  /**
   * Check if provider manager is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get configuration
   */
  public getConfig(): ProviderConfig {
    return { ...this.config };
  }
}

// Singleton instance
let providerManagerInstance: ProviderManager | null = null;

export function getProviderManager(config?: Partial<ProviderConfig>): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new ProviderManager(config);
  }
  return providerManagerInstance;
}

export function resetProviderManager(): void {
  if (providerManagerInstance) {
    providerManagerInstance.stopHealthMonitoring();
    providerManagerInstance = null;
  }
}
