# Architecture Summary (C4-style)

## Purpose
Document the system context, containers, and components for the Lomen Club platform.

## Audience
Engineers, architects, and operators who need to understand system boundaries and responsibilities.

## Prerequisites
Basic familiarity with Node.js services and React applications.

## System Context
The Lomen Club platform is a web application that presents NFTs and membership features to end users. It integrates with MongoDB for persistence and the KCC blockchain for on-chain data.

```
[User Browser]
   |
   v
[Frontend UI] <--> [Backend API] <--> [MongoDB]
                         |
                         v
                [Blockchain Service] <--> [KCC RPC]
```

## Containers

### Frontend (React/Vite)
- **Location:** `apps/frontend`
- **Role:** Browser UI for NFT browsing, profiles, admin tools, and wallet interactions.
- **Runtime:** Vite dev server (default port 3000).

### Backend API (Express)
- **Location:** `apps/backend`
- **Role:** REST API for NFT data, auth flows, profiles, and admin functions.
- **Runtime:** Node.js server (default port 3002).
- **Dependencies:** MongoDB and `@lomen-club/database`.

### Blockchain Service (Express + ethers)
- **Location:** `packages/blockchain`
- **Role:** Exposes blockchain-related APIs (NFT ownership, batch lookups, health) and manages provider resilience.
- **Runtime:** Node.js server (default port 3003).
- **Dependencies:** KCC RPC endpoints and ethers.js.

### Database Package (MongoDB)
- **Location:** `packages/database`
- **Role:** Connects to MongoDB, provides collections and enrichment services, and initializes indexes.

### Shared Types
- **Location:** `packages/shared`
- **Role:** Shared DTOs and type definitions used across frontend and backend.

## Component Highlights

### Backend API Routes
- `/api/nfts` (NFT listing, stats, traits)
- `/api/wallets` (wallet ownership and token IDs)
- `/api/auth` (challenge/response authentication)
- `/api/profile` (user profile and NFT sync)
- `/api/admin` (admin endpoints)

### Blockchain Service APIs
- `/api/health` for service health and provider resilience status
- `/api/nfts/:tokenId/owner` for ownership lookups
- Batch and enrichment endpoints (see API overview)

## Runtime/Deployment Topology (Current)
- Frontend runs in the browser and calls the backend API.
- Backend connects to MongoDB and calls the blockchain service.
- Blockchain service calls KCC RPC endpoints (local node or public endpoints).

## Last Verified
Unknown / To verify. Validate deployed topology and ensure service ports and URLs match environment configuration.
