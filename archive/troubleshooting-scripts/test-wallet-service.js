// Simple test script to verify the wallet service functionality
const API_BASE_URL = 'http://localhost:3002/api';

// KuSwap listing wallet address
const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';

async function testWalletService() {
  console.log('🧪 Testing Wallet Service...\n');
  
  try {
    // Test 1: Get token IDs for KuSwap wallet
    console.log('1. Testing token IDs endpoint...');
    const tokenIdsResponse = await fetch(`${API_BASE_URL}/wallets/${KUSWAP_LISTING_WALLET}/token-ids`);
    
    if (tokenIdsResponse.ok) {
      const tokenIdsData = await tokenIdsResponse.json();
      console.log(`✅ Success! Found ${tokenIdsData.total} NFTs owned by KuSwap wallet`);
      console.log(`   Token IDs: ${tokenIdsData.tokenIds.slice(0, 10).join(', ')}${tokenIdsData.total > 10 ? '...' : ''}`);
    } else {
      console.log(`❌ Failed to get token IDs: ${tokenIdsResponse.status} ${tokenIdsResponse.statusText}`);
    }
    
    console.log('\n2. Testing NFTs by wallet endpoint...');
    const nftsResponse = await fetch(`${API_BASE_URL}/wallets/${KUSWAP_LISTING_WALLET}/nfts`);
    
    if (nftsResponse.ok) {
      const nftsData = await nftsResponse.json();
      console.log(`✅ Success! Found ${nftsData.totalNFTs} NFTs with details`);
      console.log(`   Sample NFTs: ${nftsData.nfts.slice(0, 3).map(nft => `${nft.name} (#${nft.tokenId})`).join(', ')}`);
    } else {
      console.log(`❌ Failed to get NFTs: ${nftsResponse.status} ${nftsResponse.statusText}`);
    }
    
    console.log('\n3. Testing "On Sale" filter via NFTs endpoint...');
    const onSaleResponse = await fetch(`${API_BASE_URL}/nfts?onSale=true&limit=5`);
    
    if (onSaleResponse.ok) {
      const onSaleData = await onSaleResponse.json();
      console.log(`✅ Success! Found ${onSaleData.nfts.length} NFTs on sale`);
      console.log(`   On Sale NFTs: ${onSaleData.nfts.map(nft => `${nft.name} (#${nft.tokenId})`).join(', ')}`);
    } else {
      console.log(`❌ Failed to get on-sale NFTs: ${onSaleResponse.status} ${onSaleResponse.statusText}`);
    }
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
    console.log('💡 Make sure the backend server is running on http://localhost:3002');
  }
}

// Run the test
testWalletService();
