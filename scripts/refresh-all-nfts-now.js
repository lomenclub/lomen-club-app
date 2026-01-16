import { databaseEnrichmentService } from '../packages/database/src/enrichmentService.js';
import { databaseService } from '../packages/database/src/index.js';
import { blockchainEnrichmentService } from '../packages/blockchain/src/enrichmentService.js';

async function refreshAllNFTs() {
  console.log('🔄 Starting complete NFT blockchain data refresh...\n');
  
  try {
    // Get NFTs collection
    const nftsCollection = databaseService.getNFTsCollection();
    if (!nftsCollection) {
      throw new Error('NFTs collection not initialized');
    }
    
    // Get all NFTs
    const allNFTs = await nftsCollection.find({}).toArray();
    console.log(`📊 Found ${allNFTs.length} NFTs to refresh\n`);
    
    // Check which NFTs need refresh
    const nftsNeedingRefresh = blockchainEnrichmentService.getNFTsNeedingRefresh(allNFTs);
    console.log(`🔍 ${nftsNeedingRefresh.length} NFTs need blockchain data refresh\n`);
    
    if (nftsNeedingRefresh.length === 0) {
      console.log('✅ All NFTs already have fresh blockchain data');
      return;
    }
    
    // Process in batches
    const batchSize = 20;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < nftsNeedingRefresh.length; i += batchSize) {
      const batch = nftsNeedingRefresh.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(nftsNeedingRefresh.length / batchSize);
      
      console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (NFTs ${i + 1}-${Math.min(i + batchSize, nftsNeedingRefresh.length)})...`);
      
      try {
        await databaseEnrichmentService.enrichAndUpdateNFTs(batch);
        successful += batch.length;
        console.log(`   ✅ Successfully updated ${batch.length} NFTs`);
      } catch (error) {
        console.error(`   ❌ Failed to process batch:`, error.message);
        failed += batch.length;
      }
      
      processed += batch.length;
      
      // Progress update
      const percent = Math.round((processed / nftsNeedingRefresh.length) * 100);
      console.log(`   📊 Progress: ${processed}/${nftsNeedingRefresh.length} (${percent}%)\n`);
      
      // Rate limiting: wait 1 second between batches
      if (i + batchSize < nftsNeedingRefresh.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✅ Completed blockchain data refresh`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    
    // Get updated stats
    const stats = await databaseEnrichmentService.getNFTStats();
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total NFTs: ${stats.totalNFTs}`);
    console.log(`   On Sale Count: ${stats.onSaleCount}`);
    console.log(`   Last Updated: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error during refresh:', error);
  }
}

// Run the refresh
refreshAllNFTs().catch(console.error);
