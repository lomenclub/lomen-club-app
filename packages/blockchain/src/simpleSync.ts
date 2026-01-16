#!/usr/bin/env node

/* global process */
import { ethers } from 'ethers';
import { MongoClient } from 'mongodb';
import { TokenDocument } from '@lomen-club/shared';
import * as dotenv from 'dotenv';

dotenv.config();

// ERC-721 ABI for basic functionality
const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function totalSupply() public view returns (uint256)",
  "function name() public view returns (string)",
  "function symbol() public view returns (string)"
];

async function main() {
  console.log('🚀 Lomen NFT Simple Sync');
  console.log('=======================\n');
  
  // Configuration
  const rpcUrl = process.env.KCC_RPC_URL || 'https://rpc-mainnet.kcc.network';
  const contractAddress = process.env.LOMEN_NFT_CONTRACT || '0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
  const mongodbUri = process.env.MONGODB_URI;
  
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  console.log('📋 Configuration:');
  console.log(`   RPC URL: ${rpcUrl}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log('');
  
  // Initialize provider and contract
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
  
  // Connect to MongoDB
  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(mongodbUri);
  await client.connect();
  const db = client.db('lomen-club');
  const tokensCollection = db.collection<TokenDocument>('tokens');
  
  // Create indexes
  await tokensCollection.createIndex(
    { contract_address: 1, token_id: 1 },
    { unique: true, name: 'contract_token_unique' }
  );
  await tokensCollection.createIndex(
    { owner_address: 1 },
    { name: 'owner_address_index' }
  );
  
  console.log('✅ MongoDB connected and indexes created');
  
  try {
    // Get contract info
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    
    console.log(`📝 Contract: ${name} (${symbol})`);
    console.log(`📊 Total Supply: ${totalSupply.toString()}`);
    
    const totalTokens = Number(totalSupply);
    if (totalTokens !== 10000) {
      console.warn(`⚠️  Expected 10,000 tokens, but contract reports ${totalTokens}`);
    }
    
    // Check existing tokens
    const existingCount = await tokensCollection.countDocuments();
    console.log(`📊 Existing tokens in DB: ${existingCount}`);
    
    if (existingCount === totalTokens) {
      console.log('✅ Database already has all tokens');
      
      // Verify a sample
      await verifySample(tokensCollection, contract, 50);
      return;
    }
    
    // Fetch all tokens
    console.log(`🚀 Fetching ${totalTokens} tokens...`);
    
    const batchSize = 100; // Process in batches to avoid rate limits
    const updates: any[] = [];
    let processed = 0;
    
    for (let tokenId = 1; tokenId <= totalTokens; tokenId++) {
      try {
        // Fetch owner
        const owner = await contract.ownerOf(tokenId);
        
        // Fetch tokenURI if available
        let tokenURI = null;
        try {
          tokenURI = await contract.tokenURI(tokenId);
        } catch (error) {
          // tokenURI might not be supported or fail
        }
        
        const tokenDoc: TokenDocument = {
          contract_address: contractAddress,
          token_id: tokenId,
          owner_address: owner,
          token_uri: tokenURI,
          last_transfer_block: 0, // We don't know from simple sync
          last_transfer_tx_hash: '',
          last_transfer_log_index: 0,
          created_at: new Date(),
          updated_at: new Date(),
          last_synced_block: await provider.getBlockNumber(),
          last_synced_at: new Date()
        };
        
        updates.push({
          updateOne: {
            filter: { contract_address: contractAddress, token_id: tokenId },
            update: { $set: tokenDoc },
            upsert: true
          }
        });
        
        processed++;
        
        // Process batch
        if (updates.length >= batchSize || tokenId === totalTokens) {
          console.log(`🔄 Processing batch: tokens ${tokenId - updates.length + 1} to ${tokenId}...`);
          await tokensCollection.bulkWrite(updates);
          updates.length = 0; // Clear array
          
          // Progress update
          const percent = Math.round((processed / totalTokens) * 100);
          console.log(`📊 Progress: ${processed}/${totalTokens} (${percent}%)`);
        }
        
        // Small delay to avoid rate limiting
        if (tokenId % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Error fetching token ${tokenId}:`, error);
      }
    }
    
    console.log(`✅ Successfully synced ${processed} tokens`);
    
    // Final verification
    const finalCount = await tokensCollection.countDocuments();
    console.log(`📊 Final token count in DB: ${finalCount}`);
    
    if (finalCount === totalTokens) {
      console.log('✅ Success! Database has all tokens');
    } else {
      console.warn(`⚠️  Database has ${finalCount} tokens, expected ${totalTokens}`);
    }
    
    // Run sample verification
    await verifySample(tokensCollection, contract, 100);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

async function verifySample(
  tokensCollection: any,
  contract: ethers.Contract,
  sampleSize: number
): Promise<void> {
  console.log(`🔍 Verifying ${sampleSize} random tokens...`);
  
  const allTokens = await tokensCollection.find().toArray();
  const shuffled = [...allTokens].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, Math.min(sampleSize, allTokens.length));
  
  let matched = 0;
  let mismatched = 0;
  
  for (const token of sample) {
    try {
      const chainOwner = await contract.ownerOf(token.token_id);
      const dbOwner = token.owner_address;
      
      if (chainOwner.toLowerCase() === dbOwner.toLowerCase()) {
        matched++;
      } else {
        mismatched++;
        console.warn(`⚠️  Token ${token.token_id} mismatch: DB=${dbOwner}, Chain=${chainOwner}`);
      }
    } catch (error) {
      console.error(`❌ Error verifying token ${token.token_id}:`, error);
      mismatched++;
    }
  }
  
  const accuracy = (matched / sample.length) * 100;
  console.log(`📊 Verification results: ${matched} matched, ${mismatched} mismatched`);
  console.log(`📊 Accuracy: ${accuracy.toFixed(2)}%`);
  
  if (accuracy >= 99) {
    console.log('✅ Verification passed!');
  } else {
    console.warn('⚠️  Verification below 99% accuracy');
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
