import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blockchain service configuration
const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3003';

async function migrateWalletNFTsToMongoDB(walletAddress) {
  // Validate wallet address
  if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    throw new Error('Invalid wallet address. Must be a valid 0x-prefixed Ethereum address (42 characters)');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log(`🚀 Starting migration for wallet: ${walletAddress}`);
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const database = client.db('lomen-club');
    const nftsCollection = database.collection('nfts');
    
    // Step 1: Get wallet info and NFT count from blockchain service
    console.log('🔍 Fetching wallet NFT information...');
    const walletInfo = await getWalletInfo(walletAddress);
    
    if (!walletInfo) {
      console.log('❌ Failed to fetch wallet information from blockchain service');
      console.log('⚠️  Blockchain service may not be running or configured');
      return;
    }
    
    console.log(`📊 Wallet Info:`);
    console.log(`   Address: ${walletInfo.wallet}`);
    console.log(`   Total NFTs: ${walletInfo.totalNFTs}`);
    console.log(`   Network: ${walletInfo.network}`);
    
    if (walletInfo.totalNFTs === 0) {
      console.log('❌ Wallet has no NFTs. Migration aborted.');
      return;
    }
    
    // Step 2: Since blockchain service doesn't return individual NFT IDs,
    // we need to scan a reasonable range to find owned NFTs
    console.log(`\n🔍 Scanning for NFTs owned by wallet...`);
    const ownedNFTs = await findOwnedNFTs(walletAddress, walletInfo.totalNFTs);
    
    if (ownedNFTs.length === 0) {
      console.log('❌ No NFTs found for this wallet address. Migration aborted.');
      return;
    }
    
    console.log(`✅ Found ${ownedNFTs.length} NFTs owned by wallet`);
    
    // Step 3: Load NFT metadata for owned NFTs
    console.log(`\n📚 Loading NFT metadata for owned NFTs...`);
    const walletNFTs = [];
    
    for (const ownedNFT of ownedNFTs) {
      try {
        const nftData = await loadNFTMetadata(ownedNFT.tokenId);
        if (nftData) {
          // Add MongoDB _id field for better indexing
          walletNFTs.push({
            _id: nftData.tokenId,
            ...nftData,
            owner: walletAddress,
            ownerShort: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
            isOwned: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error(`Error processing NFT ${ownedNFT.tokenId}:`, error.message);
      }
    }
    
    console.log(`✅ Loaded metadata for ${walletNFTs.length} NFTs`);
    
    if (walletNFTs.length === 0) {
      console.log('❌ No NFT metadata found for owned NFTs. Migration aborted.');
      return;
    }
    
    // Step 4: Update or insert NFTs in MongoDB
    console.log(`\n💾 Importing ${walletNFTs.length} NFTs to MongoDB...`);
    
    // Update or insert NFTs in batches
    const batchSize = 50;
    for (let i = 0; i < walletNFTs.length; i += batchSize) {
      const batch = walletNFTs.slice(i, i + batchSize);
      
      const bulkOps = batch.map(nft => ({
        updateOne: {
          filter: { _id: nft._id },
          update: { $set: nft },
          upsert: true
        }
      }));
      
      await nftsCollection.bulkWrite(bulkOps);
      console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(walletNFTs.length / batchSize)}`);
    }
    
    // Create indexes for optimal query performance (if they don't exist)
    console.log('Ensuring indexes exist...');
    await nftsCollection.createIndex({ _id: 1 });
    await nftsCollection.createIndex({ owner: 1 });
    await nftsCollection.createIndex({ 'rarity.rank': 1 });
    await nftsCollection.createIndex({ 'rarity.score': 1 });
    await nftsCollection.createIndex({ 'attributes.trait_type': 1, 'attributes.value': 1 });
    
    console.log('Indexes created/verified successfully!');
    console.log(`✅ Successfully imported ${walletNFTs.length} NFTs owned by ${walletAddress} to MongoDB!`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

/**
 * Get wallet info and NFT count from blockchain service
 */
async function getWalletInfo(walletAddress) {
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/wallets/${walletAddress}/nfts`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet info: ${response.statusText}`);
    }
    
    const walletData = await response.json();
    return walletData;
  } catch (error) {
    console.error('Error fetching wallet info:', error.message);
    return null;
  }
}

/**
 * Find NFTs owned by wallet by checking individual NFTs
 * This is a fallback since the blockchain service doesn't return individual NFT IDs
 */
async function findOwnedNFTs(walletAddress, expectedCount) {
  const ownedNFTs = [];
  
  // Scan a reasonable range to find owned NFTs
  // We'll scan from 1 to 1000, which should cover most cases
  const scanRange = 1000;
  console.log(`Scanning NFTs 1-${scanRange} for ownership...`);
  
  for (let tokenId = 1; tokenId <= scanRange; tokenId++) {
    try {
      const owner = await getNFTOwner(tokenId);
      if (owner && owner.owner.toLowerCase() === walletAddress.toLowerCase()) {
        ownedNFTs.push({ tokenId, owner: owner.owner });
        console.log(`Found NFT #${tokenId} owned by wallet`);
        
        // If we found the expected number, we can stop early
        if (ownedNFTs.length >= expectedCount) {
          console.log(`Found all ${expectedCount} expected NFTs, stopping scan`);
          break;
        }
      }
    } catch (error) {
      // NFT might not exist or have issues, continue scanning
      if (tokenId % 100 === 0) {
        console.log(`Scanned ${tokenId} NFTs... Found ${ownedNFTs.length} so far`);
      }
    }
  }
  
  return ownedNFTs;
}

/**
 * Get NFT owner from blockchain service
 */
async function getNFTOwner(tokenId) {
  try {
    const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/api/nfts/${tokenId}/owner`);
    
    if (!response.ok) {
      // NFT might not exist, return null
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch NFT owner: ${response.statusText}`);
    }
    
    const ownerData = await response.json();
    return ownerData;
  } catch (error) {
    console.error(`Error fetching owner for NFT ${tokenId}:`, error.message);
    return null;
  }
}

/**
 * Load NFT metadata from local files
 */
async function loadNFTMetadata(tokenId) {
  try {
    const nftsDir = path.join(__dirname, '../apps/frontend/public/metadata/nfts');
    const filePath = path.join(nftsDir, `${tokenId}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`NFT metadata file not found for token ${tokenId}`);
      return null;
    }
    
    const nftData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return nftData;
  } catch (error) {
    console.error(`Error loading NFT metadata for token ${tokenId}:`, error.message);
    return null;
  }
}

// Main execution
async function main() {
  const walletAddress = process.argv[2];
  
  if (!walletAddress) {
    console.error('❌ Usage: node migrate-wallet-nfts-to-mongodb.js <wallet-address>');
    console.error('Example: node migrate-wallet-nfts-to-mongodb.js 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }
  
  try {
    await migrateWalletNFTsToMongoDB(walletAddress);
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
