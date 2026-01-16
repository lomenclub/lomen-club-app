// Script to check alternative KuSwap wallet addresses
const API_BASE_URL = 'http://localhost:3002/api';

// Common marketplace wallet patterns
const POTENTIAL_WALLETS = [
  '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C', // Current KuSwap
  '0x0000000000000000000000000000000000000000', // Zero address
  '0x000000000000000000000000000000000000dead', // Burn address
  // Add other potential marketplace wallets here
];

async function checkAlternativeWallets() {
  console.log('🔍 Checking alternative marketplace wallet addresses...\n');
  
  let foundNFTs = 0;
  
  for (const wallet of POTENTIAL_WALLETS) {
    try {
      const response = await fetch(`${API_BASE_URL}/wallets/${wallet}/token-ids`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.total > 0) {
          console.log(`💰 Wallet ${wallet}:`);
          console.log(`   - NFTs: ${data.total}`);
          console.log(`   - Token IDs: ${data.tokenIds.slice(0, 10).join(', ')}${data.total > 10 ? '...' : ''}`);
          
          if (data.total > 12) {
            console.log(`   🎯 POTENTIAL MATCH: This wallet has ${data.total} NFTs!`);
          }
          
          foundNFTs += data.total;
        }
      }
    } catch (error) {
      // Ignore errors for invalid wallets
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Total NFTs found across all wallets: ${foundNFTs}`);
  
  if (foundNFTs <= 12) {
    console.log('\n💡 Analysis:');
    console.log('   ❌ Only found the same 12 NFTs we already knew about');
    console.log('   💡 This suggests:');
    console.log('      - The expected 239 NFTs might be listed through a different mechanism');
    console.log('      - NFTs might be listed through proxy contracts or escrow systems');
    console.log('      - The blockchain API might have limitations');
    console.log('      - We need to check KuSwap marketplace directly for listing data');
  }
}

// Run the check
checkAlternativeWallets();
