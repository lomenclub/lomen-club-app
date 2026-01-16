# QA Baseline

## Environment

- Node.js: >=18.0.0
- npm: >=9.0.0
- TypeScript: 5.9.3
- Workspace: Monorepo with packages (shared, database, blockchain) and apps (frontend, backend)

## Available Commands

### Development
- `npm run dev` - Start all services concurrently (frontend, backend, blockchain)
- `npm run dev:frontend` - Start frontend dev server
- `npm run dev:backend` - Start backend dev server
- `npm run dev:blockchain` - Start blockchain sync service
- `npm run dev:infra` - Start Docker infrastructure (KCC node, Redis)

### Build
- `npm run build` - Build all packages and apps
- `npm run build:shared`, `build:database`, `build:blockchain`, `build:frontend`, `build:backend` - Individual builds

### Testing & Quality
- `npm run lint` - ESLint with TypeScript/JS files (max-warnings 0)
- `npm run type-check` - TypeScript type checking (noEmit)
- `npm run test` - Jest test runner

### Infrastructure
- `npm run start:infra` - Start Docker containers
- `npm run stop:infra` - Stop Docker containers
- `npm run check:infra` - Check if infrastructure is running
- `npm run check:sync` - Check KCC sync status

### Data Operations
- `npm run migrate:nfts` - Migrate NFTs to MongoDB
- `npm run check:missing-nfts` - Check for missing NFTs
- `npm run import:missing-nfts` - Import missing NFTs
- `npm run fix:missing-nfts` - Combined check and import

## Test Baseline Results (as of 2026-01-03)

### Linting
- **Status**: FAILING
- **Issues**: Multiple ESLint errors in backend code:
  - `process` not defined (no-undef) in multiple files
  - Unused variables (`__dirname`, `_next`)
  - Explicit `any` type warnings
- **Files affected**:
  - `apps/backend/src/index.ts`
  - `apps/backend/src/routes/health.ts`
  - `apps/backend/src/routes/nfts.ts`

### Type Checking
- **Status**: PASSING (no errors reported)
- **Note**: Root `tsconfig.json` not present; each package has its own config.

### Unit Tests
- **Status**: FAILING
- **Issue**: Jest test suite fails to run due to syntax error in `packages/shared/__tests__/config.test.ts`
- **Error**: `SyntaxError: Unexpected token, expected "," (71:13)` at `null as any`
- **Root Cause**: Likely TypeScript/ESM configuration issue with Jest

### Build
- **Status**: PASSING
- **Shared package builds successfully**

### Infrastructure
- **Status**: UNKNOWN (requires Docker running)
- **KCC Node**: Local development chain available via Docker

## Test Coverage

Currently minimal:
- Only one test file: `packages/shared/__tests__/config.test.ts`
- No tests for frontend, backend, database, or blockchain packages
- No integration/e2e tests

## Environment Variables

Required environment variables (see `.env.example`):
- `MONGODB_URI`
- `REDIS_URL`
- `PORT` (backend)
- `KCC_RPC_URL`
- `KUSWAP_CONTRACT_ADDRESS`
- `NFT_CONTRACT_ADDRESS`
- `BATCH_SIZE` (optional)

## Next Steps for QA Loop

1. Fix linting errors to establish clean baseline
2. Fix Jest configuration to run existing tests
3. Create smoke tests for critical flows
4. Implement test coverage for high-risk areas

## Risk Areas (Priority Order)

1. Authentication / signature challenges / replay protection
2. Wallet connect flows and network switching
3. Blockchain RPC calls (timeouts, errors, partial failures)
4. Sync/enrichment job correctness (data consistency, idempotency)
5. API input validation & error responses
6. MongoDB queries (paging, sorting, filters, edge cases)
7. Frontend state handling (loading/error, race conditions)
8. Performance regressions (p95 latency, N+1 calls)

## Notes

- Project uses monorepo with npm workspaces
- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- Blockchain: Custom sync service for KCC chain
- Database: MongoDB with Redis caching
- Docker used for local KCC node and Redis
