# QA Issues Log

## Purpose
Preserve a legacy QA issues log for historical context.

## Audience
QA engineers and maintainers reviewing past issues.

## Prerequisites
Access to legacy issue context and test environments.

## Status
Archived. See `docs/operations/troubleshooting.md` for current known issues.

## Last Verified
Unknown / legacy log.

## [MEDIUM] Linting Errors in Backend Code

* **Area:** API / Code Quality
* **Component:** Backend
* **Environment:** dev
* **Repro Steps:**
  1. Run `npm run lint` from root
  2. Observe multiple ESLint errors
* **Expected:** Clean linting with no errors
* **Actual:** Multiple errors including:
  - `process` not defined (no-undef)
  - Unused variables (`__dirname`, `_next`)
  - Explicit `any` type warnings
* **Evidence:** 
  ```
  /Users/taimour/Developer/lomen-club-app/apps/backend/src/index.ts
    13:7   error    '__dirname' is assigned a value but never used  @typescript-eslint/no-unused-vars
    16:27  error    'process' is not defined                        no-undef
    21:15  error    'process' is not defined                        no-undef
    21:30  warning  Unexpected any. Specify a different type        @typescript-eslint/no-explicit-any
  ```
* **Suspected Root Cause:** Missing ESLint configuration for Node.js globals and TypeScript strictness
* **Minimal Repro:** `cd apps/backend && npm run lint`
* **Fix Status:** Partially Fixed (main errors fixed, remaining warnings about `any` types)
* **Regression Test:** N/A
* **Fix Details:** 
  - Added `/* global process */` comments to files using process
  - Fixed unused variables (`__filename`, `__dirname`, `_next`)
  - Updated error handling to use proper types (`Error`, `unknown`)
  - Fixed `any` type casts in index.ts and nfts.ts

## [LOW] Jest Test Suite Fails from Root

* **Area:** Testing
* **Component:** Shared package
* **Environment:** dev
* **Repro Steps:**
  1. Run `npm test` from root
  2. Observe syntax error in config.test.ts
* **Expected:** Tests pass
* **Actual:** SyntaxError: Unexpected token, expected "," (71:13) at `null as any`
* **Evidence:** 
  ```
  FAIL packages/shared/__tests__/config.test.ts
    ● Test suite failed to run
      SyntaxError: /Users/taimour/Developer/lomen-club-app/packages/shared/__tests__/config.test.ts: Unexpected token, expected "," (71:13)
  ```
* **Suspected Root Cause:** Root Jest configuration not properly handling ESM/TypeScript
* **Minimal Repro:** `npm test`
* **Fix Status:** Open
* **Regression Test:** N/A

## [MEDIUM] Authentication Service Missing Rate Limiting on Challenge Generation

* **Area:** Authentication / Security
* **Component:** Backend
* **Environment:** dev/prod
* **Repro Steps:**
  1. Send multiple POST requests to `/api/auth/challenge` with different wallet addresses
  2. Observe that challenges are generated without per-IP or per-wallet rate limiting beyond global rate limiter (100 requests per 15 minutes)
* **Expected:** Additional rate limiting to prevent memory exhaustion attacks
* **Actual:** Challenges stored in memory Map without limits on number of concurrent challenges
* **Evidence:** AuthService stores challenges in `this.challenges` Map with no size limit
* **Suspected Root Cause:** No per-endpoint rate limiting or challenge count limiting
* **Minimal Repro:** Script to generate 1000 challenges
* **Fix Status:** Open
* **Regression Test:** Should add test for rate limiting

## [LOW] Expired Sessions Not Automatically Cleaned Up

* **Area:** Authentication / Performance
* **Component:** Backend
* **Environment:** dev/prod
* **Repro Steps:**
  1. Create multiple sessions
  2. Wait for them to expire (24 hours)
  3. Observe memory usage
* **Expected:** Expired sessions automatically removed
* **Actual:** Sessions only cleaned up when `verifySession` is called
* **Evidence:** `cleanupExpiredSessions` method exists but not called periodically
* **Suspected Root Cause:** No scheduled cleanup job
* **Minimal Repro:** Create sessions, wait, check Map size
* **Fix Status:** Open
* **Regression Test:** Should add test for cleanup

## [INFO] Sessions Stored in Memory (Non-Persistent)

* **Area:** Authentication / Reliability
* **Component:** Backend
* **Environment:** dev
* **Repro Steps:**
  1. Authenticate to get session
  2. Restart backend server
  3. Try to verify session
