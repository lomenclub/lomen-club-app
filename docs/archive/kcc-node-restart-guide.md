# KCC Node Restart Guide

## Purpose
Preserve a legacy KCC node restart guide for reference.

## Audience
Operators and developers troubleshooting legacy setups.

## Prerequisites
Docker installed and KCC node image available.

## Status
Archived. See `docs/operations/runbooks.md` for current procedures.

## Last Verified
Unknown / legacy guide.

## Error: "[2] JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)"

### Understanding the Error

This error occurs when the ethers.js `JsonRpcProvider` in your blockchain service tries to connect to the KCC blockchain node but cannot detect the network. The error message suggests two possible causes:

1. **The URL is wrong** - The RPC endpoint URL is incorrect or unreachable
2. **The node is not started** - The KCC node is not running

### Diagnosis Steps

When you encounter this error, follow these steps to diagnose:

#### 1. Check if the KCC Container is Running

```bash
# Check running containers
docker ps | grep kcc

# Check all containers (including stopped ones)
docker ps -a | grep kcc
```

#### 2. Check Container Status

If the container exists but is not running:

```bash
# Check exit code and status
docker inspect kcc --format='{{.State.Status}} {{.State.ExitCode}} {{.State.Error}}'

# View recent logs
docker logs --tail 50 kcc
```

#### 3. Test RPC Connection

```bash
# Test if the RPC endpoint is reachable
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**Expected Response (if node is running):**
```json
{"jsonrpc":"2.0","id":1,"result":"0x141"}
```

**Possible Responses:**
- `curl: (7) Failed to connect to localhost port 8545` - Node is not running
- `{"jsonrpc":"2.0","id":1,"result":"0x141"}` - Node is running and healthy
- Connection timeout - Node might be starting or stuck

## Restarting the KCC Node

### Exact Command Used Previously

Based on the container configuration that was working yesterday, here is the exact command to restart the KCC node:

```bash
# Remove the old container if it exists (it's already stopped)
docker rm kcc

# Start with the exact same configuration
docker run -d \
  --name kcc \
  -p 8545:8545 \
  -p 8546:8546 \
  -p 30303:30303 \
  -p 30303:30303/udp \
  -v /Users/taimour/Developer/lomen-club-app/kcc:/data/.kcc \
  kucoincommunitychain/kcc:latest \
  --datadir /data/.kcc \
  --port 30303 \
  --http \
  --http.addr 0.0.0.0 \
  --ws \
  --ws.addr 0.0.0.0 \
  --nat any
```

### Configuration Details

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Container Name** | `kcc` | Identifies the container |
| **HTTP RPC Port** | `8545:8545` | JSON-RPC API (what your app connects to) |
| **WebSocket Port** | `8546:8546` | WebSocket API for real-time updates |
| **P2P Port** | `30303:30303` | Peer-to-peer networking (TCP) |
| **P2P UDP Port** | `30303:30303/udp` | Peer-to-peer networking (UDP) |
| **Volume Mount** | `/Users/taimour/Developer/lomen-club-app/kcc:/data/.kcc` | Persists blockchain data |
| **Image** | `kucoincommunitychain/kcc:latest` | Official KCC node image |
| **Data Directory** | `--datadir /data/.kcc` | Where blockchain data is stored |
| **P2P Port** | `--port 30303` | Internal P2P port |
| **HTTP RPC** | `--http --http.addr 0.0.0.0` | Enable HTTP RPC on all interfaces |
| **WebSocket RPC** | `--ws --ws.addr 0.0.0.0` | Enable WebSocket RPC on all interfaces |
| **NAT Configuration** | `--nat any` | Network address translation |

### Alternative: Using Docker Compose

If you prefer using docker-compose (as documented in `LOCAL_DEVELOPMENT_SETUP.md`):

```bash
# Start using docker-compose
docker-compose -f docker-compose.kcc-node.yml up -d
```

**Note:** The docker-compose configuration uses slightly different arguments (includes `--syncmode=light` and additional API configurations). Both configurations work, but the direct `docker run` command above matches exactly what was running yesterday.

## Verification Steps

After starting the container, verify everything is working:

### 1. Check Container Status

```bash
# Verify container is running
docker ps | grep kcc

