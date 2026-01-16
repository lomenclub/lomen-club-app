#!/usr/bin/env node

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Migrating token data to NFTs collection');
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
    const tokens = await tokensCollection.find().toArray();
    console.log(`📊 Found ${tokens.length} tokens in tokens collection`);
    
    // Get all NFTs
    const nfts = await nftsCollection.find().toArray();
    console.log(`📊 Found ${nfts.length} NFTs in nfts collection`);
    
    if (tokens.length !== nfts.length) {
      console.warn(`⚠️  Count mismatch: tokens=${tokens.length}, nfts=${nfts.length}`);
    }
    
    let updatedCount = 0;
    let missingCount = 0;
    
    // Update each NFT with blockchain data from tokens
    for (const token of tokens) {
      const nft = await nftsCollection.findOne({ tokenId: token.token_id });
      
      if (!nft) {
        console.warn(`⚠️  NFT with tokenId ${token.token_id} not found in nfts collection`);
        missingCount++;
        continue;
      }
      
      // Update blockchainData
      const updateResult = await nftsCollection.updateOne(
        { tokenId: token.token_id },
        {
          $set: {
            blockchainData: {
              owner: token.owner_address,
              ownerShort: formatWalletAddress(token.owner_address),
              isOwned: token.owner_address !== '0x0000000000000000000000000000000000000000',
              isOnSale: false, // Will be determined separately
              lastOwnerCheck: token.last_synced_at,
              lastSaleCheck: token.last_synced_at,
              network: 'KCC Mainnet'
            },
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        updatedCount++;
      }
      
      // Progress update
      if (updatedCount % 1000 === 0) {
        console.log(`🔄 Updated ${updatedCount} NFTs...`);
      }
    }
    
    console.log(`\n✅ Migration completed:`);
    console.log(`   Total tokens: ${tokens.length}`);
    console.log(`   Updated NFTs: ${updatedCount}`);
    console.log(`   Missing NFTs: ${missingCount}`);
    
    // Verify counts
    const nftsWithBlockchainData = await nftsCollection.countDocuments({
      'blockchainData.owner': { $exists: true }
    });
    
    console.log(`\n📊 Verification:`);
    console.log(`   NFTs with blockchainData: ${nftsWithBlockchainData}`);
    console.log(`   Expected: ${tokens.length}`);
    
    if (nftsWithBlockchainData === tokens.length) {
      console.log('✅ All NFTs now have blockchain data!');
    } else {
      console.warn(`⚠️  Only ${nftsWithBlockchainData}/${tokens.length} NFTs have blockchain data`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
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
