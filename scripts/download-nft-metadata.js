import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nft.kuswap.finance/#/nfts/collections/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');
const TOTAL_IMAGES = 10000;
const BATCH_SIZE = 10; // Smaller batch size for API requests
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches to be respectful

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to extract metadata from HTML content
function extractMetadataFromHTML(html, tokenId) {
  const metadata = {
    tokenId: parseInt(tokenId),
    name: `Lomen Genesis #${tokenId}`,
    description: `Lomen Genesis NFT #${tokenId} from the Lomen Club collection`,
    image: `/images/nfts/${tokenId}.webp`,
    attributes: [],
    rarity: {}
  };

  try {
    // Extract HEAD property
    const headMatch = html.match(/HEAD<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (headMatch) {
      metadata.attributes.push({
        trait_type: "HEAD",
        value: headMatch[1].trim()
      });
    }

    // Extract HEADWEAR property
    const headwearMatch = html.match(/HEADWEAR<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (headwearMatch) {
      metadata.attributes.push({
        trait_type: "HEADWEAR",
        value: headwearMatch[1].trim()
      });
    }

    // Extract CLOTHES property
    const clothesMatch = html.match(/CLOTHES<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (clothesMatch) {
      metadata.attributes.push({
        trait_type: "CLOTHES",
        value: clothesMatch[1].trim()
      });
    }

    // Extract FACE property
    const faceMatch = html.match(/FACE<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (faceMatch) {
      metadata.attributes.push({
        trait_type: "FACE",
        value: faceMatch[1].trim()
      });
    }

    // Extract Rarity Rank
    const rankMatch = html.match(/Rarity Rank<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (rankMatch) {
      metadata.rarity.rank = parseInt(rankMatch[1].replace(/,/g, '').trim());
    }

    // Extract Rarity Score
    const scoreMatch = html.match(/Rarity Score<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (scoreMatch) {
      metadata.rarity.score = parseFloat(scoreMatch[1].trim());
    }

  } catch (error) {
    console.log(`Error parsing metadata for token ${tokenId}:`, error.message);
  }

  return metadata;
}

function fetchNFTMetadata(tokenId) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${tokenId}`;
    
    console.log(`Fetching metadata for token ${tokenId}...`);
    
    https.get(url, (response) => {
      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          const metadata = extractMetadataFromHTML(html, tokenId);
          resolve(metadata);
        } else {
          console.log(`Failed to fetch metadata for token ${tokenId}: HTTP ${response.statusCode}`);
          resolve(null);
        }
      });
    }).on('error', (err) => {
      console.log(`Error fetching metadata for token ${tokenId}: ${err.message}`);
      resolve(null);
    });
  });
}

async function downloadBatchMetadata(start, end) {
  console.log(`Fetching metadata batch ${start} to ${end}...`);
  const promises = [];
  
  for (let i = start; i <= end; i++) {
    promises.push(fetchNFTMetadata(i));
  }
  
  const results = await Promise.all(promises);
  
  // Save successful metadata
  for (let i = 0; i < results.length; i++) {
    const tokenId = start + i;
    const metadata = results[i];
    
    if (metadata) {
      const outputPath = path.join(OUTPUT_DIR, `${tokenId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
      console.log(`Saved metadata for token ${tokenId}`);
    }
  }
  
  console.log(`Completed metadata batch ${start} to ${end}`);
}

async function downloadAllMetadata() {
  console.log(`Starting metadata extraction for ${TOTAL_IMAGES} NFTs...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  for (let batchStart = 1; batchStart <= TOTAL_IMAGES; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TOTAL_IMAGES);
    await downloadBatchMetadata(batchStart, batchEnd);
    
    // Add delay between batches to be respectful to the server
    if (batchEnd < TOTAL_IMAGES) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('Metadata extraction completed!');
}

// Run the metadata extraction
downloadAllMetadata().catch(console.error);
