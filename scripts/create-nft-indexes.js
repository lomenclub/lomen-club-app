import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_DIR = path.join(__dirname, '../public/metadata/nfts');
const INDEX_DIR = path.join(__dirname, '../public/metadata/indexes');

// Ensure index directory exists
if (!fs.existsSync(INDEX_DIR)) {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
}

async function createIndexFiles() {
  console.log('Creating NFT index files...');
  
  const allNFTs = [];
  
  // Load all NFT metadata
  for (let i = 1; i <= 10000; i++) {
    try {
      const filePath = path.join(METADATA_DIR, `${i}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const nft = JSON.parse(data);
        allNFTs.push(nft);
      }
    } catch (error) {
      console.log(`Error loading NFT ${i}:`, error.message);
    }
    
    // Progress indicator
    if (i % 1000 === 0) {
      console.log(`Loaded ${i}/10000 NFTs...`);
    }
  }
  
  console.log(`Successfully loaded ${allNFTs.length} NFTs`);
  
  // Create index sorted by ID
  const sortedById = [...allNFTs].sort((a, b) => a.tokenId - b.tokenId);
  fs.writeFileSync(
    path.join(INDEX_DIR, 'sorted-by-id.json'),
    JSON.stringify(sortedById, null, 2)
  );
  console.log('Created index sorted by ID');
  
  // Create index sorted by rank (lowest first)
  const sortedByRank = [...allNFTs].sort((a, b) => a.rarity.rank - b.rarity.rank);
  fs.writeFileSync(
    path.join(INDEX_DIR, 'sorted-by-rank.json'),
    JSON.stringify(sortedByRank, null, 2)
  );
  console.log('Created index sorted by rank (lowest first)');
  
  // Create index sorted by rank (highest first)
  const sortedByRankDesc = [...allNFTs].sort((a, b) => b.rarity.rank - a.rarity.rank);
  fs.writeFileSync(
    path.join(INDEX_DIR, 'sorted-by-rank-desc.json'),
    JSON.stringify(sortedByRankDesc, null, 2)
  );
  console.log('Created index sorted by rank (highest first)');
  
  // Create a summary file with just essential data for faster loading
  const summary = allNFTs.map(nft => ({
    tokenId: nft.tokenId,
    name: nft.name,
    image: nft.image,
    rank: nft.rarity.rank,
    score: nft.rarity.score,
    attributes: nft.attributes
  }));
  
  fs.writeFileSync(
    path.join(INDEX_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('Created summary file');
  
  console.log('All index files created successfully!');
}

createIndexFiles().catch(console.error);
