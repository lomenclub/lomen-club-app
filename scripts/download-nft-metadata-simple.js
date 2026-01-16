import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');
const TOTAL_IMAGES = 10000;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sample metadata structure based on the NFT properties
// This is a placeholder - in a real scenario, we'd need to get this data from an API or database
function generateSampleMetadata(tokenId) {
  // These are example values - in reality, we'd need the actual data from KUSwap
  const headOptions = ['DarkGray', 'LightGray', 'Brown', 'Black', 'White', 'Red', 'Blue', 'Green'];
  const headwearOptions = ['Green Plant', 'Blue Cap', 'Red Hat', 'Yellow Helmet', 'None', 'Crown', 'Beanie'];
  const clothesOptions = ['White Scarf', 'Black Jacket', 'Red Shirt', 'Blue Hoodie', 'Green Vest', 'Purple Robe'];
  const faceOptions = ['Black Grimace', 'Smile', 'Frown', 'Wink', 'Surprised', 'Angry', 'Happy'];
  
  const metadata = {
    tokenId: parseInt(tokenId),
    name: `Lomen Genesis #${tokenId}`,
    description: `Lomen Genesis NFT #${tokenId} from the Lomen Club collection`,
    image: `/images/nfts/${tokenId}.webp`,
    attributes: [
      {
        trait_type: "HEAD",
        value: headOptions[tokenId % headOptions.length]
      },
      {
        trait_type: "HEADWEAR",
        value: headwearOptions[tokenId % headwearOptions.length]
      },
      {
        trait_type: "CLOTHES",
        value: clothesOptions[tokenId % clothesOptions.length]
      },
      {
        trait_type: "FACE",
        value: faceOptions[tokenId % faceOptions.length]
      }
    ],
    rarity: {
      rank: Math.floor(Math.random() * 10000) + 1,
      score: parseFloat((Math.random() * 200 + 50).toFixed(2))
    }
  };

  return metadata;
}

async function generateAllMetadata() {
  console.log(`Generating metadata for ${TOTAL_IMAGES} NFTs...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  for (let tokenId = 1; tokenId <= TOTAL_IMAGES; tokenId++) {
    const metadata = generateSampleMetadata(tokenId);
    const outputPath = path.join(OUTPUT_DIR, `${tokenId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    if (tokenId % 1000 === 0) {
      console.log(`Generated metadata for ${tokenId} NFTs...`);
    }
  }

  console.log('Metadata generation completed!');
  console.log('NOTE: This is sample metadata. For real metadata, we would need access to the KUSwap API or database.');
}

// Run the metadata generation
generateAllMetadata().catch(console.error);
