# Local Development Setup for Lomen Club App

## Purpose
Preserve legacy local development instructions for reference.

## Audience
Developers reviewing historical setup steps.

## Prerequisites
Node.js, npm, Docker, and MongoDB access.

## Status
Archived. See `docs/getting-started/local-development.md` for current instructions.

## Last Verified
Unknown / legacy guide.

This guide explains how to set up a local development environment with a local KCC node and Redis cache to avoid rate limiting issues.

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js 18+ and npm/yarn/pnpm
3. MongoDB Atlas connection (or local MongoDB)

## Quick Start

### 1. Start Local Infrastructure

```bash
# Start local KCC node and Redis cache
docker-compose -f docker-compose.kcc-node.yml up -d

# Verify services are running
docker ps
```

### 2. Update Environment Configuration

The `.env` file has already been updated to use the local node:

```bash
# KCC Blockchain Settings - Using local node for development
KCC_RPC_URL=http://localhost:8545
KCC_WS_URL=ws://localhost:8546

# Redis Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=lomencache123
REDIS_TTL=300
```

### 3. Install Dependencies

```bash
# Install dependencies for all packages
npm install

# Install redis dependency for blockchain package
cd packages/blockchain && npm install
```

### 4. Start Development Servers

```bash
# Start blockchain service (in one terminal)
cd packages/blockchain
npm run dev

# Start backend service (in another terminal)
cd apps/backend
npm run dev

# Start frontend service (in another terminal)
cd apps/frontend
npm run dev
```

## Architecture Overview

### Local KCC Node
- Runs in Docker container using `kccnetwork/kcc-node:latest`
- Provides JSON-RPC API on port 8545
- Provides WebSocket API on port 8546
- Syncs with KCC mainnet (network ID: 321)
- Archive mode enabled for full historical data

### Redis Cache
- Caches blockchain data to reduce RPC calls
- 5-minute TTL for NFT owner data
- Automatic reconnection on failure
- Password protected

### Optimized Batch Processing
- Batch sizes increased from 10 to 50 for local node
- Delays reduced from 1000ms to 50-100ms
- Rate limits increased from 100 to 1000 requests/minute

## Configuration Changes

### 1. Blockchain Service (`packages/blockchain/src/index.ts`)
- Updated rate limiting for local node (1000 requests/minute)
- Added Redis caching for NFT owner data
- Updated default RPC URL to localhost:8545

### 2. NFT Sync Service (`apps/backend/src/services/nftSyncService.ts`)
- Increased batch size from 10 to 50
- Reduced delays from 1000ms to 100ms
- Removed unnecessary rate limiting delays

### 3. Blockchain Enrichment Service (`packages/blockchain/src/enrichmentService.ts`)
- Increased batch size from 10 to 50
- Reduced delays from 100ms to 50ms

### 4. Scripts Configuration (`scripts/config.js`)
- Environment-aware configuration
- Development mode uses faster settings
- Production mode maintains conservative settings

## Performance Improvements

### Before (External Node)
- 10 NFT batch size
- 1000ms delays between batches
- 100 requests/minute rate limit
- No caching

### After (Local Node)
- 50 NFT batch size (5x improvement)
- 50-100ms delays between batches (10-20x improvement)
- 1000 requests/minute rate limit (10x improvement)
- Redis caching for frequently accessed data

## Monitoring Sync Status

### Quick Sync Status Check
```bash
# One-time sync status check
npm run check:sync

# Continuous monitoring (updates every 60 seconds)
npm run monitor:sync

# Faster monitoring (updates every 30 seconds)
npm run monitor:sync:fast
```

### Docker Container Monitoring
```bash
# Check if infrastructure is running
npm run check:infra

# View KCC node logs in real-time
npm run logs:kcc

# View Redis cache logs
npm run logs:redis

# Get detailed KCC node statistics
npm run stats:kcc:detailed
```

### Manual Sync Status Checks
```bash
# Check if node is reachable
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}'

# Check sync status
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

# Get current block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check peer count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
```

### Automated Sync Monitoring
The docker-compose includes an automated sync monitor that:
- Runs in a separate container (`lomen-sync-monitor`)
- Checks sync status every 5 minutes (300 seconds)
- Logs sync progress to Docker logs
- Automatically starts with the infrastructure

View sync monitor logs:
```bash
docker logs lomen-sync-monitor
```

