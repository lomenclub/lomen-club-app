# Performance Analysis: N+1 Blockchain Calls Issue

## Purpose
Capture performance findings related to N+1 blockchain calls in enrichment flows.

## Audience
Backend and blockchain service developers, performance QA.

## Prerequisites
- Access to backend and blockchain service logs.
- Ability to run performance tests against `/api/nfts`.

## Last Verified
2026-01-03 (legacy performance run).

## Issue Identified
**Critical Performance Bottleneck:** The enrichment service makes individual HTTP calls to the blockchain service for each NFT that needs blockchain data refresh, resulting in N+1 query pattern.

## Performance Impact
Based on performance test results (2026-01-03):
- **NFT List - Default:** Avg 870ms, P95 5351ms (CRITICAL)
- **NFT List - On Sale:** Avg 539ms, P95 2105ms (CRITICAL)
- **Concurrent Test:** Avg 501ms, 8.59 req/sec (POOR)

## Root Cause Analysis

### Current Architecture:
1. **API Endpoint:** `GET /api/nfts` calls `databaseEnrichmentService.getNFTsWithOnSaleStatus()`
2. **Database Service:** Checks which NFTs need blockchain data refresh via `blockchainEnrichmentService.getNFTsNeedingRefresh()`
3. **Enrichment Service:** For each NFT needing refresh, calls `enrichNFT()` which makes HTTP call to blockchain service
4. **Blockchain Service:** Single endpoint `/api/nfts/:tokenId/owner` returns owner for one NFT

### The N+1 Problem:
- For 20 NFTs needing refresh: 20 separate HTTP calls to `http://localhost:3003/api/nfts/${tokenId}/owner`
- Each HTTP call takes ~200-300ms
- Sequential processing in batches, but still N calls for N NFTs
- No batch endpoint available

## Code Analysis

### `packages/blockchain/src/enrichmentService.ts`:
```typescript
public async enrichNFT(nft: NFTMetadata): Promise<NFTMetadata> {
  // Makes individual HTTP call for each NFT
  const ownerData = await this.fetchCurrentOwner(nft.tokenId);
  // ...
}

public async enrichNFTs(nfts: NFTMetadata[]): Promise<NFTMetadata[]> {
  // Processes in batches but still calls enrichNFT for each NFT
  const batchPromises = batch.map(nft => this.enrichNFT(nft));
  // ...
}
```

### `packages/blockchain/src/index.ts`:
Only single NFT endpoints available:
- `GET /api/nfts/:tokenId/owner` - Single NFT owner
- No batch owner endpoint

## Performance Test Evidence

From logs during performance test:
```
🔍 Enriching NFT 1 with blockchain data...
🔍 Enriching NFT 2 with blockchain data...
...
::1 - - [03/Jan/2026:17:16:41 +0000] "GET /api/nfts/1/owner HTTP/1.1" 200 134 "-" "node"
::1 - - [03/Jan/2026:17:16:41 +0000] "GET /api/nfts/2/owner HTTP/1.1" 200 134 "-" "node"
::1 - - [03/Jan/2026:17:16:41 +0000] "GET /api/nfts/3/owner HTTP/1.1" 200 134 "-" "node"
...
```

## Impact on User Experience

1. **First-time users:** Experience 5+ second page loads when NFTs need refresh
2. **Concurrent users:** Limited to ~8 requests/second due to sequential processing
3. **Scalability:** Performance degrades linearly with number of NFTs needing refresh
4. **Resource usage:** High network overhead with many HTTP requests

## Recommendations

### Short-term Fixes (High Priority):
1. **Add batch owner endpoint** to blockchain service
   - `POST /api/nfts/owners/batch` - Get owners for multiple token IDs
   - Accepts array of token IDs, returns array of owner data
   - Reduces N HTTP calls to 1 HTTP call

2. **Optimize enrichment service** to use batch endpoint
   - Modify `enrichNFTs` to use batch endpoint when available
   - Fall back to individual calls for backward compatibility

3. **Increase cache TTL** for blockchain data
   - Current: 5 minutes for owner, 2 minutes for sale status
   - Consider: 30 minutes for owner, 10 minutes for sale status

### Medium-term Improvements:
4. **Implement request deduplication** in enrichment service
   - Cache in-flight requests to avoid duplicate calls
   - Use Promise sharing pattern

5. **Add background refresh job** for blockchain data
   - Pre-refresh data before it expires
   - Separate from user-facing API calls

6. **Implement circuit breaker** for blockchain service
   - Prevent cascading failures
   - Graceful degradation when blockchain service is slow

### Long-term Architecture:
7. **Event-driven updates** for blockchain data
   - Listen to blockchain events for ownership changes
   - Update database in real-time

8. **WebSocket connections** for real-time updates
   - Push updates to clients when NFT ownership changes
   - Reduce polling overhead

## Expected Performance Improvements

### With Batch Endpoint:
- **Before:** 20 NFTs = 20 HTTP calls = ~4000-6000ms
- **After:** 20 NFTs = 1 HTTP call = ~200-300ms
- **Improvement:** 20x faster for batch operations

### With Increased Cache TTL:
- **Before:** Refresh every 5 minutes = frequent slow requests
- **After:** Refresh every 30 minutes = fewer slow requests
- **Improvement:** 6x reduction in refresh frequency

## Implementation Priority

1. **CRITICAL:** Add batch owner endpoint to blockchain service
2. **HIGH:** Update enrichment service to use batch endpoint
3. **MEDIUM:** Increase cache TTL values
4. **LOW:** Add request deduplication

## Test Plan for Fix

1. **Create batch endpoint test:** Verify batch endpoint returns correct owners
2. **Performance comparison:** Measure before/after response times
3. **Concurrency test:** Verify batch endpoint handles concurrent requests
4. **Error handling:** Test partial failures in batch requests
5. **Backward compatibility:** Ensure single endpoint still works

## Risk Assessment

- **Low risk:** Adding batch endpoint is additive, doesn't break existing functionality
- **Medium risk:** Changing enrichment service logic could introduce bugs
- **High risk:** Increasing cache TTL could cause stale data issues

## Conclusion

The N+1 blockchain call pattern is the primary performance bottleneck in the application. Implementing a batch owner endpoint would provide immediate 20x performance improvement for NFT listing operations. This should be the highest priority performance fix.
