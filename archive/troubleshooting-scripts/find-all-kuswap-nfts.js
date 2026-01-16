// Script to find ALL NFTs owned by KuSwap wallet using blockchain API directly
const API_BASE_URL = 'http://localhost:3002/api';

async function findAllKuSwapNFTs() {
  console.log('🔍 Finding ALL NFTs owned by KuSwap wallet...\n');
  
  const KUSWAP_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
  
  try {
    // First, check how many NFTs the wallet service reports
    console.log('📊 Checking wallet service for KuSwap NFTs...');
    const walletResponse = await fetch(`${API_BASE_URL}/wallets/${KUSWAP_WALLET}/token-ids`);
    
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log(`💰 Wallet service reports: ${walletData.total} NFTs owned by KuSwap`);
      console.log(`🔢 Token IDs: ${walletData.tokenIds.slice(0, 20).join(', ')}${walletData.total > 20 ? '...' : ''}`);
      
      if (walletData.total > 0) {
        console.log(`\n🔄 Updating database with ${walletData.total} KuSwap NFTs...`);
        
        // Update each NFT in the database
        let updated = 0;
        let errors = 0;
        
        for (const tokenId of walletData.tokenIds) {
          try {
            // Access the NFT to trigger blockchain data refresh
            const nftResponse = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
            if (nftResponse.ok) {
              const nftData = await nftResponse.json();
              if (nftData.blockchainData?.owner === KUSWAP_WALLET) {
                updated++;
                console.log(`✅ Updated NFT #${tokenId}`);
              }
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.log(`❌ Error updating NFT #${tokenId}: ${error.message}`);
            errors++;
          }
        }
        
        console.log(`\n📊 Update summary:`);
        console.log(`   - Successfully updated: ${updated} NFTs`);
        console.log(`   - Errors: ${errors}`);
      }
    } else {
      console.log(`❌ Wallet service error: ${walletResponse.status}`);
    }
    
    // Now check the "On Sale" filter to see how many we have
    console.log(`\n🔍 Checking "On Sale" filter after update...`);
    const onSaleResponse = await fetch(`${API_BASE_URL}/nfts?onSale=true&limit=5`);
    
    if (onSaleResponse.ok) {
      const onSaleData = await onSaleResponse.json();
      console.log(`🛍️  "On Sale" filter now returns: ${onSaleData.pagination.total} NFTs`);
      
      if (onSaleData.pagination.total > 0) {
        console.log(`📋 Sample NFTs on sale: ${onSaleData.nfts.slice(0, 10).map(nft => `#${nft.tokenId}`).join(', ')}`);
      }
    }
    
    // Check stats
    console.log(`\n📊 Checking overall stats...`);
    const statsResponse = await fetch(`${API_BASE_URL}/nfts/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(`📈 Total NFTs: ${statsData.totalNFTs}`);
      console.log(`🛍️  NFTs on sale: ${statsData.onSaleCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error during search:', error);
  }
}

// Run the search
findAllKuSwapNFTs();
