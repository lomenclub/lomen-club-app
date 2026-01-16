// Script to diagnose the "On Sale" filter issue
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lomen-club';
const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';

async function diagnoseOnSaleIssue() {
  console.log('🔍 Diagnosing "On Sale" filter issue...\n');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const nftsCollection = db.collection('nfts');
    
    // Get total NFTs count
    const totalNFTs = await nftsCollection.countDocuments();
    console.log(`📊 Total NFTs in database: ${totalNFTs}`);
    
    // Get NFTs with blockchain data
    const nftsWithBlockchainData = await nftsCollection.countDocuments({
      'blockchainData': { $exists: true }
    });
    console.log(`📊 NFTs with blockchain data: ${nftsWithBlockchainData}`);
    
    // Get NFTs without blockchain data
    const nftsWithoutBlockchainData = await nftsCollection.countDocuments({
      'blockchainData': { $exists: false }
    });
    console.log(`📊 NFTs without blockchain data: ${nftsWithoutBlockchainData}`);
    
    // Get NFTs owned by KuSwap wallet
    const nftsOwnedByKuSwap = await nftsCollection.countDocuments({
      'blockchainData.owner': { 
        $regex: new RegExp(KUSWAP_LISTING_WALLET, 'i') 
      }
    });
    console.log(`📊 NFTs owned by KuSwap wallet: ${nftsOwnedByKuSwap}`);
    
    // Get sample of NFTs owned by KuSwap
    const sampleKuSwapNFTs = await nftsCollection
      .find({
        'blockchainData.owner': { 
          $regex: new RegExp(KUSWAP_LISTING_WALLET, 'i') 
        }
      })
      .limit(10)
      .toArray();
    
    console.log(`\n🔍 Sample NFTs owned by KuSwap:`);
    sampleKuSwapNFTs.forEach(nft => {
      console.log(`   - NFT #${nft.tokenId}: ${nft.name} (Owner: ${nft.blockchainData?.owner})`);
    });
    
    // Check if there are any NFTs with isOnSale flag
    const nftsWithIsOnSaleFlag = await nftsCollection.countDocuments({
      'blockchainData.isOnSale': true
    });
    console.log(`\n📊 NFTs with isOnSale=true: ${nftsWithIsOnSaleFlag}`);
    
    // Get sample of NFTs with isOnSale flag
    const sampleIsOnSaleNFTs = await nftsCollection
      .find({
        'blockchainData.isOnSale': true
      })
      .limit(10)
      .toArray();
    
    console.log(`\n🔍 Sample NFTs with isOnSale=true:`);
    sampleIsOnSaleNFTs.forEach(nft => {
      console.log(`   - NFT #${nft.tokenId}: ${nft.name} (Owner: ${nft.blockchainData?.owner})`);
    });
    
    console.log('\n💡 Analysis:');
    if (nftsOwnedByKuSwap === 0) {
      console.log('   ❌ No NFTs are currently owned by the KuSwap wallet');
      console.log('   💡 This means either:');
      console.log('      - Blockchain data needs to be refreshed');
      console.log('      - No NFTs are currently listed on KuSwap');
      console.log('      - The KuSwap wallet address might be different');
    } else if (nftsOwnedByKuSwap < 10) {
      console.log(`   ⚠️  Only ${nftsOwnedByKuSwap} NFTs are owned by KuSwap`);
      console.log('   💡 This might be normal if few NFTs are currently listed');
    } else {
      console.log(`   ✅ ${nftsOwnedByKuSwap} NFTs are owned by KuSwap`);
    }
    
    if (nftsWithoutBlockchainData > 0) {
      console.log(`   ⚠️  ${nftsWithoutBlockchainData} NFTs are missing blockchain data`);
      console.log('   💡 Run blockchain data initialization to fix this');
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the diagnosis
diagnoseOnSaleIssue();
