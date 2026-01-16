# System Overview

## Purpose
Summarize the Lomen Club repository, its major components, and how the project is organized.

## Audience
Engineers, QA, DevOps, and stakeholders who need a quick mental model of the system.

## Prerequisites
None.

## System Summary
The repository contains a React/Vite frontend, an Express-based backend API, a blockchain service for KCC RPC interactions, and shared packages for database access and type definitions. These components are organized under `apps/` and `packages/`, with additional deployment scripts and a WordPress theme directory.

### Primary Components
- **Frontend (React/Vite)**: `apps/frontend` contains the UI application with shared TypeScript types via `@lomen-club/shared`.
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
- A second Vite project exists at the repository root (`/src`, `vite.config.ts`, and `package.json`). It is unclear whether this root app or `apps/frontend` is the canonical UI. Verify which frontend is deployed and update docs accordingly.
- Docker Compose defines Redis, but there are no obvious Redis imports in the application packages. Confirm whether Redis is still required for runtime or only for legacy flows.

## Glossary
- **KCC**: KuCoin Community Chain (blockchain network used by the app).
- **NFT**: Non-fungible token; the app includes services for NFT metadata and ownership checks.
- **RPC**: Remote procedure call; used for blockchain queries.

## Last Verified
Unknown / To verify. Validate current frontend entry point and Redis usage.