### Understanding Sync Status

#### When Node is Syncing:
```
🔄 Node is syncing...
   Starting block: 1,234,567
   Current block: 2,345,678
   Highest block: 10,000,000
   Progress: 23.45%
   Remaining blocks: 7,654,322
   Estimated time remaining: 2d 15h
```

#### When Node is Fully Synced:
```
✅ Node is fully synced
   Current block: 10,000,000
```

#### Common Status Indicators:
- **✅ Node is reachable**: RPC endpoint is working
- **🔄 Node is syncing**: Actively downloading blocks
- **✅ Node is fully synced**: Up to date with network
- **⚠️ Low peer count**: Less than 5 peers connected
- **❌ Node not reachable**: Check Docker and network

### Sync Time Estimates

KCC average block time: ~3 seconds

| Blocks Remaining | Estimated Time |
|-----------------|----------------|
| 1,000 blocks | ~50 minutes |
| 10,000 blocks | ~8 hours |
| 100,000 blocks | ~3.5 days |
| 1,000,000 blocks | ~35 days |

**Tip**: Light sync mode (`--syncmode=light`) is much faster than full sync but may not have all historical data.

### Troubleshooting Sync Issues

#### 1. Node Not Starting
```bash
# Check Docker logs
docker logs lomen-kcc-node

# Check disk space (KCC node needs ~100GB+ for full sync)
df -h

# Check memory usage
docker stats lomen-kcc-node
```

#### 2. Slow Sync Progress
```bash
# Increase peer connections
# Edit docker-compose.kcc-node.yml and increase --maxpeers=100

# Check network connectivity
ping 8.8.8.8

# Check if ports are open
netstat -tuln | grep 8545
```

#### 3. Stuck Sync
```bash
# Restart the node
docker-compose -f docker-compose.kcc-node.yml restart kcc-node

# Check for error logs
docker logs --tail 100 lomen-kcc-node

# Reset sync (WARNING: deletes all synced data)
docker-compose -f docker-compose.kcc-node.yml down -v
docker-compose -f docker-compose.kcc-node.yml up -d
```

#### 4. No Peers Connected
```bash
# Check peer discovery
docker exec lomen-kcc-node geth attach --exec 'admin.peers'

# Add static peers (edit docker-compose)
# Add to command: --bootnodes "enode://..."
```

### When to Start Development

You can start development **before** the node is fully synced:

1. **Immediately**: Basic RPC calls work as soon as node starts
2. **After some sync**: Recent block data becomes available
3. **Fully synced**: All historical data available

For most development tasks, you only need recent block data. Start your app once:
- Node is reachable (`npm run check:sync` shows "Node is reachable")
- You have at least 5 peer connections
- Sync is progressing (blocks increasing)

### Blockchain Service Health
```bash
# Health check
curl http://localhost:3003/api/health
```

## Troubleshooting

### KCC Node Not Syncing
```bash
# Check sync status
docker exec lomen-kcc-node geth attach --exec eth.syncing

# Restart node
docker-compose -f docker-compose.kcc-node.yml restart kcc-node
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Check Redis logs
docker logs lomen-redis-cache
```

### Rate Limiting Still Occurring
1. Verify `.env` file has `KCC_RPC_URL=http://localhost:8545`
2. Check blockchain service logs for connection errors
3. Verify KCC node is running: `docker ps | grep kcc`

## Switching Back to Production

To switch back to using the external KCC node:

1. Update `.env` file:
   ```bash
   KCC_RPC_URL=https://rpc-mainnet.kcc.network
   # Comment out Redis configuration if not needed
   ```

2. Stop local infrastructure:
   ```bash
   docker-compose -f docker-compose.kcc-node.yml down
   ```

3. Update batch sizes and delays in services if needed.

## Benefits of Local Development Setup

1. **No Rate Limiting**: Local node has no request limits
2. **Faster Response Times**: No network latency to external nodes
3. **Reliable**: No dependency on external service availability
4. **Cost Effective**: No API key or subscription fees
5. **Better Debugging**: Full control over node configuration
6. **Historical Data**: Archive node provides full blockchain history

## Next Steps

1. Implement WebSocket subscriptions for real-time updates
2. Add more comprehensive caching strategies
3. Implement connection pooling for blockchain requests
4. Add monitoring and alerting for local infrastructure
5. Create automated deployment scripts for local setup