* **Expected:** Session persists across restarts (in production)
* **Actual:** Session lost after restart
* **Evidence:** AuthService uses in-memory Maps
* **Suspected Root Cause:** Designed for development only
* **Minimal Repro:** Restart server after authentication
* **Fix Status:** Expected behavior for current stage
* **Regression Test:** N/A

## [MEDIUM] Missing Authentication Attempt Logging

* **Area:** Authentication / Security
* **Component:** Backend
* **Environment:** dev/prod
* **Repro Steps:**
  1. Attempt authentication (success or failure)
  2. Check logs
* **Expected:** Security-relevant events logged (challenge generation, authentication attempts, failures)
* **Actual:** Only error logs for exceptions
* **Evidence:** No structured logging of auth events
* **Suspected Root Cause:** Missing audit logging implementation
* **Minimal Repro:** Attempt authentication and check console output
* **Fix Status:** Open
* **Regression Test:** Should add logging tests

## [MEDIUM] Blockchain RPC Calls Missing Timeout Wrapper - FIXED

* **Area:** Blockchain / Reliability
* **Component:** Blockchain service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Make RPC call to KCC node
  2. Simulate node hanging (no response)
  3. Observe request hangs indefinitely
* **Expected:** Request times out after 30 seconds with appropriate error
* **Actual:** Request may hang indefinitely if node is unresponsive
* **Evidence:** Contract calls in index.ts do not use timeout wrapper
* **Suspected Root Cause:** Missing `withTimeout` wrapper for contract method calls
* **Minimal Repro:** Script `qa/repros/blockchain-timeout-test.js`
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/circuit-breaker-test.js`
* **Fix Details:**
  - All contract calls wrapped with `executeWithResilience` utility
  - Combines circuit breaker, timeout, and retry patterns
  - Default timeout: 10 seconds for individual calls, 15 seconds for batch
  - Fallback returns zero address for failed NFT owner checks
  - Circuit breaker opens after 5 failures in 60 seconds
  - Automatic recovery after 30 seconds (HALF_OPEN state)
  - Health endpoint includes circuit breaker status

## [LOW] No Circuit Breaker for RPC Failures - FIXED

* **Area:** Blockchain / Resilience
* **Component:** Blockchain service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Cause multiple RPC failures (e.g., node down)
  2. Observe continued attempts to call failing node
* **Expected:** Circuit breaker opens after threshold, stops making requests temporarily
* **Actual:** Continues to attempt RPC calls on every request
* **Evidence:** No circuit breaker pattern implemented
* **Suspected Root Cause:** Missing failure tracking and circuit breaker logic
* **Minimal Repro:** Simulate node failure and monitor logs
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/circuit-breaker-test.js`
* **Fix Details:**
  - Implemented CircuitBreaker class with CLOSED/OPEN/HALF_OPEN states
  - Configurable thresholds: 5 failures opens circuit, 3 successes closes circuit
  - Automatic reset after 30 seconds (OPEN → HALF_OPEN)
  - Integrated with all RPC calls via `executeWithResilience` utility
  - Health monitoring includes circuit breaker status
  - Graceful fallback when circuit is OPEN

## [LOW] Provider Health Monitoring Only at Startup

* **Area:** Blockchain / Monitoring
* **Component:** Blockchain service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Start blockchain service with healthy node
  2. Stop KCC node
  3. Make RPC call
* **Expected:** Service detects node failure and provides graceful degradation
* **Actual:** Service continues to attempt calls, returns 503 errors
* **Evidence:** Provider sanity check only runs at startup
* **Suspected Root Cause:** No periodic health checks
* **Minimal Repro:** Stop node after service starts, call endpoint
* **Fix Status:** Open
* **Regression Test:** Should add health monitoring tests

## [LOW] Missing Retry Logic for Transient RPC Failures - FIXED

* **Area:** Blockchain / Resilience
* **Component:** Blockchain service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Cause transient network failure (e.g., packet loss)
  2. Observe RPC call fails immediately
