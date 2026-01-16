# Troubleshooting

## Purpose
Collect known issues, symptoms, and remediation steps for the Lomen Club platform.

## Audience
Engineers, QA, and operators.

## Prerequisites
Access to logs, environment variables, and running services.

## Known Issues (From Legacy QA Notes)
> These items were recorded in legacy QA docs and may be outdated. Re-verify before actioning.

### Backend lint errors
- **Symptoms**: ESLint errors (undefined `process`, unused variables, `any` warnings).
- **Status**: Previously reported as partially fixed.
- **Verify**: Run `npm run lint` in `apps/backend`.

### Shared package Jest failures
- **Symptoms**: Syntax error in `packages/shared/__tests__/config.test.ts`.
- **Status**: Previously reported as open.
- **Verify**: Run `npm run test` in `packages/shared`.

### Auth challenge rate limiting
- **Symptoms**: `/api/auth/challenge` not rate limited beyond global limiter.
- **Status**: Reported open.
- **Verify**: Stress test auth endpoint and review service logs.

### Session cleanup and persistence
- **Symptoms**: Expired sessions cleaned only on access; sessions stored in memory.
- **Status**: Reported open.
- **Verify**: Inspect `AuthService` implementation and run long-lived session test.

## Common Runtime Issues

### KCC Node RPC Error
**Error**: `JsonRpcProvider failed to detect network...`

**Likely Causes**:
- KCC node is not running.
- Incorrect `KCC_RPC_URL`.

**Fix**:
1. Verify containers: `docker ps`.
2. Restart KCC node via Docker Compose.
3. Re-run the blockchain service.

## Escalation
If issues persist, capture logs from the backend and blockchain services and open a ticket with reproduction steps.

## Last Verified
Unknown / To verify. Re-run QA baselines and validate current issue status.