# Should show something like:
# CONTAINER ID   IMAGE                          COMMAND                  STATUS         PORTS                                                                              NAMES
# f8a19e5e0f97   kucoincommunitychain/kcc:latest "geth --datadir /dat…"   Up 5 seconds   0.0.0.0:8545->8545/tcp, 0.0.0.0:8546->8546/tcp, 0.0.0.0:30303->30303/tcp, 0.0.0.0:30303->30303/udp   kcc
```

### 2. Check Initialization Logs

```bash
# View the last 20 lines of logs
docker logs --tail 20 kcc

# Look for these indicators:
# ✅ "HTTP server started" - RPC endpoint is ready
# ✅ "WebSocket enabled" - WebSocket is ready
# ✅ "Started P2P networking" - Node can connect to peers
# 🔄 "Looking for peers" - Actively searching for network connections
```

### 3. Test RPC Endpoints

```bash
# Test chain ID (should return 0x141 for KCC Mainnet)
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Check sync status
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

# Get current block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 4. Test Your Application

Once the node is running, restart your blockchain service:

```bash
cd packages/blockchain
npm run dev
```

The "[2] JsonRpcProvider failed to detect network" error should no longer appear.

## Common Issues and Solutions

### Issue 1: Container Exits Immediately

**Symptoms:** Container starts but exits with code 1

**Solutions:**
```bash
# Check detailed logs for errors
docker logs kcc

# Common causes:
# 1. Port already in use - check if another service is using port 8545
# 2. Permission issues with volume mount - check directory permissions
# 3. Insufficient disk space - KCC needs ~100GB+ for full sync

# Check port usage
lsof -i :8545

# Check disk space
df -h /Users/taimour/Developer/lomen-club-app
```

### Issue 2: Node is Running but Not Syncing

**Symptoms:** Container runs but doesn't connect to peers or sync blocks

**Solutions:**
```bash
# Check peer count
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# If peer count is 0, try:
# 1. Wait a few minutes - peer discovery takes time
# 2. Check firewall settings
# 3. Restart with different NAT settings
```

### Issue 3: RPC Calls Time Out

**Symptoms:** curl commands hang or timeout

**Solutions:**
```bash
# Check if node is still starting (can take 1-2 minutes)
docker logs --tail 10 kcc

# Check memory usage (node might be OOM)
docker stats kcc

# If out of memory, increase Docker memory allocation
# or restart with light sync mode
```

## Preventive Measures

### 1. Monitor Node Health

Create a simple monitoring script:

```bash
#!/bin/bash
# check-kcc-health.sh

# Check if container is running
if ! docker ps | grep -q kcc; then
    echo "❌ KCC container is not running"
    exit 1
fi

# Test RPC connection
response=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  --max-time 5)

if [[ $response == *"0x141"* ]]; then
    echo "✅ KCC node is healthy"
else
    echo "❌ KCC node RPC not responding correctly"
    echo "Response: $response"
    exit 1
fi
```

### 2. Auto-restart on Failure

Use Docker's restart policy:

```bash
# Add --restart unless-stopped to your docker run command
docker run -d \
  --name kcc \
  --restart unless-stopped \
  # ... rest of the arguments
```

### 3. Regular Log Monitoring

Check logs periodically for issues:

```bash
# Add to crontab to check logs daily
0 9 * * * docker logs --since 24h kcc | grep -E "(ERROR|WARN|Failed)" > /tmp/kcc-errors-$(date +\%Y\%m\%d).log
```

## Quick Reference

### Start Command (Exact Match to Yesterday)
```bash
docker run -d --name kcc -p 8545:8545 -p 8546:8546 -p 30303:30303 -p 30303:30303/udp -v /Users/taimour/Developer/lomen-club-app/kcc:/data/.kcc kucoincommunitychain/kcc:latest --datadir /data/.kcc --port 30303 --http --http.addr 0.0.0.0 --ws --ws.addr 0.0.0.0 --nat any
```

### Health Check Command
```bash
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Log Check Command
```bash
docker logs --tail 20 kcc
```

## Related Documentation

- [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) - Full local development setup guide
- [docker-compose.kcc-node.yml](./docker-compose.kcc-node.yml) - Docker compose configuration
- [packages/blockchain/src/index.ts](./packages/blockchain/src/index.ts) - Blockchain service implementation

---

**Last Updated:** January 4, 2026  
**Based on Container ID:** f8a19e5e0f97 (original working container)  
**Volume Path:** `/Users/taimour/Developer/lomen-club-app/kcc`  
**Image:** `kucoincommunitychain/kcc:latest`
