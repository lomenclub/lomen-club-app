#!/usr/bin/env node

/**
 * Ultra-Conservative NFT Blockchain Data Refresh
 * 
 * This script refreshes blockchain data for all 10,000 NFTs very slowly
 * to avoid any rate limiting and ensure we have accurate owner data.
 * Designed to run for hours without issues.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002/api';
const BLOCKCHAIN_API_BASE_URL = 'http://localhost:3003/api';
const BATCH_SIZE = 1000; // Process only 5 NFTs per batch
const DELAY_BETWEEN_BATCHES = 60000; // 30 seconds between batches
const DELAY_BETWEEN_REQUESTS = 30000; // 5 seconds between individual NFT requests
const START_TOKEN_ID = 5000; // Start from NFT #1

class UltraConservativeNFTRefresher {
  constructor() {
    this.processed = 0;
    this.totalNFTs = 10000;
    this.startTime = null;
    this.onSaleCount = 0;
    this.failedNFTs = [];
  }

  async refreshNFTs() {
    console.log('🐌 Starting ULTRA-CONSERVATIVE NFT blockchain data refresh...');
    console.log(`📊 Target: ${this.totalNFTs} NFTs`);
    console.log(`⚙️  Batch size: ${BATCH_SIZE} NFTs`);
    console.log(`⏰ Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000} seconds`);
    console.log(`⏱️  Delay between requests: ${DELAY_BETWEEN_REQUESTS / 1000} seconds`);
    console.log(`⏳ Estimated time: ~${this.calculateEstimatedTime()} hours`);
    console.log('---');

    this.startTime = Date.now();

    // Process in very small batches to avoid overwhelming the system
    for (let startTokenId = START_TOKEN_ID; startTokenId <= this.totalNFTs; startTokenId += BATCH_SIZE) {
      const endTokenId = Math.min(startTokenId + BATCH_SIZE - 1, this.totalNFTs);
      await this.processBatch(startTokenId, endTokenId);
      
      // Calculate progress
      const progress = Math.min(endTokenId, this.totalNFTs);
      const percentage = ((progress / this.totalNFTs) * 100).toFixed(1);
      const elapsed = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
      const remaining = this.calculateRemainingTime(progress);
      
      console.log(`📈 Progress: ${progress}/${this.totalNFTs} (${percentage}%)`);
      console.log(`⏱️  Elapsed: ${elapsed} minutes | Remaining: ~${remaining} hours`);
      console.log(`🛍️  NFTs on Sale so far: ${this.onSaleCount}`);
      
      // Delay between batches (except for the last batch)
      if (endTokenId < this.totalNFTs) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }

    this.completeRefresh();
  }

  calculateEstimatedTime() {
    const totalRequests = this.totalNFTs;
    const timePerRequest = DELAY_BETWEEN_REQUESTS / 1000; // seconds
    const batchDelays = Math.ceil(this.totalNFTs / BATCH_SIZE) * (DELAY_BETWEEN_BATCHES / 1000);
    const totalSeconds = (totalRequests * timePerRequest) + batchDelays;
    return (totalSeconds / 3600).toFixed(1); // hours
  }

  calculateRemainingTime(progress) {
    const remainingNFTs = this.totalNFTs - progress;
    const timePerNFT = DELAY_BETWEEN_REQUESTS / 1000; // seconds
    const remainingBatches = Math.ceil(remainingNFTs / BATCH_SIZE);
    const batchDelays = remainingBatches * (DELAY_BETWEEN_BATCHES / 1000);
    const totalSeconds = (remainingNFTs * timePerNFT) + batchDelays;
    return (totalSeconds / 3600).toFixed(1); // hours
  }

  async processBatch(startTokenId, endTokenId) {
    console.log(`🔄 Processing batch: NFTs ${startTokenId}-${endTokenId}`);
    
    for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId++) {
      try {
        await this.refreshSingleNFT(tokenId);
        this.processed++;
        
        // Add delay between individual requests
        if (tokenId < endTokenId) {
          await this.delay(DELAY_BETWEEN_REQUESTS);
        }
        
      } catch (error) {
        console.error(`❌ Failed to refresh NFT ${tokenId}:`, error.message);
        this.failedNFTs.push(tokenId);
        
        // If we hit a rate limit, wait longer before continuing
        if (error.message.includes('429')) {
          console.log(`🚫 Rate limit hit, waiting 60 seconds before continuing...`);
          await this.delay(60000);
        }
      }
    }

    console.log(`✅ Batch ${startTokenId}-${endTokenId} completed`);
  }

  async refreshSingleNFT(tokenId) {
    try {
      // First, get the NFT to trigger blockchain data refresh
      const nftResponse = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
      
      if (!nftResponse.ok) {
        if (nftResponse.status === 429) {
          throw new Error(`HTTP 429: Too Many Requests`);
        }
        throw new Error(`HTTP ${nftResponse.status}: ${nftResponse.statusText}`);
      }
      
      const nft = await nftResponse.json();
      
      // Then get the owner data to ensure it's fresh
      const ownerResponse = await fetch(`${BLOCKCHAIN_API_BASE_URL}/nfts/${tokenId}/owner`);
      
      if (!ownerResponse.ok) {
        if (ownerResponse.status === 429) {
          throw new Error(`HTTP 429: Too Many Requests`);
        }
        throw new Error(`HTTP ${ownerResponse.status}: ${ownerResponse.statusText}`);
      }
      
      const ownerData = await ownerResponse.json();
      
      // Log progress for this NFT
      const isOnSale = ownerData.owner === '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
      if (isOnSale) {
        this.onSaleCount++;
      }
      const status = isOnSale ? '🏪 ON SALE' : '✅ Refreshed';
      
      console.log(`   ${status} NFT #${tokenId}: ${ownerData.ownerShort}`);
      
      return { tokenId, owner: ownerData.owner, isOnSale };
      
    } catch (error) {
      throw error;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  completeRefresh() {
    const totalTime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    const totalHours = (totalTime / 60).toFixed(1);
    
    console.log('\n🎉 NFT Blockchain Data Refresh Complete!');
    console.log('---');
    console.log(`📊 Total NFTs processed: ${this.processed}`);
    console.log(`🛍️  Total NFTs on Sale: ${this.onSaleCount}`);
    console.log(`❌ Failed NFTs: ${this.failedNFTs.length}`);
    console.log(`⏱️  Total time: ${totalTime} minutes (${totalHours} hours)`);
    console.log(`📈 Average rate: ${(this.processed / totalTime).toFixed(1)} NFTs/minute`);
    console.log('---');
    console.log('✅ All NFTs now have fresh blockchain data');
    console.log('🛍️  "On Sale" filter should now show accurate counts');
    
    if (this.failedNFTs.length > 0) {
      console.log(`❌ Failed NFTs to retry: ${this.failedNFTs.join(', ')}`);
    }
    
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
const refresher = new UltraConservativeNFTRefresher();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Refresh interrupted by user');
  console.log(`📊 Processed ${refresher.processed} NFTs so far`);
  console.log(`🛍️  NFTs on Sale: ${refresher.onSaleCount}`);
  console.log(`❌ Failed NFTs: ${refresher.failedNFTs.length}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Refresh terminated');
  console.log(`📊 Processed ${refresher.processed} NFTs so far`);
  console.log(`🛍️  NFTs on Sale: ${refresher.onSaleCount}`);
  console.log(`❌ Failed NFTs: ${refresher.failedNFTs.length}`);
  process.exit(0);
});

// Start the refresh process
refresher.refreshNFTs().catch(error => {
  console.error('❌ Fatal error during refresh:', error);
  process.exit(1);
});
