# Data Flow

## Purpose
Describe the primary data flows between the UI, backend, blockchain service, and database.

## Audience
Engineers and QA looking to understand request paths and integration points.

## Prerequisites
Understanding of the containers in [Architecture Summary](architecture.md).

## Primary Flows

### 1) NFT Browsing
1. **User** interacts with the UI in the browser.
2. **Frontend** requests `/api/nfts` from the backend.
3. **Backend** queries MongoDB via `@lomen-club/database` for NFT metadata.
4. **Backend** responds with paginated NFT data.

### 2) NFT Ownership / “On Sale” Filtering
1. **Frontend** requests `/api/nfts` with filters or calls `/api/wallets/:address/token-ids`.
2. **Backend** uses MongoDB data (and enrichment logic) to evaluate ownership.
3. **Optional**: Backend or enrichment services call the blockchain service for fresh owner data.

### 3) Wallet Authentication
1. **Frontend** requests `/api/auth/challenge`.
2. **Backend** generates a challenge and returns it.
3. **Frontend** signs the challenge with a wallet and sends `/api/auth/authenticate`.
4. **Backend** validates the signature and returns a session token.

### 4) NFT Enrichment / Sync
1. **Backend** or scripts trigger enrichment or sync flows.
2. **Database package** updates NFT metadata.
3. **Blockchain service** fetches owner data from the KCC RPC endpoint.

## External Dependencies
- **MongoDB** for persistent NFT and profile data.
- **KCC RPC** for on-chain data.

## Last Verified
Unknown / To verify. Validate current enrichment flows and the exact backend-to-blockchain call paths.
