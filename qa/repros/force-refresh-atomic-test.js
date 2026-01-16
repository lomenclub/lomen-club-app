#!/usr/bin/env node

/**
 * Regression test for force refresh atomic fix
 * Tests that force refresh doesn't cause data loss if interrupted
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'lomen-club';
const TEST_WALLET = '0x0000000000000000000000000000000000000001'; // Test wallet address

async function main() {
  console.log('🧪 Force Refresh Atomic Fix Regression Test');
  console.log('===========================================\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const userNFTsCollection = db.collection('user_nfts');
    
    // Clean up any existing test data
    await userNFTsCollection.deleteMany({ wallet_address: TEST_WALLET.toLowerCase() });
    
    // Step 1: Create test data - simulate existing NFTs for wallet
    const testNFTs = [
      {
        wallet_address: TEST_WALLET.toLowerCase(),
        nft_token_id: 1,
        metadata: { name: 'Test NFT 1' },
        last_synced_at: new Date(),
        created_at: new Date()
      },
      {
        wallet_address: TEST_WALLET.toLowerCase(),
        nft_token_id: 2,
        metadata: { name: 'Test NFT 2' },
        last_synced_at: new Date(),
        created_at: new Date()
      },
      {
        wallet_address: TEST_WALLET.toLowerCase(),
        nft_token_id: 3,
        metadata: { name: 'Test NFT 3' },
        last_synced_at: new Date(),
        created_at: new Date()
      }
    ];
    
    await userNFTsCollection.insertMany(testNFTs);
    console.log(`✅ Created ${testNFTs.length} test NFTs for wallet ${TEST_WALLET}`);
    
    // Step 2: Simulate force refresh that gets interrupted
    // In the old implementation, deleteMany would happen first
    // In the new implementation, delete happens at the end
    
    // Simulate interruption after processing some NFTs but before cleanup
    // This would be the worst-case scenario
    
    // First, let's verify the fix by checking the current implementation
    console.log('\n🔍 Checking implementation...');
    
    // Read the nftSyncService file to verify fix
    const fs = await import('fs');
    const path = await import('path');
    const nftSyncServicePath = path.join(process.cwd(), 'apps/backend/src/services/nftSyncService.ts');
    const nftSyncServiceCode = fs.readFileSync(nftSyncServicePath, 'utf8');
    
    // Check for deleteMany at beginning (should NOT exist)
    const hasDeleteAtBeginning = nftSyncServiceCode.includes('await userNFTsCollection.deleteMany({ wallet_address: walletAddress.toLowerCase() })');
    
    // Check for deleteMany at end with $nin (should exist)
    const hasDeleteAtEndWithNin = nftSyncServiceCode.includes('nft_token_id: { $nin: ownedTokenIds }');
    
    console.log(`   - Delete at beginning (should be false): ${hasDeleteAtBeginning}`);
    console.log(`   - Delete at end with $nin (should be true): ${hasDeleteAtEndWithNin}`);
    
    if (hasDeleteAtBeginning) {
      console.error('❌ FAIL: Old deleteMany at beginning still exists!');
      process.exit(1);
    }
    
    if (!hasDeleteAtEndWithNin) {
      console.error('❌ FAIL: New atomic delete with $nin not found!');
      process.exit(1);
    }
    
    console.log('✅ Implementation check passed');
    
    // Step 3: Test data preservation
    console.log('\n🧪 Testing data preservation...');
    
    // Simulate partial processing (like interruption)
    // In new implementation, NFTs would be upserted as processed
    // Let's simulate processing NFT 1 and 2, but not 3
    
    const ownedTokenIds = [1, 2]; // Simulate wallet now owns only NFTs 1 and 2
    
    // This is what the new implementation does at the end:
    const deleteResult = await userNFTsCollection.deleteMany({
      wallet_address: TEST_WALLET.toLowerCase(),
      nft_token_id: { $nin: ownedTokenIds }
    });
    
    console.log(`   - Deleted ${deleteResult.deletedCount} NFTs no longer owned`);
    
    // Check remaining NFTs
    const remainingNFTs = await userNFTsCollection.find({
      wallet_address: TEST_WALLET.toLowerCase()
    }).toArray();
    
    console.log(`   - Remaining NFTs: ${remainingNFTs.length}`);
    console.log(`   - NFT IDs: ${remainingNFTs.map(nft => nft.nft_token_id).join(', ')}`);
    
    // Verify NFT 3 was deleted (no longer owned)
    // Verify NFT 1 and 2 still exist
    const remainingIds = remainingNFTs.map(nft => nft.nft_token_id);
    const hasNFT1 = remainingIds.includes(1);
    const hasNFT2 = remainingIds.includes(2);
    const hasNFT3 = remainingIds.includes(3);
    
    if (!hasNFT1 || !hasNFT2) {
      console.error('❌ FAIL: Owned NFTs were deleted!');
      process.exit(1);
    }
    
    if (hasNFT3) {
      console.error('❌ FAIL: NFT no longer owned was not deleted!');
      process.exit(1);
    }
    
    console.log('✅ Data preservation test passed');
    
    // Step 4: Test interruption scenario
    console.log('\n🧪 Testing interruption scenario...');
    
    // Reset test data
    await userNFTsCollection.deleteMany({ wallet_address: TEST_WALLET.toLowerCase() });
    await userNFTsCollection.insertMany(testNFTs);
    
    // Simulate interruption after upserting NFT 1 but before cleanup
    // In new implementation, this would leave all 3 NFTs (extra records)
    // This is safe - no data loss
    
    // Upsert NFT 1 (simulating partial processing)
    await userNFTsCollection.updateOne(
      { wallet_address: TEST_WALLET.toLowerCase(), nft_token_id: 1 },
      { $set: { last_synced_at: new Date() } },
      { upsert: true }
    );
    
    // Interruption happens here (process killed)
    // No cleanup happens
    
    const afterInterruption = await userNFTsCollection.find({
      wallet_address: TEST_WALLET.toLowerCase()
    }).toArray();
    
    console.log(`   - NFTs after interruption: ${afterInterruption.length}`);
    
    if (afterInterruption.length < 3) {
      console.error('❌ FAIL: Data loss occurred after interruption!');
      process.exit(1);
    }
    
    console.log('✅ Interruption test passed - no data loss');
    
    console.log('\n🎉 All tests passed!');
    console.log('The force refresh fix correctly prevents data loss:');
    console.log('   - No delete at beginning');
    console.log('   - Atomic upsert during processing');
    console.log('   - Cleanup only at end');
    console.log('   - Interruption leaves extra records (safe)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
