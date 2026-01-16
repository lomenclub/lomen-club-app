#!/usr/bin/env node

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Bulk updating NFTs with blockchain data');
  console.log('==========================================\n');
  
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(mongodbUri);
  await client.connect();
  const db = client.db('lomen-club');
  
  const tokensCollection = db.collection('tokens');
  const nftsCollection = db.collection('nfts');
  
  try {
    // Get all tokens
    console.log('📊 Fetching tokens...');
    const tokens = await tokensCollection.find().toArray();
    console.log(`📊 Found ${tokens.length} tokens`);
    
    // Create a map for quick lookup
    const tokenMap = new Map();
    tokens.forEach(token => {
      tokenMap.set(token.token_id, token);
    });
    
    // Get all NFTs
    console.log('📊 Fetching NFTs...');
    const nfts = await nftsCollection.find().toArray();
    console.log(`📊 Found ${nfts.length} NFTs`);
    
    // Prepare bulk operations
    console.log('🔄 Preparing bulk operations...');
    const bulkOperations = [];
    
    for (const nft of nfts) {
      const token = tokenMap.get(nft.tokenId);
      if (!token) {
        console.warn(`⚠️  Token ${nft.tokenId} not found in tokens collection`);
        continue;
      }
      
      bulkOperations.push({
        updateOne: {
          filter: { tokenId: nft.tokenId },
          update: {
            $set: {
              blockchainData: {
                owner: token.owner_address,
                ownerShort: formatWalletAddress(token.owner_address),
                isOwned: token.owner_address !== '0x0000000000000000000000000000000000000000',
                isOnSale: false,
                lastOwnerCheck: token.last_synced_at,
                lastSaleCheck: token.last_synced_at,
                network: 'KCC Mainnet'
              },
              updatedAt: new Date()
            }
          }
        }
      });
      
      // Process in batches of 1000
      if (bulkOperations.length >= 1000) {
        console.log(`🔄 Processing batch of ${bulkOperations.length} updates...`);
        await nftsCollection.bulkWrite(bulkOperations);
        bulkOperations.length = 0;
      }
    }
    
    // Process remaining operations
    if (bulkOperations.length > 0) {
      console.log(`🔄 Processing final batch of ${bulkOperations.length} updates...`);
      await nftsCollection.bulkWrite(bulkOperations);
    }
    
    console.log('✅ Bulk update completed!');
    
    // Verify
    const nftsWithBlockchainData = await nftsCollection.countDocuments({
      'blockchainData.owner': { $exists: true }
    });
    
    console.log(`\n📊 Verification:`);
    console.log(`   NFTs with blockchainData: ${nftsWithBlockchainData}`);
    console.log(`   Total NFTs: ${nfts.length}`);
    
    if (nftsWithBlockchainData === nfts.length) {
      console.log('✅ All NFTs now have blockchain data!');
    } else {
      console.warn(`⚠️  Only ${nftsWithBlockchainData}/${nfts.length} NFTs have blockchain data`);
    }
    
  } catch (error) {
    console.error('❌ Bulk update failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

function formatWalletAddress(address) {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return 'Not Owned';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Run main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
