# Local Development

## Purpose
Provide steps to run the frontend, backend, blockchain service, and supporting infrastructure locally.

## Audience
Developers and QA engineers working on the application.

## Prerequisites
- See [Prerequisites](prerequisites.md).
- Create `.env` from `.env.example` in the repository root.

## Recommended Setup

### 1) Start the Blockchain Service
```bash
cd packages/blockchain
npm install
npm run dev
```

### 2) Start the Backend API
```bash
cd apps/backend
npm install
npm run dev
```

### 3) Start the Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

## Alternative: Root Frontend (To Verify)
A Vite app also exists at the repository root (`/src`, `vite.config.ts`). If this is the active frontend, run:
```bash
npm install
npm run dev
```

## Feature Flags: “Coming Soon” Overlay
Both frontend trees reference `config/app-config.ts` to toggle the Coming Soon overlay. Update `showComingSoon` to enable or disable the overlay:
- `apps/frontend/src/config/app-config.ts`
- `src/config/app-config.ts`

## Notes
- The backend loads the `.env` file from the repository root via `../../.env`.
- The blockchain service defaults to `KCC_RPC_URL=http://localhost:8545`.

## Verification Steps
- Visit `http://localhost:3000` for the frontend.
- Verify backend health endpoint (`/api/health`) is responding.
- Verify blockchain health endpoint (`/api/health`) is responding.

## Last Verified
Unknown / To verify. Confirm which frontend entry point is active and validate that Docker-based infrastructure is still required.
