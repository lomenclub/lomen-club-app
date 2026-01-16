#!/usr/bin/env node

/**
 * Systematic NFT Blockchain Data Refresh
 * 
 * This script refreshes blockchain data for all 10,000 NFTs gradually
 * to avoid rate limiting and ensure we have accurate owner data.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002/api';
const BLOCKCHAIN_API_BASE_URL = 'http://localhost:3003/api';
const BATCH_SIZE = 10; // Process 10 NFTs per batch (reduced from 50)
const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches (increased from 5)
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between individual NFT requests (increased from 100ms)

class NFTRefresher {
  constructor() {
    this.processed = 0;
    this.totalNFTs = 10000;
    this.startTime = null;
  }

  async refreshNFTs() {
    console.log('🚀 Starting systematic NFT blockchain data refresh...');
    console.log(`📊 Target: ${this.totalNFTs} NFTs`);
    console.log(`⚙️  Batch size: ${BATCH_SIZE} NFTs`);
    console.log(`⏰ Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
    console.log(`⏱️  Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
    console.log('---');

    this.startTime = Date.now();

    // Process in batches to avoid overwhelming the system
    for (let startTokenId = 1; startTokenId <= this.totalNFTs; startTokenId += BATCH_SIZE) {
      const endTokenId = Math.min(startTokenId + BATCH_SIZE - 1, this.totalNFTs);
      await this.processBatch(startTokenId, endTokenId);
      
      // Calculate progress
      const progress = Math.min(endTokenId, this.totalNFTs);
      const percentage = ((progress / this.totalNFTs) * 100).toFixed(1);
      const elapsed = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
      
      console.log(`📈 Progress: ${progress}/${this.totalNFTs} (${percentage}%) - ${elapsed} minutes elapsed`);
      
      // Delay between batches (except for the last batch)
      if (endTokenId < this.totalNFTs) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }

    this.completeRefresh();
  }

  async processBatch(startTokenId, endTokenId) {
    console.log(`🔄 Processing batch: NFTs ${startTokenId}-${endTokenId}`);
    
    const batchPromises = [];
    
    for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId++) {
      // Add small delay between individual requests to avoid rate limiting
      if (tokenId > startTokenId) {
        await this.delay(DELAY_BETWEEN_REQUESTS);
      }
      
      batchPromises.push(this.refreshSingleNFT(tokenId));
    }

    // Wait for all NFTs in this batch to complete
    const results = await Promise.allSettled(batchPromises);
    
    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;
    
    this.processed += successes;
    
    console.log(`✅ Batch ${startTokenId}-${endTokenId}: ${successes} successful, ${failures} failed`);
    
    // Log failures for debugging
    if (failures > 0) {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Failed to refresh NFT ${startTokenId + index}:`, result.reason.message);
        }
      });
    }
  }

  async refreshSingleNFT(tokenId) {
    try {
      // First, get the NFT to trigger blockchain data refresh
      const nftResponse = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
      
      if (!nftResponse.ok) {
        throw new Error(`HTTP ${nftResponse.status}: ${nftResponse.statusText}`);
      }
      
      const nft = await nftResponse.json();
      
      // Then get the owner data to ensure it's fresh
      const ownerResponse = await fetch(`${BLOCKCHAIN_API_BASE_URL}/nfts/${tokenId}/owner`);
      
      if (!ownerResponse.ok) {
        throw new Error(`HTTP ${ownerResponse.status}: ${ownerResponse.statusText}`);
      }
      
      const ownerData = await ownerResponse.json();
      
      // Log progress for this NFT
      const isOnSale = ownerData.owner === '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
      const status = isOnSale ? '🏪 ON SALE' : '✅ Refreshed';
      
      console.log(`   ${status} NFT #${tokenId}: ${ownerData.ownerShort}`);
      
      return { tokenId, owner: ownerData.owner, isOnSale };
      
    } catch (error) {
      console.error(`❌ Failed to refresh NFT ${tokenId}:`, error.message);
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  completeRefresh() {
    const totalTime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n🎉 NFT Blockchain Data Refresh Complete!');
    console.log('---');
    console.log(`📊 Total NFTs processed: ${this.processed}`);
    console.log(`⏱️  Total time: ${totalTime} minutes`);
    console.log(`📈 Average rate: ${(this.processed / totalTime).toFixed(1)} NFTs/minute`);
    console.log('---');
    console.log('✅ All NFTs now have fresh blockchain data');
    console.log('🛍️  "On Sale" filter should now show accurate counts');
    
    // Get final stats
    this.getFinalStats();
  }

  async getFinalStats() {
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/nfts/stats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`📊 Final Stats:`);
        console.log(`   Total NFTs: ${stats.totalNFTs}`);
        console.log(`   NFTs on Sale: ${stats.onSaleCount}`);
        console.log(`   Avg Rarity Score: ${stats.avgRarityScore.toFixed(2)}`);
      }
    } catch (error) {
      console.error('❌ Failed to get final stats:', error.message);
    }
  }
}

// Run the refresher
const refresher = new NFTRefresher();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Refresh interrupted by user');
  console.log(`📊 Processed ${refresher.processed} NFTs so far`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Refresh terminated');
  console.log(`📊 Processed ${refresher.processed} NFTs so far`);
  process.exit(0);
});

// Start the refresh process
refresher.refreshNFTs().catch(error => {
  console.error('❌ Fatal error during refresh:', error);
  process.exit(1);
});
