// Script to directly check blockchain ownership for specific NFTs
const API_BASE_URL = 'http://localhost:3002/api';

async function directBlockchainCheck() {
  console.log('🔍 Direct blockchain ownership check for specific NFTs...\n');
  
  // Test a range of NFTs that should be on KuSwap
  const testNFTs = [
    1, 2, 3, 4, 5, 10, 20, 30, 40, 50, // Early NFTs
    100, 200, 300, 400, 500, // Mid-range
    1000, 2000, 3000, 4000, 5000, // Higher range
    6000, 7000, 8000, 9000, 9999 // Late range
  ];
  
  const KUSWAP_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
  
  let ownedByKuSwap = 0;
  let notOwnedByKuSwap = 0;
  let errors = 0;
  
  for (const tokenId of testNFTs) {
    try {
      console.log(`🔍 Checking NFT #${tokenId}...`);
      
      const response = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
      
      if (response.ok) {
        const nftData = await response.json();
        
        if (nftData.blockchainData?.owner === KUSWAP_WALLET) {
          console.log(`   ✅ Owned by KuSwap`);
          ownedByKuSwap++;
        } else {
          console.log(`   ❌ Not owned by KuSwap (Owner: ${nftData.blockchainData?.owner || 'No data'})`);
          notOwnedByKuSwap++;
        }
      } else {
        console.log(`   ❌ API Error: ${response.status}`);
        errors++;
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Owned by KuSwap: ${ownedByKuSwap}`);
  console.log(`   - Not owned by KuSwap: ${notOwnedByKuSwap}`);
  console.log(`   - Errors: ${errors}`);
  
  console.log(`\n💡 Analysis:`);
  if (ownedByKuSwap === 0) {
    console.log('   ❌ No NFTs in the test sample are owned by KuSwap');
    console.log('   💡 This suggests either:');
    console.log('      - The blockchain API is not returning correct data');
    console.log('      - The KuSwap wallet address might be different');
    console.log('      - Very few NFTs are actually listed on KuSwap');
  } else if (ownedByKuSwap < 5) {
    console.log(`   ⚠️  Only ${ownedByKuSwap} NFTs in the sample are owned by KuSwap`);
    console.log('   💡 This might indicate that very few NFTs are actually listed');
  } else {
    console.log(`   ✅ ${ownedByKuSwap} NFTs in the sample are owned by KuSwap`);
    console.log('   💡 The issue might be with the refresh logic or query');
  }
  
  // Test the wallet service directly
  console.log(`\n🔍 Testing wallet service directly...`);
  try {
    const walletResponse = await fetch(`${API_BASE_URL}/wallets/${KUSWAP_WALLET}/token-ids`);
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log(`   Wallet service reports: ${walletData.total} NFTs owned by KuSwap`);
      console.log(`   Token IDs: ${walletData.tokenIds.slice(0, 10).join(', ')}${walletData.total > 10 ? '...' : ''}`);
    } else {
      console.log(`   ❌ Wallet service error: ${walletResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Wallet service error: ${error.message}`);
  }
}

// Run the check
directBlockchainCheck();
