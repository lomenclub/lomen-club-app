// Script to find NFTs that don't have blockchain data
const API_BASE_URL = 'http://localhost:3002/api';

async function findMissingNFTs() {
  console.log('🔍 Finding NFTs without blockchain data...\n');
  
  const missingNFTs = [];
  const batchSize = 100;
  const totalNFTs = 10000;
  
  console.log(`📊 Checking all ${totalNFTs} NFTs in batches of ${batchSize}...\n`);
  
  for (let page = 1; page <= Math.ceil(totalNFTs / batchSize); page++) {
    try {
      const response = await fetch(`${API_BASE_URL}/nfts?page=${page}&limit=${batchSize}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check each NFT in this batch
        for (const nft of data.nfts) {
          if (!nft.blockchainData || !nft.blockchainData.owner) {
            missingNFTs.push(nft.tokenId);
            console.log(`❌ NFT #${nft.tokenId} - No blockchain data`);
          }
        }
        
        console.log(`✅ Checked page ${page}/${Math.ceil(totalNFTs / batchSize)} - Found ${missingNFTs.length} missing NFTs so far`);
        
      } else {
        console.log(`❌ Error fetching page ${page}: ${response.status}`);
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Network error on page ${page}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Final Results:`);
  console.log(`   - Total NFTs checked: ${totalNFTs}`);
  console.log(`   - NFTs without blockchain data: ${missingNFTs.length}`);
  console.log(`   - Missing token IDs: ${missingNFTs.join(', ')}`);
  
  if (missingNFTs.length > 0) {
    console.log(`\n💡 Analysis:`);
    console.log(`   - These ${missingNFTs.length} NFTs might be the ones that should be on KuSwap`);
    console.log(`   - They don't have blockchain data, so they're not showing up in any filters`);
    console.log(`   - We need to refresh their blockchain data to see who owns them`);
    
    console.log(`\n🔄 Refreshing blockchain data for missing NFTs...`);
    
    let refreshed = 0;
    for (const tokenId of missingNFTs) {
      try {
        const response = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
        if (response.ok) {
          refreshed++;
          console.log(`✅ Refreshed NFT #${tokenId}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`❌ Error refreshing NFT #${tokenId}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Refresh summary:`);
    console.log(`   - Successfully refreshed: ${refreshed} NFTs`);
    
    // Check "On Sale" filter after refresh
    console.log(`\n🔍 Checking "On Sale" filter after refresh...`);
    const onSaleResponse = await fetch(`${API_BASE_URL}/nfts?onSale=true&limit=5`);
    
    if (onSaleResponse.ok) {
      const onSaleData = await onSaleResponse.json();
      console.log(`🛍️  "On Sale" filter now returns: ${onSaleData.pagination.total} NFTs`);
    }
  }
}

// Run the search
findMissingNFTs();
