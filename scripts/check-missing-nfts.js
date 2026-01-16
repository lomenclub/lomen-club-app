import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkMissingNFTs() {
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
    
    console.log(`Total NFTs in MongoDB: ${dbTokenIds.size}`);
    
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
    
    console.log(`\nMissing NFTs in MongoDB: ${missingTokenIds.length}`);
    if (missingTokenIds.length > 0) {
      console.log('First 20 missing token IDs:', missingTokenIds.slice(0, 20));
      if (missingTokenIds.length > 20) {
        console.log(`... and ${missingTokenIds.length - 20} more`);
      }
      
      // Check if metadata files exist for missing tokens
      const missingWithMetadata = [];
      const missingWithoutMetadata = [];
      
      for (const tokenId of missingTokenIds) {
        const metadataPath = path.join(nftsDir, `${tokenId}.json`);
        if (fs.existsSync(metadataPath)) {
          missingWithMetadata.push(tokenId);
        } else {
          missingWithoutMetadata.push(tokenId);
        }
      }
      
      console.log(`\nMissing NFTs with metadata files: ${missingWithMetadata.length}`);
      console.log(`Missing NFTs without metadata files: ${missingWithoutMetadata.length}`);
      
      if (missingWithMetadata.length > 0) {
        console.log('\nTo fix missing NFTs, run:');
        console.log('npm run migrate:nfts');
        console.log('\nOr manually import missing NFTs with:');
        console.log('node scripts/import-missing-nfts.js');
      }
    } else {
      console.log('✅ All 10,000 NFTs are in MongoDB!');
    }
    
  } catch (error) {
    console.error('Error checking missing NFTs:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the check
checkMissingNFTs().catch(console.error);
