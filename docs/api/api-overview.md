# API Overview

## Purpose
Summarize API surfaces for the backend and blockchain services.

## Audience
Frontend developers, integrators, QA engineers.

## Prerequisites
Backend and blockchain services running, or access to deployed endpoints.

## Backend API (Express)
Base URL (local default): `http://localhost:3002`

### NFT Endpoints
- `GET /api/nfts` — list NFTs with filtering, pagination, and search.
- `GET /api/nfts/:tokenId` — fetch NFT by token ID.
- `GET /api/nfts/traits/available` — list available traits.
- `GET /api/nfts/stats` — stats including on-sale counts.
- `GET /api/nfts/on-sale` — convenience endpoint for NFTs on sale.

### Wallet Endpoints
- `GET /api/wallets/:walletAddress/nfts`
- `GET /api/wallets/:walletAddress/token-ids`
- `POST /api/wallets/:walletAddress/ownership`
- `GET /api/wallets/stats/holders`

### Auth Endpoints
- `POST /api/auth/challenge`
- `POST /api/auth/authenticate`
- `POST /api/auth/logout`
- `GET /api/auth/verify`

### Profile Endpoints
- `GET /api/profile/:walletAddress`
- `PUT /api/profile/:walletAddress`
- `POST /api/profile/:walletAddress/sync-nfts`
- `POST /api/profile/:walletAddress/profile-picture`
- `GET /api/profile/:walletAddress/nfts`
- `GET /api/profile/:walletAddress/membership`

### Admin Endpoints
- `GET /api/admin/...` (see `apps/backend/src/routes/admin.ts` for exact routes).

## Blockchain Service API
Base URL (local default): `http://localhost:3003`

- `GET /api/health`
- `GET /api/nfts/:tokenId/owner`
- Additional endpoints for batch ownership and stats are implemented in the blockchain service.

## Unknown / To Verify
- Exact admin endpoints and auth requirements.
- Whether the blockchain service is exposed publicly or only used internally.

## Verification Steps
- Review route files in `apps/backend/src/routes`.
- Exercise endpoints using curl or Postman.

## Last Verified
Unknown / To verify. Confirm API shapes and update with examples.
