#!/usr/bin/env node

import fetch from 'node-fetch';

const KCC_RPC_URL = process.env.KCC_RPC_URL || 'http://localhost:8545';

async function checkSyncStatus() {
  console.log('🔍 Checking KCC Node Sync Status...');
  console.log(`📡 RPC URL: ${KCC_RPC_URL}`);
  console.log('─'.repeat(50));

  try {
    // Check if node is reachable
    console.log('1. Checking node connectivity...');
    const healthResponse = await fetch(KCC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'web3_clientVersion',
        params: [],
        id: 1
      })
    });

    if (!healthResponse.ok) {
      throw new Error(`Node not reachable: HTTP ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    console.log(`✅ Node is reachable`);
    console.log(`   Client: ${healthData.result}`);
    console.log('');

    // Check sync status
    console.log('2. Checking sync status...');
    const syncResponse = await fetch(KCC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_syncing',
        params: [],
        id: 1
      })
    });

    const syncData = await syncResponse.json();

    // Get current block number
    const blockResponse = await fetch(KCC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });

    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);

    if (syncData.result === false) {
      // Check if we have peers and reasonable block height
      if (currentBlock === 0) {
        console.log('🔄 Node is at genesis block (block 0)');
        console.log('   Status: Waiting for peer connections to start sync');
        console.log('   This is normal for a fresh node');
        console.log('   Peer discovery may take 5-60 minutes');
      } else if (currentBlock < 1000) {
        console.log('⚠️  Node shows "fully synced" but at low block height');
        console.log(`   Current block: ${currentBlock.toLocaleString()}`);
        console.log('   This may indicate peer connection issues');
      } else {
        console.log('✅ Node appears to be fully synced');
        console.log(`   Current block: ${currentBlock.toLocaleString()}`);
      }
    } else {
      console.log('🔄 Node is actively syncing...');
      const syncInfo = syncData.result;
      
      const startingBlock = parseInt(syncInfo.startingBlock, 16);
      const currentBlock = parseInt(syncInfo.currentBlock, 16);
      const highestBlock = parseInt(syncInfo.highestBlock, 16);
      
      const progress = ((currentBlock - startingBlock) / (highestBlock - startingBlock) * 100).toFixed(2);
      
      console.log(`   Starting block: ${startingBlock.toLocaleString()}`);
      console.log(`   Current block: ${currentBlock.toLocaleString()}`);
      console.log(`   Highest block: ${highestBlock.toLocaleString()}`);
      console.log(`   Progress: ${progress}%`);
      console.log(`   Remaining blocks: ${(highestBlock - currentBlock).toLocaleString()}`);
      
      if (highestBlock > 0) {
        const estimatedTime = estimateSyncTime(currentBlock, highestBlock);
        console.log(`   Estimated time remaining: ${estimatedTime}`);
      }
    }
    console.log('');

    // Check peer count
    console.log('3. Checking peer connections...');
    const peerResponse = await fetch(KCC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'net_peerCount',
        params: [],
        id: 1
      })
    });

    const peerData = await peerResponse.json();
    const peerCount = parseInt(peerData.result, 16);
    console.log(`   Connected peers: ${peerCount}`);
    
    if (peerCount === 0) {
      console.log('   ⚠️  Warning: No peers connected. Sync may be stalled.');
    } else if (peerCount < 5) {
      console.log('   ⚠️  Warning: Low peer count. Consider increasing maxpeers.');
    } else {
      console.log('   ✅ Good peer connectivity');
    }
    console.log('');

    // Check gas price (network health indicator)
    console.log('4. Checking network health...');
    const gasResponse = await fetch(KCC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      })
    });

    const gasData = await gasResponse.json();
    const gasPrice = parseInt(gasData.result, 16);
    console.log(`   Current gas price: ${gasPrice} wei (${(gasPrice / 1e9).toFixed(2)} gwei)`);
    console.log('');

    console.log('📊 Summary:');
    console.log('─'.repeat(50));
    console.log('✅ KCC Node is running and accessible');
    console.log(`📡 RPC Endpoint: ${KCC_RPC_URL}`);
    console.log('💡 Tip: Run this script periodically to monitor sync progress');
    console.log('💡 Tip: Use "npm run monitor:sync" for continuous monitoring');

  } catch (error) {
    console.error('❌ Error checking sync status:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check if Docker is running: docker ps');
    console.log('2. Check KCC node logs: docker logs lomen-kcc-node');
    console.log('3. Ensure port 8545 is not blocked');
    console.log('4. Verify .env file has correct KCC_RPC_URL');
    process.exit(1);
  }
}

function estimateSyncTime(currentBlock, highestBlock) {
  const blocksRemaining = highestBlock - currentBlock;
  
  // Average KCC block time is ~3 seconds
  const avgBlockTime = 3; // seconds
  const totalSeconds = blocksRemaining * avgBlockTime;
  
  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  } else if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

// Continuous monitoring mode
async function continuousMonitoring(intervalSeconds = 60) {
  console.log(`🔄 Starting continuous monitoring (updates every ${intervalSeconds} seconds)`);
  console.log('Press Ctrl+C to stop\n');
  
  while (true) {
    const now = new Date();
    console.log(`\n📅 ${now.toLocaleString()}`);
    console.log('─'.repeat(50));
    
    try {
      await checkSyncStatus();
    } catch (error) {
      console.error(`❌ Monitoring error: ${error.message}`);
    }
    
    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isContinuous = args.includes('--continuous') || args.includes('-c');
const intervalArg = args.find(arg => arg.startsWith('--interval=')) || args.find(arg => arg.startsWith('-i='));
const intervalSeconds = intervalArg ? parseInt(intervalArg.split('=')[1]) : 60;

if (isContinuous) {
  continuousMonitoring(intervalSeconds).catch(console.error);
} else {
  checkSyncStatus().catch(console.error);
}
