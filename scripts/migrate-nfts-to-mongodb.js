import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateNFTsToMongoDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const database = client.db('lomen-club');
    const nftsCollection = database.collection('nfts');
    
    // Clear existing NFTs (optional - remove this if you want to keep existing data)
    console.log('Clearing existing NFT data...');
    await nftsCollection.deleteMany({});
    console.log('Existing NFT data cleared.');
    
    const nftsDir = path.join(__dirname, '../apps/frontend/public/metadata/nfts');
    const files = fs.readdirSync(nftsDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} NFT metadata files to import...`);
    
    const nfts = [];
    let processed = 0;
    
    // Read all NFT files
    for (const file of files) {
      try {
        const filePath = path.join(nftsDir, file);
        const nftData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Add MongoDB _id field for better indexing
        nfts.push({
          _id: nftData.tokenId,
          ...nftData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        processed++;
        if (processed % 1000 === 0) {
          console.log(`Processed ${processed} NFTs...`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message);
      }
    }
    
    console.log(`Importing ${nfts.length} NFTs to MongoDB...`);
    
    // Insert all NFTs in batches to avoid overwhelming MongoDB
    const batchSize = 100;
    for (let i = 0; i < nfts.length; i += batchSize) {
      const batch = nfts.slice(i, i + batchSize);
      await nftsCollection.insertMany(batch);
      console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(nfts.length / batchSize)}`);
    }
    
    // Create indexes for optimal query performance
    console.log('Creating indexes...');
    await nftsCollection.createIndex({ tokenId: 1 });
    await nftsCollection.createIndex({ 'rarity.rank': 1 });
    await nftsCollection.createIndex({ 'rarity.score': 1 });
    await nftsCollection.createIndex({ 'attributes.trait_type': 1, 'attributes.value': 1 });
    
    console.log('Indexes created successfully!');
    console.log(`✅ Successfully imported ${nfts.length} NFTs to MongoDB!`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the migration
migrateNFTsToMongoDB().catch(console.error);
