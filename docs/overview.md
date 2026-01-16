# System Overview

## Purpose
Summarize the Lomen Club repository, its major components, and how the project is organized.

## Audience
Engineers, QA, DevOps, and stakeholders who need a quick mental model of the system.

## Prerequisites
None.

## System Summary
The repository contains two React/Vite frontends (one at repo root and one under `apps/frontend`), an Express-based backend API, a blockchain service for KCC RPC interactions, and shared packages for database access and type definitions. These components are organized under `apps/` and `packages/`, with additional deployment scripts and a WordPress theme directory.

### Primary Components
- **Frontend (React/Vite)**: `apps/frontend` contains a UI application with shared TypeScript types via `@lomen-club/shared`.
- **Root Frontend (React/Vite)**: `/src` at the repository root contains a second UI app with its own `vite.config.ts` and `package.json`.
- **Backend API (Express)**: `apps/backend` hosts the API server that connects to MongoDB and uses services from `@lomen-club/database`.
- **Blockchain Service (Express + ethers)**: `packages/blockchain` provides blockchain RPC endpoints and contract queries for the KCC network.
- **Database Package (MongoDB)**: `packages/database` centralizes MongoDB connectivity, collections, and enrichment services.
- **Shared Types**: `packages/shared` provides DTOs and shared types for both backend and frontend.
- **WordPress Theme**: `wordpress-theme-lomen-club` contains a standalone WordPress theme that mirrors the UI branding.

### Repository Map (High Level)
```
apps/
  backend/          Express API server
  frontend/         React/Vite UI
packages/
  blockchain/       KCC blockchain service
  database/         MongoDB access + enrichment
  shared/           Shared types and DTOs
scripts/            Data and sync scripts
wordpress-theme-lomen-club/  WordPress theme assets
```

## Known Ambiguities / To Verify
- Determine which frontend is deployed in production (`/src` vs `apps/frontend`), since both exist and include Vite configs.
- Docker Compose defines Redis, but there are no Redis imports in application packages. Confirm whether Redis is required or only a legacy component.

## Glossary
- **KCC**: KuCoin Community Chain (blockchain network used by the app).
- **NFT**: Non-fungible token; the app includes services for NFT metadata and ownership checks.
- **RPC**: Remote procedure call; used for blockchain queries.

## Last Verified
Unknown / To verify. Confirm the canonical frontend entry point and whether Redis is required.
