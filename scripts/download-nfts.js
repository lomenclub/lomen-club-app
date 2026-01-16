import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://mrkt.kuswap.finance/static/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/images/nfts');
const TOTAL_IMAGES = 10000;
const BATCH_SIZE = 100; // Download in batches to avoid overwhelming the server
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadImage(imageNumber) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${imageNumber}.webp`;
    const outputPath = path.join(OUTPUT_DIR, `${imageNumber}.webp`);
    
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Image ${imageNumber} already exists, skipping...`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded image ${imageNumber}`);
          resolve();
        });
      } else {
        file.close();
        fs.unlink(outputPath, () => {}); // Delete empty file
        console.log(`Failed to download image ${imageNumber}: HTTP ${response.statusCode}`);
        resolve(); // Resolve anyway to continue with other downloads
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {}); // Delete empty file
      console.log(`Error downloading image ${imageNumber}: ${err.message}`);
      resolve(); // Resolve anyway to continue with other downloads
    });
  });
}

async function downloadBatch(start, end) {
  console.log(`Downloading batch ${start} to ${end}...`);
  const promises = [];
  
  for (let i = start; i <= end; i++) {
    promises.push(downloadImage(i));
  }
  
  await Promise.all(promises);
  console.log(`Completed batch ${start} to ${end}`);
}

async function downloadAllImages() {
  console.log(`Starting download of ${TOTAL_IMAGES} NFT images...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  for (let batchStart = 1; batchStart <= TOTAL_IMAGES; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TOTAL_IMAGES);
    await downloadBatch(batchStart, batchEnd);
    
    // Add delay between batches to be respectful to the server
    if (batchEnd < TOTAL_IMAGES) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('Download completed!');
}

// Run the download
downloadAllImages().catch(console.error);
