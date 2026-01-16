// Simple script to check missing NFTs and "On Sale" filter
const API_BASE_URL = 'http://localhost:3002/api';

async function checkMissingNFTs() {
  console.log('🔍 Checking for missing NFTs and "On Sale" filter...\n');
  
  // Check stats first
  console.log('📊 Checking overall stats...');
  const statsResponse = await fetch(`${API_BASE_URL}/nfts/stats`);
  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    console.log(`📈 Total NFTs: ${statsData.totalNFTs}`);
    console.log(`🛍️  NFTs on sale: ${statsData.onSaleCount}`);
  }
  
  // Check "On Sale" filter
  console.log('\n🔍 Checking "On Sale" filter...');
  const onSaleResponse = await fetch(`${API_BASE_URL}/nfts?onSale=true&limit=5`);
  if (onSaleResponse.ok) {
    const onSaleData = await onSaleResponse.json();
    console.log(`🛍️  "On Sale" filter returns: ${onSaleData.pagination.total} NFTs`);
    
    if (onSaleData.pagination.total > 0) {
      console.log(`📋 Sample NFTs on sale: ${onSaleData.nfts.slice(0, 5).map(nft => `#${nft.tokenId}`).join(', ')}`);
    }
  }
  
  // Check a few specific NFTs to see if they have blockchain data
  console.log('\n🔍 Checking specific NFTs for blockchain data...');
  const testNFTs = [7549, 8229, 6598, 8, 90, 907, 1067, 2318, 2579, 4637, 6000, 7564];
  
  for (const tokenId of testNFTs) {
    try {
      const response = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
      if (response.ok) {
        const nftData = await response.json();
        const hasBlockchainData = nftData.blockchainData && nftData.blockchainData.owner;
        console.log(`NFT #${tokenId}: ${hasBlockchainData ? '✅ Has blockchain data' : '❌ No blockchain data'}`);
        
        if (hasBlockchainData) {
          console.log(`   Owner: ${nftData.blockchainData.owner}`);
        }
      }
    } catch (error) {
      console.log(`NFT #${tokenId}: ❌ Error fetching`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Check if we can find the missing 12 NFTs
  console.log('\n🔍 Looking for NFTs without blockchain data...');
  const missingResponse = await fetch(`${API_BASE_URL}/nfts?page=1&limit=20`);
  if (missingResponse.ok) {
    const missingData = await missingResponse.json();
    
    const missingNFTs = missingData.nfts.filter(nft => !nft.blockchainData || !nft.blockchainData.owner);
    
    if (missingNFTs.length > 0) {
      console.log(`❌ Found ${missingNFTs.length} NFTs without blockchain data in first 20:`);
      console.log(`   Token IDs: ${missingNFTs.map(nft => nft.tokenId).join(', ')}`);
    } else {
      console.log('✅ All NFTs in first 20 have blockchain data');
    }
  }
}

// Run the check
checkMissingNFTs();