* **Expected:** Automatic retry with exponential backoff for transient failures
* **Actual:** No retry logic, fails immediately
* **Evidence:** No retry implementation in contract calls
* **Suspected Root Cause:** Missing retry logic
* **Minimal Repro:** Simulate transient network error
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/circuit-breaker-test.js`
* **Fix Details:**
  - Implemented retry logic with exponential backoff (1s, 2s, 4s)
  - Maximum 3 retries for transient failures
  - Smart error detection: retries only on network/timeout errors
  - Integrated with circuit breaker and timeout patterns
  - Configurable via resilience configuration

## [CRITICAL] Force Refresh Data Loss Vulnerability - FIXED

* **Area:** Sync / Data Integrity
* **Component:** Backend (NFTSyncService)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Start force refresh for a wallet
  2. Interrupt process after `deleteMany` but before inserts complete
  3. Check user_nfts collection
* **Expected:** No data loss - either old data preserved or new data inserted
* **Actual:** User NFTs deleted, not reinserted (data loss)
* **Evidence:** `forceRefreshWalletNFTs` deletes all user NFTs before processing
* **Suspected Root Cause:** Non-atomic delete-then-insert pattern
* **Minimal Repro:** Script that interrupts force refresh mid-process
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/force-refresh-atomic-test.js`
* **Fix Details:** 
  - Removed initial `deleteMany` that caused data loss window
  - Collect owned token IDs during processing
  - Delete only NFTs not owned after processing completes
  - Uses atomic `updateOne` with `upsert: true` for owned NFTs
  - Cleanup step at end removes NFTs no longer owned
  - If process interrupted, worst case is extra records (no data loss)

## [HIGH] Missing Distributed Locking for Sync Operations

* **Area:** Sync / Concurrency
* **Component:** All sync services
* **Environment:** dev/prod
* **Repro Steps:**
  1. Start two sync instances simultaneously
  2. Observe duplicate processing and race conditions
* **Expected:** Only one instance processes at a time
* **Actual:** Multiple instances run concurrently
* **Evidence:** No locking mechanism in sync services
* **Suspected Root Cause:** Missing distributed lock implementation
* **Minimal Repro:** Start two sync processes for same contract/wallet
* **Fix Status:** Open
* **Regression Test:** Should test concurrent execution

## [HIGH] Missing Timeout Wrapper for Sync Service Contract Calls

* **Area:** Sync / Reliability
* **Component:** Blockchain sync service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Make RPC call to unresponsive node
  2. Observe sync hangs indefinitely
* **Expected:** Request times out after 30 seconds
* **Actual:** Request may hang indefinitely
* **Evidence:** Sync service contract calls (ownerOf, tokenURI) lack timeout wrapper
* **Suspected Root Cause:** Missing `withTimeout` utility usage
* **Minimal Repro:** Simulate slow RPC response
* **Fix Status:** Open
* **Regression Test:** Should test timeout behavior

## [MEDIUM] Statistical Counters Not Atomic

* **Area:** Sync / Data Quality
* **Component:** Blockchain sync service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Run multiple sync instances concurrently
  2. Check `tokens_discovered` counter in sync state
* **Expected:** Accurate count of unique tokens discovered
* **Actual:** Counter may be inflated due to race conditions
* **Evidence:** `tokens_discovered++` not atomic operation
* **Suspected Root Cause:** Non-atomic increment in concurrent environment
* **Minimal Repro:** Concurrent sync execution
* **Fix Status:** Open
* **Regression Test:** Should test counter accuracy

## [MEDIUM] No Adaptive Batching

* **Area:** Sync / Performance
* **Component:** All sync services
* **Environment:** dev/prod
* **Repro Steps:**
  1. Run sync with network latency
  2. Observe fixed batch sizes regardless of conditions
* **Expected:** Batch size adapts to network conditions and success rate
* **Actual:** Fixed batch sizes (100 for simple sync, configurable for others)
* **Evidence:** Hardcoded or configurable but static batch sizes
* **Suspected Root Cause:** Missing adaptive batching logic
* **Minimal Repro:** Monitor batch processing with varying latency
* **Fix Status:** Open
* **Regression Test:** Should test performance with different batch sizes

## [MEDIUM] Missing Security Headers in API Responses

* **Area:** API / Security
* **Component:** Backend
* **Environment:** dev/prod
* **Repro Steps:**
  1. Make any API request
  2. Check response headers
* **Expected:** Security headers present (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, X-XSS-Protection)
* **Actual:** Missing security headers
* **Evidence:** Response headers lack security headers
* **Suspected Root Cause:** No security middleware configured
* **Minimal Repro:** `curl -I http://localhost:3002/api/health`
* **Fix Status:** Open
* **Regression Test:** Should test headers are present

## [MEDIUM] Missing Request Size Limits

