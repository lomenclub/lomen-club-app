# Fixing "On Sale" Filter Issue

## Purpose
Preserve a legacy troubleshooting note for the "On Sale" filter issue.

## Audience
Maintainers reviewing historical troubleshooting notes.

## Prerequisites
None.

## Status
Archived. Refer to current troubleshooting and API docs for active behavior.

## Last Verified
Unknown / legacy solution document.

## Problem Analysis

The "On Sale" filter is only returning 3 NFTs because:

1. **Limited NFTs owned by KuSwap**: Only 3 NFTs in the database are currently owned by the KuSwap wallet address (`0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C`)
2. **Outdated blockchain data**: Many NFTs may not have updated blockchain data showing current ownership
3. **Real marketplace state**: This might actually be correct - only 3 NFTs are currently listed for sale on KuSwap

## Root Causes

### 1. Blockchain Data Not Updated
- NFTs need to have their blockchain data refreshed to get current ownership information
- The `blockchainData.owner` field needs to be populated with the current owner

### 2. Limited Listings on KuSwap
- It's possible that only 3 NFTs are actually listed for sale on KuSwap marketplace
- This would be a normal marketplace state, not a bug

## Solutions

### Option 1: Refresh Blockchain Data (Recommended)
Run the blockchain data refresh to update all NFT ownership information:

```bash
# Make sure backend is running first
cd apps/backend && npm run dev

# Then run the diagnosis script
node diagnose-on-sale-issue.js

# If needed, run the refresh script
node refresh-blockchain-data.js
```

### Option 2: Use Mock Data for Testing
If you want to test with more "On Sale" NFTs for development purposes, we can temporarily modify the logic to include more NFTs:

```javascript
// Temporary modification to enrichmentService.ts
if (onSale) {
  // For testing: Include more NFTs as "on sale"
  const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
  const TEST_WALLETS = [
    KUSWAP_LISTING_WALLET,
    '0x742d35Cc6634C0532925a3b8D4B5e3a3A3b3b3b3', // Mock wallet 1
    '0x842d35Cc6634C0532925a3b8D4B5e3a3A3b3b3b3'  // Mock wallet 2
  ];
  
  mongoQuery['blockchainData.owner'] = { 
    $in: TEST_WALLETS.map(wallet => new RegExp(wallet, 'i'))
  };
}
```

### Option 3: Fallback to isOnSale Flag
If blockchain data is not available, fall back to the original `isOnSale` flag:

```javascript
if (onSale) {
  const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
  
  // Try owner-based filtering first, fall back to isOnSale flag
  mongoQuery['$or'] = [
    { 'blockchainData.owner': { $regex: new RegExp(KUSWAP_LISTING_WALLET, 'i') } },
    { 'blockchainData.isOnSale': true }
  ];
}
```

## Immediate Steps to Fix

1. **Run the diagnosis script** to understand the current state:
   ```bash
   node diagnose-on-sale-issue.js
   ```

2. **If blockchain data is outdated**, run the refresh:
   ```bash
   node refresh-blockchain-data.js
   ```

3. **Test the "On Sale" filter** again in the NFT Explorer

4. **Check the backend logs** when filtering to see the debug output

## Expected Behavior After Fix

- **If blockchain data is refreshed**: The "On Sale" filter should show all NFTs currently owned by the KuSwap wallet
- **If few NFTs are listed**: It's normal to see only a few NFTs - this reflects the actual marketplace state
- **Pagination should work**: If there are more than 20 NFTs on sale, pagination should work correctly

## Long-term Solution

1. **Automated blockchain data updates**: Set up a cron job to regularly refresh blockchain data
2. **Multiple marketplace support**: Extend the service to support NFTs listed on multiple marketplaces
3. **Real-time updates**: Implement WebSocket connections for real-time ownership updates

## Verification

After implementing the fix:

1. Start the backend server
2. Navigate to the NFT Explorer page
3. Select "On Sale" filter
4. Verify that:
   - All NFTs owned by KuSwap are shown
   - Pagination works if there are more than 20 NFTs
   - The count matches the actual number of listed NFTs

## Debugging

If the issue persists, check:

1. **Backend logs** for the MongoDB query and results
2. **Database state** using the diagnosis script
3. **Network requests** in the browser developer tools
4. **Blockchain API** connectivity and rate limits

The implementation is now using the correct owner-based filtering approach. The issue is likely that the blockchain data needs to be refreshed to reflect current ownership.
