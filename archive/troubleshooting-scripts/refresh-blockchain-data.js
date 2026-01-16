// Script to force refresh blockchain data for all NFTs
import { MongoClient } from 'mongodb';
import { blockchainEnrichmentService } from './packages/blockchain/src/enrichmentService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lomen-club';

async function refreshBlockchainData() {
  console.log('🔄 Forcing blockchain data refresh for all NFTs...\n');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const nftsCollection = db.collection('nfts');
    
    // Get all NFTs
    const allNFTs = await nftsCollection.find({}).toArray();
    console.log(`📊 Found ${allNFTs.length} NFTs to refresh`);
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 20;
    let processed = 0;
    
    for (let i = 0; i < allNFTs.length; i += batchSize) {
      const batch = allNFTs.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1} (NFTs ${i + 1}-${Math.min(i + batchSize, allNFTs.length)})...`);
      
      // Enrich NFTs with blockchain data
      const enrichedNFTs = await blockchainEnrichmentService.enrichNFTs(batch);
      
      // Update NFTs in database
      const updatePromises = enrichedNFTs.map(async (nft) => {
        try {
          await nftsCollection.updateOne(
            { tokenId: nft.tokenId },
            { 
              $set: { 
                blockchainData: nft.blockchainData,
                updatedAt: new Date()
              } 
            }
          );
          console.log(`✅ Updated blockchain data for NFT ${nft.tokenId}`);
          processed++;
        } catch (error) {
          console.error(`❌ Failed to update NFT ${nft.tokenId}:`, error);
        }
      });
      
      await Promise.allSettled(updatePromises);
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < allNFTs.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n✅ Completed blockchain data refresh for ${processed} NFTs`);
    
    // Verify the results
    const nftsWithBlockchainData = await nftsCollection.countDocuments({
      'blockchainData': { $exists: true }
    });
    console.log(`📊 NFTs with blockchain data after refresh: ${nftsWithBlockchainData}`);
    
    const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
    const nftsOwnedByKuSwap = await nftsCollection.countDocuments({
      'blockchainData.owner': { 
        $regex: new RegExp(KUSWAP_LISTING_WALLET, 'i') 
      }
    });
    console.log(`📊 NFTs owned by KuSwap wallet after refresh: ${nftsOwnedByKuSwap}`);
    
  } catch (error) {
    console.error('❌ Error during blockchain data refresh:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the refresh
refreshBlockchainData();
