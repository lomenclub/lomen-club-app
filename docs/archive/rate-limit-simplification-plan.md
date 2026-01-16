# Rate-Limit Simplification & Cleanup Plan

## Purpose
Preserve a legacy plan for rate-limit simplification.

## Audience
Maintainers reviewing historical optimization plans.

## Prerequisites
None.

## Status
Archived. Validate whether any proposals were implemented.

## Last Verified
Unknown / legacy plan.

## Executive Summary

**Problem:** The codebase has accumulated multiple layers of defensive rate-limiting code that:
1. Creates unnecessary complexity
2. Reduces performance with artificial delays
3. Makes code harder to maintain and reason about
4. Provides false sense of security against RPC rate limits

**Solution:** Simplify aggressively by removing unnecessary protections, accepting that we may hit RPC limits temporarily until we deploy our own node.

## Current Rate-Limit Layers (To Remove)

### Layer 1: Express Rate Limiting Middleware
- **File**: `apps/backend/src/index.ts`, `packages/blockchain/src/index.ts`
- **Current**: `express-rate-limit` with 100 requests/minute
- **Action**: Keep for API protection, but reduce to 1000 requests/minute

### Layer 2: Batch Processing Delays
- **Files**: 
  - `packages/blockchain/src/enrichmentService.ts` (50ms delays)
  - `packages/database/src/enrichmentService.ts` (2000ms delays)
  - `apps/backend/src/services/nftSyncService.ts` (100ms delays)
- **Problem**: Artificial waits that slow down operations
- **Action**: **REMOVE ALL** - No delays between batches

### Layer 3: Conservative Batch Sizes
- **Files**: Multiple services
- **Current**: 10-50 items per batch
- **Problem**: Too small for local node, creates overhead
- **Action**: Increase to 100-500 items per batch

### Layer 4: Redis Cache Complexity
- **Files**: `packages/blockchain/src/cacheService.ts`
- **Problem**: Adds operational overhead without clear value
- **Action**: **REMOVE** - Use simple in-memory caching or no cache

## Simplified Target Architecture

### Keep Only Essential Protections

1. **Basic Timeouts**: 30-second timeout for RPC calls
2. **Single Retry**: One retry for transient failures  
3. **User-Visible Errors**: Clear error messages when RPC fails
4. **Graceful Degradation**: Return cached data when RPC unavailable

### Remove Completely

1. ❌ Artificial delays between operations
2. ❌ Multi-layer caching (Redis + memory + database)
3. ❌ Complex retry logic with exponential backoff
4. ❌ Dynamic batch sizing algorithms
5. ❌ Rate-limit detection and auto-throttling

## Implementation Steps

### Step 1: Remove Batch Delays (Day 1)

**File**: `packages/blockchain/src/enrichmentService.ts`
```typescript
// BEFORE:
if (i + batchSize < nfts.length && batchSize > 0) {
  await new Promise(resolve => setTimeout(resolve, 50));
}

// AFTER:
// No delays - process batches as fast as possible
```

**File**: `packages/database/src/enrichmentService.ts`
```typescript
// BEFORE:
if (i + batchSize < nftsNeedingRefresh.length) {
  console.log('⏳ Waiting 2 seconds before next batch...');
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// AFTER:
// No delays - update database immediately
```

### Step 2: Increase Batch Sizes (Day 1)

**File**: `packages/blockchain/src/enrichmentService.ts`
```typescript
// BEFORE:
const batchSize = 50;

// AFTER:
const batchSize = parseInt(process.env.BATCH_SIZE || '100');
```

**File**: `packages/database/src/enrichmentService.ts`
```typescript
// BEFORE:
const batchSize = 10;

// AFTER:  
const batchSize = parseInt(process.env.BATCH_SIZE || '100');
```

### Step 3: Simplify/Remove Redis (Day 2)

**Option A (Recommended)**: Remove Redis entirely
- Delete `packages/blockchain/src/cacheService.ts`
- Remove Redis dependencies from package.json
- Update blockchain service to use simple in-memory cache

**Option B**: Keep but simplify
- Remove complex reconnection logic
- Use default Redis configuration
- Reduce cache TTL to 60 seconds

### Step 4: Add Basic Timeouts (Day 2)

**New Utility Function**:
```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

// Usage:
const owner = await withTimeout(
  blockchainProvider.getOwner(tokenId),
  30000, // 30 seconds
  `RPC timeout fetching owner for NFT ${tokenId}`
);
```

### Step 5: Update Error Handling (Day 3)

**Standardize on AppError pattern**:
```typescript
// BEFORE (inconsistent):
throw new Error('Something went wrong');
console.error('Error:', error);
res.status(500).json({ error: 'Internal error' });

// AFTER (consistent):
throw new AppError('Failed to fetch NFT owner', 500, 'RPC_TIMEOUT');
// Automatically logged and converted to proper HTTP response
```

## Safety Justification

### Why This is Safe

1. **Explicit Acceptance**: You've accepted hitting RPC rate limits in the short term
2. **Temporary State**: Public RPC usage is temporary until your own node is deployed
3. **Simpler Failure Modes**: Fewer layers = easier to debug when things go wrong
4. **Better User Experience**: Fast failures with clear errors are better than slow degradation

### Fallback Strategy

When RPC calls fail:
1. **Return cached database data** (if available)
2. **Show user-friendly error message** with suggested retry time
3. **Log error for monitoring** with context (tokenId, wallet, etc.)
4. **Continue other operations** that don't depend on blockchain data

### Monitoring Plan

1. **Track RPC failure rate** - alert if > 10% for 5 minutes
2. **Monitor response times** - alert if > 10 seconds p95
3. **Log rate limit errors** separately for analysis
4. **Dashboard for RPC health** - simple status page

## Expected Outcomes

### Performance Improvements
- **Batch processing**: 10x faster (removing 2-second delays)
- **Memory usage**: Reduced (simpler caching)
- **Code complexity**: 50% reduction in defensive code

### Operational Simplification
- **Fewer services**: No Redis to manage
- **Easier debugging**: Clearer error paths
- **Simpler deployment**: Fewer dependencies

### Risk Profile
- **Short-term**: May hit RPC rate limits more often
- **Long-term**: Better prepared for own node deployment
- **Mitigation**: Clear error messages, graceful degradation

## Rollback Plan

If simplification causes issues:
1. **Hotfix**: Re-add 100ms delays between batches
2. **Fallback**: Re-enable Redis with simple configuration
3. **Monitoring**: Add more detailed RPC failure logging

## Next Steps After Simplification

1. **Deploy own KCC node** (primary goal)
2. **Remove remaining rate-limiting code** (express middleware)
3. **Implement circuit breaker pattern** for resilience
4. **Add fallback RPC providers** for redundancy

## Conclusion

This simplification plan aligns with your directive to "remove or simplify most rate-limit protection now" and accept hitting RPC limits temporarily. The result will be cleaner, faster, more maintainable code that's better prepared for your own node deployment.

**Start with Step 1 today** - removing batch delays will provide immediate performance benefits with minimal risk.
