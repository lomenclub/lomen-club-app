# Quick Start: KCC Node Sync Monitoring

## Purpose
Preserve legacy sync monitoring instructions.

## Audience
Operators and developers reviewing historical monitoring steps.

## Prerequisites
Docker and a local KCC node.

## Status
Archived. See `docs/operations/runbooks.md` for current instructions.

## Last Verified
Unknown / legacy guide.

## Prerequisite: Start Docker
```bash
# Check Docker status
npm run check:docker

# If Docker is not running, start it:
npm run start:docker

# Wait for Docker to start (check Docker Desktop icon)
# Then verify Docker is running:
docker ps
```

## Start Local Infrastructure
```bash
# Start KCC node, Redis cache, and sync monitor
npm run dev:infra

# Check if services are running
npm run check:infra

# If you get Docker errors, run the check first:
npm run check:docker
```

## Monitor Sync Status
```bash
# One-time sync check
npm run check:sync

# Continuous monitoring (recommended during initial sync)
npm run monitor:sync

# Faster updates (every 30 seconds)
npm run monitor:sync:fast
```

## View Logs
```bash
# KCC node logs
npm run logs:kcc

# Redis cache logs
npm run logs:redis

# Sync monitor logs
docker logs lomen-sync-monitor
```

## What to Look For

### ✅ Good Signs (Ready for Development)
- "Node is reachable" appears
- At least 5 peer connections
- Block number is increasing
- Sync progress is showing

### ⚠️ Warning Signs
- "No peers connected" - check network/firewall
- Sync stuck at 0% - restart node
- "Node not reachable" - check Docker

### 🚀 Start Development When...
1. Node is reachable (`npm run check:sync` works)
2. You have peer connections (5+ recommended)
3. Sync is progressing (blocks increasing)

## Estimated Sync Times

| Sync Mode | Initial Sync | Daily Sync |
|-----------|--------------|------------|
| **Light Sync** | 2-4 hours | 5-10 minutes |
| **Full Sync** | 3-7 days | 30-60 minutes |

**Recommendation**: Use light sync (`--syncmode=light`) for development.

## Common Commands Cheat Sheet

```bash
# Infrastructure
npm run dev:infra          # Start all services
npm run stop:infra         # Stop all services
npm run check:infra        # Check service status

# Monitoring
npm run check:sync         # Check sync status once
npm run monitor:sync       # Continuous monitoring
npm run logs:kcc           # View KCC node logs

# Development
npm run dev:full           # Start infra + all apps
npm run dev:blockchain     # Start blockchain service
npm run dev:backend        # Start backend service
npm run dev:frontend       # Start frontend service
```

## Troubleshooting Quick Fixes

### Node Won't Start
```bash
# Check Docker
docker ps
docker logs lomen-kcc-node

# Restart everything
npm run stop:infra
npm run dev:infra
```

### No Peer Connections
```bash
# Check network
ping 8.8.8.8

# Restart node with more peers
# Edit docker-compose.kcc-node.yml: --maxpeers=100
npm run stop:infra
npm run dev:infra
```

### Sync Stuck
```bash
# Check current status
npm run check:sync

# Restart sync
docker-compose -f docker-compose.kcc-node.yml restart kcc-node

# View detailed logs
npm run logs:kcc
```

## Ready for Development Checklist

- [ ] `npm run check:sync` shows "Node is reachable"
- [ ] Peer count shows 5+ connections
- [ ] Block number is increasing
- [ ] `.env` file has `KCC_RPC_URL=http://localhost:8545`
- [ ] Redis is running (`docker ps | grep redis`)

Once all checks pass, start your development servers:
```bash
npm run dev:full
```

The local KCC node will continue syncing in the background while you develop.
