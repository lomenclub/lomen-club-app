// Export enrichment service
export { blockchainEnrichmentService } from './enrichmentService.js';

// Export other utilities that might be needed
export { simpleCacheService } from './simpleCacheService.js';
export { executeWithResilience, getResilienceHealth } from './resilienceUtils.js';
export { getProviderManager } from './providerManager.js';

// Only start the blockchain service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Import and start the blockchain service
  import('./blockchainServer.js').then(module => {
    module.startBlockchainService();
  }).catch(error => {
    console.error('Failed to start blockchain service:', error);
  });
}
