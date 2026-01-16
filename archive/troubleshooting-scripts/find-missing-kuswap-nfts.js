// Script to find NFTs that should be on KuSwap but aren't showing up
const API_BASE_URL = 'http://localhost:3002/api';

async function findMissingKuSwapNFTs() {
  console.log('🔍 Searching for missing KuSwap NFTs...\n');
  
  // Known KuSwap NFTs that should be found
  const expectedKuSwapNFTs = [
    // Add known token IDs that should be on KuSwap
    2318, 1067, 4637, 7564, 907, 8, 90, 2579, // These we already found
    // Add more known token IDs that should be on KuSwap
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
    1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
    5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500
  ];
  
  const KUSWAP_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
  
  let found = [];
  let notFound = [];
  let errors = [];
  
  console.log(`🔍 Checking ${expectedKuSwapNFTs.length} potential KuSwap NFTs...\n`);
  
  for (const tokenId of expectedKuSwapNFTs) {
    try {
      const response = await fetch(`${API_BASE_URL}/nfts/${tokenId}`);
      
      if (response.ok) {
        const nftData = await response.json();
        
        if (nftData.blockchainData?.owner === KUSWAP_WALLET) {
          console.log(`✅ NFT #${tokenId} - Owned by KuSwap`);
          found.push(tokenId);
        } else {
          console.log(`❌ NFT #${tokenId} - Not owned by KuSwap (Owner: ${nftData.blockchainData?.owner || 'No data'})`);
          notFound.push(tokenId);
        }
      } else {
        console.log(`❌ NFT #${tokenId} - API Error: ${response.status}`);
        errors.push(tokenId);
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`❌ NFT #${tokenId} - Network Error: ${error.message}`);
      errors.push(tokenId);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Found ${found.length} NFTs owned by KuSwap`);
  console.log(`   - ${notFound.length} NFTs not owned by KuSwap`);
  console.log(`   - ${errors.length} Errors`);
  
  console.log(`\n🔍 Found NFTs: ${found.join(', ')}`);
  console.log(`🔍 Not Found NFTs: ${notFound.slice(0, 20).join(', ')}${notFound.length > 20 ? '...' : ''}`);
  
  console.log(`\n💡 Analysis:`);
  if (found.length <= 8) {
    console.log('   ❌ Only found the same 8 NFTs we already knew about');
    console.log('   💡 This suggests:');
    console.log('      - The KuSwap wallet address might be different');
    console.log('      - NFTs might be listed through a proxy contract');
    console.log('      - The expected 239 number might be from a different source');
  } else {
    console.log(`   ✅ Found ${found.length} NFTs owned by KuSwap`);
    console.log('   💡 This means we need to update our database with the correct ownership data');
  }
  
  // Check if there's a different KuSwap wallet address
  console.log(`\n🔍 Checking for alternative KuSwap wallet addresses...`);
  
  // Common marketplace wallet patterns
  const potentialWallets = [
    '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C', // Current one
    '0x0000000000000000000000000000000000000000', // Zero address (unlikely)
    // Add other potential marketplace wallet addresses
  ];
  
  for (const wallet of potentialWallets) {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets/${wallet}/token-ids`);
      if (response.ok) {
        const data = await response.json();
        if (data.total > 0) {
          console.log(`   🔍 Wallet ${wallet}: ${data.total} NFTs`);
          if (data.total > 8) {
            console.log(`   🎯 FOUND POTENTIAL WALLET: ${wallet} has ${data.total} NFTs!`);
          }
        }
      }
    } catch (error) {
      // Ignore errors for invalid wallets
    }
  }
}

// Run the search
findMissingKuSwapNFTs();
