# Wallet Service Implementation for NFT Explorer

## Purpose
Preserve a legacy implementation summary for the wallet service.

## Audience
Backend developers reviewing historical implementation notes.

## Prerequisites
None.

## Status
Archived. See `docs/api/api-overview.md` for current endpoints.

## Last Verified
Unknown / legacy implementation notes.

## Overview

This implementation addresses the issue with the "On Sale" filter in the NFT Explorer by creating a dedicated wallet service that can retrieve token IDs for specific wallets. This service will be used for both the "On Sale" filter and future profile features.

## Changes Made

### 1. New Wallet Service (`apps/backend/src/services/walletService.ts`)

- **`getNFTsByWallet(walletAddress)`**: Retrieves all NFTs owned by a specific wallet with full details
- **`getTokenIdsByWallet(walletAddress)`**: Retrieves only token IDs owned by a specific wallet (optimized for filtering)
- **`checkWalletOwnership(walletAddress, tokenIds)`**: Checks if a wallet owns specific NFTs

### 2. New Wallet Routes (`apps/backend/src/routes/wallets.ts`)

- **`GET /api/wallets/:address/nfts`**: Get all NFTs owned by a wallet
- **`GET /api/wallets/:address/token-ids`**: Get token IDs owned by a wallet
- **`POST /api/wallets/:address/ownership`**: Check ownership of specific NFTs

### 3. Updated "On Sale" Logic (`packages/database/src/enrichmentService.ts`)

- Changed from using `blockchainData.isOnSale` to directly querying by owner address
- Uses the KuSwap wallet address (`0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C`) to filter NFTs
- More reliable and consistent filtering

### 4. Backend Integration (`apps/backend/src/index.ts`)

- Registered wallet routes
- Updated startup message with new endpoints

## How It Works

### For "On Sale" Filter

1. When "On Sale" is selected in the NFT Explorer, the frontend sends `onSale=true` parameter
2. Backend queries MongoDB for NFTs where `blockchainData.owner` matches the KuSwap wallet address
3. Results are returned showing only NFTs currently listed on KuSwap marketplace

### For Profile Features

1. User connects wallet in profile
2. Backend calls `GET /api/wallets/:address/nfts` to get all owned NFTs
3. User can select any owned NFT as their profile picture

## API Endpoints

### Get NFTs by Wallet
```bash
GET /api/wallets/0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C/nfts
```

Response:
```json
{
  "wallet": "0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C",
  "totalNFTs": 42,
  "nfts": [
    {
      "tokenId": 1,
      "name": "Lomen Genesis #001",
      "image": "/images/nfts/1.webp",
      "rarity": {
        "rank": 1,
        "score": 99.5
      },
      "blockchainData": {
        "owner": "0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C",
        "ownerShort": "0xD6B6...B16C",
        "isOwned": true,
        "isOnSale": true,
        "lastOwnerCheck": "2024-01-15T10:30:00.000Z",
        "lastSaleCheck": "2024-01-15T10:30:00.000Z",
        "network": "KCC Mainnet",
        "note": "Listed on KuSwap marketplace"
      }
    }
  ]
}
```

### Get Token IDs by Wallet
```bash
GET /api/wallets/0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C/token-ids
```

Response:
```json
{
  "wallet": "0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C",
  "tokenIds": [1, 42, 789, 1200],
  "total": 4
}
```

### Check NFT Ownership
```bash
POST /api/wallets/0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C/ownership
Content-Type: application/json

{
  "tokenIds": [1, 2, 3, 4, 5]
}
```

Response:
```json
{
  "wallet": "0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C",
  "ownership": {
    "1": true,
    "2": false,
    "3": true,
    "4": false,
    "5": true
  }
}
```

## Benefits

1. **Reliable "On Sale" Filtering**: Direct owner-based filtering is more reliable than the previous `isOnSale` flag
2. **Reusable Service**: The same service can be used for profile features and other wallet-related functionality
3. **Optimized Queries**: Separate endpoints for full NFT data vs just token IDs
4. **Better Performance**: Reduced data transfer when only token IDs are needed

## Testing

Run the test script to verify functionality:
```bash
node test-wallet-service.js
```

## Future Enhancements

1. **Caching**: Implement caching for frequently accessed wallet data
2. **Batch Operations**: Add batch operations for multiple wallets
3. **Real-time Updates**: WebSocket support for real-time ownership updates
4. **Analytics**: Track wallet activity and NFT movements
