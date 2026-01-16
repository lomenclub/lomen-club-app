// Script to force refresh blockchain data for all NFTs through the backend API
const API_BASE_URL = 'http://localhost:3002/api';

async function forceRefreshAllNFTs() {
  console.log('🔄 Forcing blockchain data refresh for all NFTs...\n');
  
  try {
    // First, get all NFTs to see how many we have
    const allNFTsResponse = await fetch(`${API_BASE_URL}/nfts?limit=1`);
    const allNFTsData = await allNFTsResponse.json();
    
    console.log(`📊 Total NFTs in database: ${allNFTsData.pagination.total}`);
    
    // Get a sample of NFTs to check their blockchain data
    const sampleResponse = await fetch(`${API_BASE_URL}/nfts?limit=50`);
    const sampleData = await sampleResponse.json();
    
    console.log(`🔍 Checking blockchain data status for sample NFTs...`);
    
    let withBlockchainData = 0;
    let withoutBlockchainData = 0;
    let ownedByKuSwap = 0;
    
    sampleData.nfts.forEach(nft => {
      if (nft.blockchainData) {
        withBlockchainData++;
        if (nft.blockchainData.owner === '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C') {
          ownedByKuSwap++;
        }
      } else {
        withoutBlockchainData++;
      }
    });
    
    console.log(`📊 Sample analysis:`);
    console.log(`   - With blockchain data: ${withBlockchainData}`);
    console.log(`   - Without blockchain data: ${withoutBlockchainData}`);
    console.log(`   - Owned by KuSwap: ${ownedByKuSwap}`);
    
    // The issue is that the blockchain enrichment service only updates NFTs that "need refresh"
    // But many NFTs don't have blockchain data at all or have stale data
    
    console.log('\n💡 Solution: We need to trigger blockchain data refresh for all NFTs');
    console.log('   This can be done by:');
    console.log('   1. Running the backend with blockchain data initialization');
    console.log('   2. Or manually triggering refresh through the API');
    
    // Let's try to trigger refresh by accessing NFTs that should be on sale
    console.log('\n🔄 Testing refresh for known KuSwap NFTs...');
    
    const knownKuSwapNFTs = [2318, 1067, 4637, 7564, 907];
    
    for (const tokenId of knownKuSwapNFTs) {
      console.log(`   Checking NFT #${tokenId}...`);
      try {
        const nftResponse = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
        if (nftResponse.ok) {
          const nftData = await nftResponse.json();
          console.log(`     - Owner: ${nftData.blockchainData?.owner || 'No blockchain data'}`);
        } else {
          console.log(`     - Not found or error`);
        }
      } catch (error) {
        console.log(`     - Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Check backend logs for blockchain data refresh messages');
    console.log('   2. The backend should automatically refresh stale data when NFTs are accessed');
    console.log('   3. If still not working, we may need to modify the refresh logic');
    
  } catch (error) {
    console.error('❌ Error during refresh:', error);
  }
}

// Run the refresh
forceRefreshAllNFTs();
