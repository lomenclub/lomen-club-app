#!/usr/bin/env node

/* global process */
import { NFTSyncService } from './syncService.js';
import { getMongoDBUri } from '@lomen-club/shared';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Lomen NFT Sync Runner');
  console.log('=======================\n');
  
  // Configuration from environment variables
  // Use public RPC for initial sync (has full history), local for ongoing
  const usePublicRPC = process.env.USE_PUBLIC_RPC_FOR_SYNC === 'true' || true;
  const rpcUrl = usePublicRPC 
    ? 'https://rpc-mainnet.kcc.network'
    : process.env.KCC_RPC_URL || 'http://localhost:8545';
    
  const config = {
    rpc_url: rpcUrl,
    contract_address: process.env.LOMEN_NFT_CONTRACT || '0x4ca64bf392ee736f6007ce93e022deb471a9dfd1',
    mongodb_uri: getMongoDBUri(),
    from_block: process.env.SYNC_FROM_BLOCK ? parseInt(process.env.SYNC_FROM_BLOCK) : 20000000, // Conservative start
    confirmations: process.env.CONFIRMATIONS ? parseInt(process.env.CONFIRMATIONS) : 20,
    batch_size: process.env.SYNC_BATCH_SIZE ? parseInt(process.env.SYNC_BATCH_SIZE) : 1000,
    max_retries: 3,
    retry_delay_ms: 1000,
    max_blocks_per_second: 10, // Conservative for public RPC
    max_requests_per_second: 20, // Conservative for public RPC
    ws_url: process.env.KCC_WS_URL || 'ws://localhost:8546'
  };
  
  console.log('📋 Configuration:');
  console.log(`   RPC URL: ${config.rpc_url}`);
  console.log(`   Contract: ${config.contract_address}`);
  console.log(`   From Block: ${config.from_block || 'auto-detect'}`);
  console.log(`   Confirmations: ${config.confirmations}`);
  console.log(`   Batch Size: ${config.batch_size}`);
  console.log('');
  
  // Create sync service
  const syncService = new NFTSyncService(config);
  
  try {
    // Initialize
    await syncService.initialize();
    
    // Get initial status
    const initialStatus = await syncService.getStatus();
    console.log('📊 Initial Status:');
    console.log(`   Tokens in DB: ${initialStatus.tokens_count}`);
    console.log(`   Transfers in DB: ${initialStatus.transfers_count}`);
    console.log(`   Last Finalized Block: ${initialStatus.last_finalized_block}`);
    console.log(`   Head Block: ${initialStatus.head_block}`);
    console.log(`   Lag: ${initialStatus.lag} blocks`);
    console.log('');
    
    // Check if sync is needed
    if (initialStatus.lag === 0 && initialStatus.tokens_count === 10000) {
      console.log('✅ Sync appears to be up-to-date');
      
      // Run verification
      console.log('🔍 Running verification...');
      const verification = await syncService.verifySync(200);
      
      if (verification.passed) {
        console.log('✅ Verification passed!');
        process.exit(0);
      } else {
        console.log('❌ Verification failed, starting sync...');
      }
    }
    
    // Start sync
    console.log('🚀 Starting sync process...');
    
    // Set up progress monitoring
    const progressInterval = setInterval(async () => {
      const progress = syncService.getProgress();
      if (progress) {
        console.log(`📊 Progress: Block ${progress.current_block}/${progress.head_block} ` +
                   `(${Math.round((progress.current_block / progress.head_block) * 100)}%) ` +
                   `| Tokens: ${progress.tokens_discovered} | Transfers: ${progress.transfers_processed}`);
      }
    }, 5000); // Update every 5 seconds
    
    // Start sync
    await syncService.startSync();
    
    // Clear progress interval
    clearInterval(progressInterval);
    
    // Get final status
    const finalStatus = await syncService.getStatus();
    console.log('\n📊 Final Status:');
    console.log(`   Tokens in DB: ${finalStatus.tokens_count}`);
    console.log(`   Transfers in DB: ${finalStatus.transfers_count}`);
    console.log(`   Last Finalized Block: ${finalStatus.last_finalized_block}`);
    console.log(`   Head Block: ${finalStatus.head_block}`);
    console.log(`   Lag: ${finalStatus.lag} blocks`);
    console.log('');
    
    // Run verification
    console.log('🔍 Running final verification...');
    const verification = await syncService.verifySync(200);
    
    if (verification.passed) {
      console.log('✅ Sync completed successfully!');
      console.log(`   Total Tokens: ${verification.total_tokens_in_db}`);
      console.log(`   Total Transfers: ${verification.total_transfers_in_db}`);
      console.log(`   Sample Accuracy: ${(verification.tokens_matched / verification.tokens_checked * 100).toFixed(2)}%`);
    } else {
      console.log('❌ Verification failed:');
      console.log(`   Expected 10,000 tokens, got ${verification.total_tokens_in_db}`);
      console.log(`   Sample mismatches: ${verification.tokens_mismatched}`);
      
      if (verification.mismatches.length > 0) {
        console.log('   Mismatch details:');
        for (const mismatch of verification.mismatches.slice(0, 5)) {
          console.log(`     Token ${mismatch.token_id}: ${mismatch.field} mismatch`);
        }
        if (verification.mismatches.length > 5) {
          console.log(`     ... and ${verification.mismatches.length - 5} more`);
        }
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await syncService.cleanup();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
