# Operations Runbooks

## Purpose
Provide step-by-step operational procedures for common tasks.

## Audience
Operators, QA, and engineers running the system locally or in staging.

## Prerequisites
- Docker installed and running for infrastructure-related runbooks.

## Runbook: Start Local Infrastructure (KCC Node + Redis)
1. Start containers:
   ```bash
   docker compose -f docker-compose.kcc-node.yml up -d
   ```
2. Check container status:
   ```bash
   docker ps
   ```

## Runbook: Check KCC Node Sync Status
1. Run the sync status script:
   ```bash
   node scripts/check-kcc-sync.js
   ```
2. For continuous monitoring (60s interval by default):
   ```bash
   node scripts/check-kcc-sync.js --continuous --interval=300
   ```

## Runbook: Restart KCC Node
1. Stop containers:
   ```bash
   docker compose -f docker-compose.kcc-node.yml down
   ```
2. Start containers again:
   ```bash
   docker compose -f docker-compose.kcc-node.yml up -d
   ```
3. Verify health:
   ```bash
   curl -X POST http://localhost:8545 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
   ```

## Runbook: Check Docker Installation
1. Run the helper script:
   ```bash
   node scripts/check-docker.js
   ```

## Last Verified
Unknown / To verify. Validate script availability and Docker Compose usage in the current environment.
