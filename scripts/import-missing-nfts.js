import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importMissingNFTs() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const database = client.db('lomen-club');
    const nftsCollection = database.collection('nfts');
    
    // Get all token IDs from MongoDB
    const dbTokens = await nftsCollection.find({}, { projection: { tokenId: 1 } }).toArray();
    const dbTokenIds = new Set(dbTokens.map(doc => doc.tokenId));
    
    console.log(`Current NFTs in MongoDB: ${dbTokenIds.size}`);
    
    // Check metadata directory
    const nftsDir = path.join(__dirname, '../apps/frontend/public/metadata/nfts');
    const files = fs.readdirSync(nftsDir).filter(file => file.endsWith('.json'));
    
    console.log(`Total metadata files: ${files.length}`);
    
    // Find missing token IDs
    const missingTokenIds = [];
    for (let i = 1; i <= 10000; i++) {
      if (!dbTokenIds.has(i)) {
        missingTokenIds.push(i);
      }
    }
    
    if (missingTokenIds.length === 0) {
      console.log('✅ All 10,000 NFTs are already in MongoDB!');
      return;
    }
    
    console.log(`\nFound ${missingTokenIds.length} missing NFTs to import`);
    
    // Import missing NFTs
    let imported = 0;
    let failed = 0;
    
    for (const tokenId of missingTokenIds) {
      const metadataPath = path.join(nftsDir, `${tokenId}.json`);
      
      if (!fs.existsSync(metadataPath)) {
        console.log(`❌ Metadata file not found for token ${tokenId}`);
        failed++;
        continue;
      }
      
      try {
        const nftData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Add MongoDB _id field and timestamps
        const nftDocument = {
          _id: nftData.tokenId,
          ...nftData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await nftsCollection.insertOne(nftDocument);
        console.log(`✅ Imported NFT ${tokenId}`);
        imported++;
        
      } catch (error) {
        console.error(`❌ Failed to import NFT ${tokenId}:`, error.message);
        failed++;
      }
      
      // Progress update
      if ((imported + failed) % 100 === 0) {
        console.log(`Progress: ${imported + failed}/${missingTokenIds.length}`);
      }
    }
    
    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total in MongoDB now: ${dbTokenIds.size + imported}`);
    
    // Create indexes if needed
    if (imported > 0) {
      console.log('\nCreating indexes...');
      await nftsCollection.createIndex({ tokenId: 1 });
      await nftsCollection.createIndex({ 'rarity.rank': 1 });
      await nftsCollection.createIndex({ 'rarity.score': 1 });
      await nftsCollection.createIndex({ 'attributes.trait_type': 1, 'attributes.value': 1 });
      console.log('Indexes created successfully!');
    }
    
  } catch (error) {
    console.error('Error importing missing NFTs:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the import
importMissingNFTs().catch(console.error);