* **Area:** API / Security
* **Component:** Backend
* **Environment:** dev/prod
* **Repro Steps:**
  1. Send large request body (>1MB)
  2. Observe server processes it
* **Expected:** Request size limited to prevent DoS
* **Actual:** No request size limits
* **Evidence:** No body parser limits configured
* **Suspected Root Cause:** Missing express.json limit configuration
* **Minimal Repro:** Send large JSON payload
* **Fix Status:** Open
* **Regression Test:** Should test request size rejection

## [LOW] No Input Sanitization for Search Parameter

* **Area:** API / Security
* **Component:** Backend (NFT service)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Send search parameter with complex regex pattern
  2. Observe MongoDB query execution
* **Expected:** Search input sanitized to prevent regex DoS
* **Actual:** Search parameter passed directly to MongoDB $regex
* **Evidence:** `{ $regex: search, $options: 'i' }` in nftService.ts
* **Suspected Root Cause:** No input sanitization for regex patterns
* **Minimal Repro:** Send search with malicious regex pattern
* **Fix Status:** Open
* **Regression Test:** Should test regex pattern safety

## [LOW] Unused Variables in Code (ESLint Errors)

* **Area:** Code Quality
* **Component:** Backend
* **Environment:** dev
* **Repro Steps:**
  1. Run `npm run lint` in apps/backend
  2. Observe unused variable errors
* **Expected:** Clean linting with no errors
* **Actual:** Multiple unused variable errors
* **Evidence:** `fileURLToPath`, `NFTQueryParams`, `search`, `filters` marked as unused
* **Suspected Root Cause:** Unused imports and variables
* **Minimal Repro:** `cd apps/backend && npm run lint`
* **Fix Status:** Open
* **Regression Test:** N/A

## [FIXED] Inconsistent Error Status Codes for Validation Errors

* **Area:** API / Error Handling
* **Component:** Backend (NFT service)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Send invalid query parameters to `/api/nfts`
  2. Check HTTP status code
