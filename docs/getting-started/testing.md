# Testing & QA

## Purpose
Summarize current testing commands, QA artifacts, and known baseline status.

## Audience
Developers and QA engineers.

## Prerequisites
- Install dependencies in the package you intend to test.

## Test Commands by Package

### Backend
```bash
cd apps/backend
npm run lint
npm run test
```

### Blockchain
```bash
cd packages/blockchain
npm run lint
npm run test
```

### Database
```bash
cd packages/database
npm run lint
npm run build
```

### Shared
```bash
cd packages/shared
npm run lint
npm run test
```

### Frontend (apps/frontend)
```bash
cd apps/frontend
npm run lint
```

### Frontend (root /src)
```bash
npm run lint
```

## QA Assets
- QA reproduction docs are stored in [`docs/operations/qa-repros`](../operations/qa-repros/).
- QA fix plans are stored in [`docs/operations/qa-fix-plans`](../operations/qa-fix-plans/).

## Known Baseline (From Legacy Docs)
- Lint and unit test failures were previously observed in backend and shared packages.
- Treat the legacy baseline as **outdated** until re-verified.

## Verification Steps
- Run the lint/test commands above per package.
- Capture results in a new ADR or in `docs/operations/troubleshooting.md`.

## Last Verified
Unknown / To verify. Re-run tests and update this doc with current status.
