import { nftSyncService } from './apps/backend/src/services/nftSyncService.js';

async function testNFTSync() {
  const walletAddress = '0xc53196fa79bec11f7cc5c6c7358d960989545314';
  
  console.log(`🧪 Testing NFT sync for wallet: ${walletAddress}`);
  
  try {
    const result = await nftSyncService.syncWalletNFTs(walletAddress);
    console.log('✅ NFT Sync Result:', result);
    
    console.log('\n📊 Summary:');
    console.log(`   - Blockchain reports: ${result.totalNFTs} NFTs`);
    console.log(`   - Database has: ${result.nftsFound} NFTs`);
    console.log(`   - NFTs updated: ${result.nftsUpdated}`);
    console.log(`   - Discrepancy: ${result.totalNFTs - result.nftsFound} NFTs missing from database`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('❌ NFT sync failed:', error);
  }
}

testNFTSync();
