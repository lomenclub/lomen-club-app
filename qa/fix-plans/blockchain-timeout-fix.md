# Fix Plan: Blockchain RPC Timeout Wrapper

## Issue
Blockchain RPC calls may hang indefinitely if KCC node becomes unresponsive, as contract calls are not wrapped with timeout.

## Current Implementation
- Contract calls: `nftContract!['ownerOf'](tokenId)`, `balanceOf`, `totalSupply`, etc.
- No timeout wrapper, relies on ethers provider default timeout (if any)
- Provider configured with `batchMaxCount: 1` but no explicit timeout

## Proposed Solution
Wrap all contract method calls with `withTimeout` utility (30 seconds default).

### Changes Required

1. **Create a wrapper function** in `packages/blockchain/src/timeoutUtils.ts`:
   ```typescript
   export async function withContractTimeout<T>(
     promise: Promise<T>,
     operation: string,
     tokenId?: number
   ): Promise<T> {
     return withTimeout(
       promise,
       DEFAULT_RPC_TIMEOUT_MS,
       createRpcTimeoutMessage(operation, tokenId)
     );
   }
   ```

2. **Update contract calls** in `packages/blockchain/src/index.ts`:
   ```typescript
   // Instead of:
   const ownerAddress = await nftContract!['ownerOf'](tokenId);
   
   // Use:
   const ownerAddress = await withContractTimeout(
     nftContract!['ownerOf'](tokenId),
     'ownerOf',
     tokenId
   );
   ```

3. **Apply to all contract calls**:
   - `ownerOf` (NFT owner endpoint)
   - `balanceOf` (wallet NFTs endpoint)
   - `totalSupply`, `name`, `symbol` (stats endpoint)

4. **Update syncService.ts and simpleSync.ts** similarly.

### Alternative Approach
Create a decorated contract class that automatically wraps all method calls with timeout.

## Risk Assessment
- **Low risk:** Timeout wrapper already used in enrichment service, proven to work.
- **Potential issues:** May cause premature timeouts for legitimate slow responses (unlikely with 30s timeout).
- **Testing needed:** Verify timeout works without breaking existing functionality.

## Testing Strategy
1. Unit test for `withContractTimeout` function
2. Integration test simulating slow RPC response (using mock)
3. Manual test with actual KCC node

## Implementation Steps
1. Add wrapper function to timeoutUtils.ts
2. Update index.ts contract calls
3. Update syncService.ts and simpleSync.ts
4. Add unit tests
5. Run lint and type check
6. Test manually

## Estimated Effort
- 2-3 hours for implementation and testing
- Low complexity

## Dependencies
- None

## Success Criteria
- All contract calls have 30-second timeout
- Timeout errors return appropriate HTTP status (504 Gateway Timeout)
- Existing functionality unchanged
- No performance degradation

## Rollback Plan
- Revert changes if issues arise
- Timeout wrapper can be removed without affecting core logic

## Next Steps After Fix
1. Implement circuit breaker pattern
2. Add periodic provider health checks
3. Add retry logic for transient failures

## Approval Needed
- [ ] Architecture review
- [ ] Implementation approval
- [ ] Testing approval

## Timeline
- Start: ASAP
- Completion: Within current sprint
