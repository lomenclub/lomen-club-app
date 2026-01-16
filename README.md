# Lomen Club Platform

## Purpose
Provide an overview and quickstart for the Lomen Club repository.

## Audience
Developers, QA engineers, and operators onboarding to the project.

## Prerequisites
- See [docs/getting-started/prerequisites.md](docs/getting-started/prerequisites.md).

## Quickstart (Local)
> The repository contains two frontend code paths (`/src` and `apps/frontend`). Decide which UI to run for your environment.

### Start infrastructure (KCC node via Docker)
```bash
docker compose -f docker-compose.kcc-node.yml up -d
```

### Start blockchain service
```bash
cd packages/blockchain
npm install
npm run dev
```

### Start backend API
```bash
cd apps/backend
npm install
npm run dev
```

### Start frontend (apps/frontend)
```bash
cd apps/frontend
npm install
npm run dev
```

### Start frontend (root /src)
```bash
npm install
npm run dev
```

## Documentation
- [Docs index](docs/index.md)
- [System overview](docs/overview.md)
- [Local development](docs/getting-started/local-development.md)

## Repository Layout
```
apps/       # Backend and frontend apps
packages/   # Shared packages (blockchain, database, shared types)
docs/       # Documentation (canonical)
scripts/    # Operational and data scripts
```

## Last Verified
Unknown / To verify. Confirm the canonical frontend entry point and update quickstart if needed.
