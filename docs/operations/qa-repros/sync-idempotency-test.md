# Sync/Enrichment Job Correctness Analysis

## Purpose
Document idempotency and correctness findings for sync/enrichment services.

## Audience
Backend and blockchain service developers, QA engineers.

## Prerequisites
- Access to sync service code and environment logs.

## Last Verified
2026-01-03 (legacy QA run).

## Test Date
2026-01-03

## Test Environment
- Local KCC node running
- MongoDB running
- Blockchain service port 3003
- Backend service port 3002

## Code Review Findings

### 1. Sync Service (packages/blockchain/src/syncService.ts)

#### Idempotency
- **Transfer event processing:** Uses `updateOne` with `upsert: true` and unique index on `(tx_hash, log_index)`. This is idempotent - processing same event multiple times results in same database state.
- **Token discovery:** `tokens_discovered` counter may be incremented multiple times in race conditions (if two sync instances run concurrently). This is a statistical issue, not data integrity.
- **Token updates:** Uses `updateOne` with `upsert: true` and unique index on `(contract_address, token_id)`. Idempotent.

#### Race Conditions
- **Concurrent sync instances:** No locking mechanism prevents multiple sync services from running simultaneously. Could cause duplicate `tokens_discovered` increments and redundant RPC calls.
- **Batch processing:** Within a single sync, batches are processed sequentially, no race conditions.

#### Error Recovery
- **Retry logic:** Implements exponential backoff with configurable max retries (default 3).
- **Reorg handling:** Has comprehensive reorg detection and rollback logic.
- **State persistence:** Sync state saved to database, allowing resume after failure.

#### Data Consistency
- **Verification:** Includes sample verification with configurable sample size (default 200).
- **Accuracy threshold:** Requires 99% accuracy for verification to pass.

### 2. Simple Sync (packages/blockchain/src/simpleSync.ts)

#### Idempotency
- **Bulk write:** Uses `bulkWrite` with `updateOne` and `upsert: true`. Idempotent due to unique index.
- **No state tracking:** Does not track which tokens have been processed. If interrupted, will restart from beginning but will not reprocess already synced tokens (due to upsert).

#### Error Handling
- **Individual token errors:** Catches errors per token and continues.
- **No retry logic:** Failed tokens are skipped, not retried.

#### Performance
- **Batch size:** 100 tokens per batch.
- **Rate limiting:** 100ms delay every 10 tokens.

### 3. Enrichment Service (packages/blockchain/src/enrichmentService.ts)

#### Idempotency
- **Owner fetching:** Calls blockchain service which caches results (5-minute TTL). Multiple calls within TTL return cached data.
- **NFT enrichment:** Returns new `blockchainData` object each time. Idempotent in terms of data but may cause unnecessary updates.

#### Error Handling
- **Individual NFT failures:** Uses `Promise.allSettled` to handle failures gracefully.
- **Fallback data:** Returns NFT with existing data or minimal fallback if enrichment fails.

#### Performance
- **Batch processing:** Configurable batch size (default from shared config).
- **No delays between batches:** Processes as fast as possible.

### 4. NFT Sync Service (apps/backend/src/services/nftSyncService.ts)

#### Idempotency Issues
- **Force refresh:** Deletes all user NFTs before reprocessing (`deleteMany`). This is NOT idempotent - if interrupted after delete but before insert, data loss occurs.
- **Concurrent execution:** No locking mechanism. Two concurrent force refreshes for same wallet could cause race conditions.

#### Error Handling
- **Timeout:** Uses `fetchJsonWithTimeout` for blockchain service calls.
- **Batch processing:** Processes NFTs in batches with `Promise.allSettled`.

#### Data Consistency
- **Discrepancy detection:** Compares blockchain total with database count, triggers force refresh if mismatch.
- **User NFTs collection:** Maintains separate collection for user-owned NFTs.

## Potential Issues

### Critical
1. **Force refresh data loss:** `deleteMany` before insert creates window for data loss if process interrupted.
2. **No distributed locking:** Multiple instances could run sync simultaneously, causing race conditions.

### High
3. **Missing timeout on contract calls:** Sync service contract calls (ownerOf, tokenURI) have no timeout wrapper.
4. **No circuit breaker:** Repeated RPC failures could cause cascading failures.

### Medium
5. **Statistical counters not atomic:** `tokens_discovered` increment not atomic, could be inaccurate.
6. **Batch size not adaptive:** Fixed batch sizes may not optimize for network conditions.

### Low
7. **Redundant updates:** Enrichment service may update NFTs even when data hasn't changed.
8. **No progress persistence in simple sync:** If interrupted, starts from beginning (though upsert prevents duplicates).

## Recommendations

### Immediate Fixes (High Priority)
1. **Fix force refresh data loss:** Use atomic operations or two-phase approach (mark, process, delete unmarked).
2. **Add distributed locking:** Use MongoDB locks or Redis to prevent concurrent sync execution.
3. **Add timeout wrapper to contract calls:** Use existing `withTimeout` utility.

### Medium Term Improvements
4. **Implement circuit breaker pattern:** For RPC calls to prevent cascading failures.
5. **Make counters atomic:** Use MongoDB atomic operations for statistical counters.
6. **Add adaptive batching:** Adjust batch size based on success rate and latency.

### Long Term Enhancements
7. **Add idempotency keys:** Use unique idempotency keys for sync operations.
8. **Implement checkpointing:** Save progress more frequently for faster recovery.
9. **Add comprehensive monitoring:** Track sync metrics, success rates, error patterns.

## Test Cases Needed

1. **Idempotency test:** Run sync twice, verify database state identical.
2. **Concurrent execution test:** Run two sync instances simultaneously, verify no data corruption.
3. **Failure recovery test:** Kill sync mid-process, restart, verify resume correctly.
4. **Reorg simulation test:** Simulate blockchain reorg, verify rollback works.
5. **Network failure test:** Simulate RPC failures, verify retry and circuit breaker logic.

## Next Steps
- Create failing test for force refresh data loss
- Implement fix for atomic force refresh
- Add distributed locking mechanism
- Add timeout wrapper to sync service contract calls
