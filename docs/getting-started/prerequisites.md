# Prerequisites

## Purpose
List the tools and external services required to run or develop the Lomen Club platform.

## Audience
Developers and QA engineers setting up the project locally.

## Prerequisites
None.

## Required Software
- **Node.js**: Needed for all services (frontend, backend, blockchain). Version is not enforced in `package.json`; previous docs reference Node 18+.
- **npm**: Used to install dependencies and run scripts.
- **Docker + Docker Compose**: Required to run the local KCC node and Redis containers defined in `docker-compose.kcc-node.yml`.

## External Services
- **MongoDB**: The backend requires `MONGODB_URI` to connect to a MongoDB database.
- **KCC RPC**: The blockchain service requires access to a KCC JSON-RPC endpoint (local node or public RPC).

## Environment Variables
Copy `.env.example` to `.env` and adjust values as needed.

## Verification Steps
- `node --version` and `npm --version`
- `docker --version` and `docker compose version`
- Ensure `MONGODB_URI` is reachable from your environment

## Last Verified
Unknown / To verify. Confirm minimum Node.js version and whether Docker/Redis are still required.