* **Expected:** 400 Bad Request for validation errors
* **Actual:** Was 500 Internal Server Error
* **Evidence:** `AppError` thrown without status code (defaulted to 500)
* **Suspected Root Cause:** Missing status code parameter in AppError constructor
* **Minimal Repro:** `curl "http://localhost:3002/api/nfts?limit=1000"`
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/api-validation-test.md`
* **Fix Details:** Added status code 400 to AppError in nftService.ts

## [HIGH] Race Conditions in Frontend useEffect Hooks

* **Area:** Frontend / State Management
* **Component:** Frontend (ProfileContext)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Load page with saved session
  2. Connect wallet
  3. Observe network requests
* **Expected:** Single profile fetch request
* **Actual:** Multiple concurrent requests due to race conditions
* **Evidence:** Multiple useEffect hooks with overlapping dependencies in ProfileContext.tsx
* **Suspected Root Cause:** Effects for session restoration and profile loading run concurrently
* **Minimal Repro:** `qa/repros/frontend-state-test.md`
* **Fix Status:** Open
* **Regression Test:** Should test concurrent effect execution

## [HIGH] Missing Cleanup in useEffect Hooks

* **Area:** Frontend / Memory Management
* **Component:** Frontend (ProfileContext)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Start authentication or profile fetch
  2. Navigate away quickly
  3. Check console for React warnings
* **Expected:** No warnings, proper cleanup
* **Actual:** "Can't perform a React state update on an unmounted component" warnings
* **Evidence:** No cleanup functions in useEffect hooks in ProfileContext.tsx
* **Suspected Root Cause:** Missing `isMounted` checks or cleanup functions
* **Minimal Repro:** Navigate during async operation
* **Fix Status:** Open
* **Regression Test:** Should test component unmount during async operations

## [MEDIUM] Missing Loading States for Async Operations

* **Area:** Frontend / User Experience
* **Component:** Frontend (ProfileContext)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Perform syncNFTs, updateProfile, or setProfilePicture operations
  2. Observe UI
* **Expected:** Loading indicators during async operations
* **Actual:** No loading states, users may click multiple times
* **Evidence:** Missing loading state variables for syncNFTs, updateProfile, setProfilePicture
* **Suspected Root Cause:** Incomplete loading state implementation
* **Minimal Repro:** Click sync button multiple times rapidly
* **Fix Status:** Open
* **Regression Test:** Should test loading state visibility

## [MEDIUM] No Error Boundaries in React Application

* **Area:** Frontend / Error Handling
* **Component:** Frontend (all components)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Cause a rendering error in any component
  2. Observe app behavior
* **Expected:** Graceful error handling with fallback UI
* **Actual:** Entire app crashes, white screen
* **Evidence:** No React error boundaries implemented
* **Suspected Root Cause:** Missing error boundary components
* **Minimal Repro:** Throw error in component render method
* **Fix Status:** Open
* **Regression Test:** Should test error boundary functionality

## [MEDIUM] Missing Debouncing for Rapid Clicks

* **Area:** Frontend / User Experience
* **Component:** Frontend (interactive elements)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Click authentication button multiple times rapidly
  2. Observe network requests
* **Expected:** Single authentication request
* **Actual:** Multiple duplicate requests
* **Evidence:** No protection against rapid sequential clicks
* **Suspected Root Cause:** Missing debouncing or request deduplication
* **Minimal Repro:** Rapid click on any async action button
* **Fix Status:** Open
* **Regression Test:** Should test rapid click behavior

## [LOW] Inconsistent Error Handling Patterns

* **Area:** Frontend / Error Handling
* **Component:** Frontend (ProfileContext)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Compare error handling in authenticate, updateProfile, syncNFTs functions
* **Expected:** Consistent error handling pattern
* **Actual:** Different patterns (set error state, throw error, swallow error)
* **Evidence:** Inconsistent try/catch patterns in ProfileContext.tsx
* **Suspected Root Cause:** No standardized error handling approach
* **Minimal Repro:** Review code in ProfileContext.tsx
* **Fix Status:** Open
* **Regression Test:** Should test error handling consistency

## [LOW] ESLint Warnings in Frontend Code

* **Area:** Frontend / Code Quality
* **Component:** Frontend (multiple files)
* **Environment:** dev
* **Repro Steps:**
  1. Run `npm run lint` in apps/frontend
  2. Observe warnings
* **Expected:** Clean linting with no warnings
* **Actual:** Multiple warnings including `any` types, undefined variables
* **Evidence:** `HeadersInit` not defined, `any` type warnings, fast refresh warnings
* **Suspected Root Cause:** Missing type definitions, loose TypeScript configuration
* **Minimal Repro:** `cd apps/frontend && npm run lint`
* **Fix Status:** Open
* **Regression Test:** N/A

## [HIGH] Missing Indexes on NFTs Collection (Performance Critical)

* **Area:** Database / Performance
* **Component:** Database (NFTs collection)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Query NFTs collection with any filter (tokenId, owner, rarity)
  2. Check query execution plan
* **Expected:** Index scans for common queries
* **Actual:** Collection scans for all queries (no indexes)
* **Evidence:** No indexes created for NFTs collection in DatabaseService
* **Suspected Root Cause:** Missing index creation in `createIndexes()` method
* **Minimal Repro:** `qa/repros/mongodb-query-test.md`
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** Should verify indexes exist after connection
* **Fix Details:** Added indexes for:
  - `{ tokenId: 1 }` (unique) - primary key lookups
  - `{ 'blockchainData.owner': 1 }` - on-sale and owner queries
  - `{ 'rarity.rank': 1 }` - sorting by rarity
  - `{ 'attributes.trait_type': 1, 'attributes.value': 1 }` - attribute filtering

## [MEDIUM] Inefficient Regex Search Queries

* **Area:** Database / Performance
* **Component:** Database (NFT service)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Search NFTs with text query
  2. Check query execution plan
* **Expected:** Text index scan or efficient pattern matching
* **Actual:** Collection scan with `$regex` and `$options: 'i'`
* **Evidence:** Search uses `{ $regex: search, $options: 'i' }` in nftService.ts
* **Suspected Root Cause:** No text index for search optimization
* **Minimal Repro:** Search for any term in NFT names or attributes
* **Fix Status:** Open
* **Regression Test:** Should test search performance with/without text index

## [MEDIUM] Pagination Performance with Large Offsets

* **Area:** Database / Performance
* **Component:** Database (enrichment service)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Request page 100+ of NFTs (deep pagination)
  2. Observe response time
* **Expected:** Consistent performance regardless of page number
* **Actual:** Performance degrades with `skip()` offset
* **Evidence:** Uses `.skip((page - 1) * limit)` in pagination
* **Suspected Root Cause:** `skip()` becomes inefficient with large offsets
* **Minimal Repro:** Query page 1000 with limit 20
* **Fix Status:** Open
* **Regression Test:** Should test deep pagination performance

## [LOW] No Compound Indexes for Common Query Patterns

* **Area:** Database / Performance
* **Component:** Database (NFTs collection)
* **Environment:** dev/prod
* **Repro Steps:**
  1. Query NFTs with multiple filters (owner + sort)
  2. Check query execution plan
* **Expected:** Compound index usage for common patterns
* **Actual:** May use multiple single-field indexes or collection scan
* **Evidence:** Missing compound indexes like `{ 'blockchainData.owner': 1, tokenId: 1 }`
* **Suspected Root Cause:** Index strategy not optimized for common query patterns
* **Minimal Repro:** Query on-sale NFTs sorted by tokenId
* **Fix Status:** Partially Fixed (basic indexes added)
* **Regression Test:** Should analyze query patterns for compound index needs

## [CRITICAL] N+1 Blockchain Calls in Enrichment Service (Performance Bottleneck) - FIXED

* **Area:** Performance / Blockchain
* **Component:** Blockchain enrichment service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Request NFT list when blockchain data needs refresh
  2. Observe network requests to blockchain service
* **Expected:** Batch requests for multiple NFTs
* **Actual:** Individual HTTP call for each NFT (N+1 pattern)
* **Evidence:** Performance test shows 20 NFTs = 20 HTTP calls, P95 response time 5351ms
* **Suspected Root Cause:** No batch owner endpoint in blockchain service
* **Minimal Repro:** `qa/repros/performance-nplus1-analysis.md`
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/batch-endpoint-test.js`
* **Fix Details:**
  - Added batch endpoint `POST /api/nfts/owners/batch` to blockchain service
  - Endpoint accepts array of token IDs, returns array of owners
  - Implements caching with 5-minute TTL
  - Handles errors gracefully (failed token IDs reported separately)
  - Performance: 7.75x faster than individual calls (625 NFTs/second vs 80 requests/second)
  - Enrichment service updated to use batch endpoint

## [HIGH] Slow API Response Times for NFT Listings - FIXED

* **Area:** Performance / API
* **Component:** Backend API
* **Environment:** dev/prod
* **Repro Steps:**
  1. Run performance test on `/api/nfts` endpoint
  2. Measure response times
* **Expected:** < 200ms average, < 500ms P95
* **Actual:** 870ms average, 5351ms P95 (CRITICAL)
* **Evidence:** Performance baseline test results
* **Suspected Root Cause:** N+1 blockchain calls, inefficient enrichment
* **Minimal Repro:** `qa/repros/performance-baseline-test.js`
* **Fix Status:** Fixed (2026-01-03)
* **Regression Test:** `qa/repros/enrichment-batch-test.js`
* **Fix Details:**
  - Batch endpoint reduces blockchain calls from N to 1
  - Performance improvement: 3.8x faster for blockchain calls (19ms vs 5ms for 5 NFTs)
  - Enrichment service updated to use batch endpoint (already implemented)
  - Cache TTL standardized to 5 minutes (300 seconds)
  - All NFTs enriched with fresh blockchain data

## [MEDIUM] Inefficient Concurrent Request Handling

* **Area:** Performance / Scalability
* **Component:** Backend API
* **Environment:** dev/prod
* **Repro Steps:**
  1. Send 5 concurrent requests to NFT endpoint
  2. Measure requests per second
* **Expected:** > 50 requests/second
* **Actual:** 8.59 requests/second (POOR)
* **Evidence:** Concurrent test shows low throughput
* **Suspected Root Cause:** Blocking operations, no connection pooling
* **Minimal Repro:** Concurrent load test in performance script
* **Fix Status:** Open
* **Regression Test:** Should test concurrent performance

## [MEDIUM] High Memory Usage During Blockchain Enrichment

* **Area:** Performance / Memory
* **Component:** Blockchain enrichment service
* **Environment:** dev/prod
* **Repro Steps:**
  1. Enrich large batch of NFTs (100+)
  2. Monitor memory usage
* **Expected:** Stable memory usage with batching
* **Actual:** High memory usage due to parallel promises
* **Evidence:** Large batch processing without memory limits
* **Suspected Root Cause:** No memory-aware batching
* **Minimal Repro:** Enrich 1000 NFTs in single batch
* **Fix Status:** Open
* **Regression Test:** Should test memory usage under load
