import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nft.kuswap.finance/#/nfts/collections/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');
const TOTAL_IMAGES = 10000;
const BATCH_SIZE = 10; // Increased batch size for efficiency
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches
const START_TOKEN_ID = 3; // Start from token 3

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to extract metadata from the page
async function extractMetadataFromPage(page, tokenId) {
  const metadata = {
    tokenId: parseInt(tokenId),
    name: `Lomen Genesis #${tokenId}`,
    description: `Lomen Genesis NFT #${tokenId} from the Lomen Club collection`,
    image: `/images/nfts/${tokenId}.webp`,
    attributes: [],
    rarity: {}
  };

  try {
    // Wait for the page to load and for the properties to appear
    await page.waitForSelector('[class*="property"], [class*="Property"]', { timeout: 10000 });

    // Extract HEAD property
    const headElement = await page.$x('//div[contains(text(), "HEAD")]/following-sibling::div');
    if (headElement.length > 0) {
      const headValue = await page.evaluate(el => el.textContent, headElement[0]);
      metadata.attributes.push({
        trait_type: "HEAD",
        value: headValue.trim()
      });
    }

    // Extract HEADWEAR property
    const headwearElement = await page.$x('//div[contains(text(), "HEADWEAR")]/following-sibling::div');
    if (headwearElement.length > 0) {
      const headwearValue = await page.evaluate(el => el.textContent, headwearElement[0]);
      metadata.attributes.push({
        trait_type: "HEADWEAR",
        value: headwearValue.trim()
      });
    }

    // Extract CLOTHES property
    const clothesElement = await page.$x('//div[contains(text(), "CLOTHES")]/following-sibling::div');
    if (clothesElement.length > 0) {
      const clothesValue = await page.evaluate(el => el.textContent, clothesElement[0]);
      metadata.attributes.push({
        trait_type: "CLOTHES",
        value: clothesValue.trim()
      });
    }

    // Extract FACE property
    const faceElement = await page.$x('//div[contains(text(), "FACE")]/following-sibling::div');
    if (faceElement.length > 0) {
      const faceValue = await page.evaluate(el => el.textContent, faceElement[0]);
      metadata.attributes.push({
        trait_type: "FACE",
        value: faceValue.trim()
      });
    }

    // Extract Rarity Rank
    const rankElement = await page.$x('//div[contains(text(), "Rarity Rank")]/following-sibling::div');
    if (rankElement.length > 0) {
      const rankValue = await page.evaluate(el => el.textContent, rankElement[0]);
      metadata.rarity.rank = parseInt(rankValue.replace(/,/g, '').trim());
    }

    // Extract Rarity Score
    const scoreElement = await page.$x('//div[contains(text(), "Rarity Score")]/following-sibling::div');
    if (scoreElement.length > 0) {
      const scoreValue = await page.evaluate(el => el.textContent, scoreElement[0]);
      metadata.rarity.score = parseFloat(scoreValue.trim());
    }

  } catch (error) {
    console.log(`Error extracting metadata for token ${tokenId}:`, error.message);
  }

  return metadata;
}

async function fetchNFTMetadataWithBrowser(browser, tokenId) {
  const page = await browser.newPage();
  
  try {
    console.log(`Fetching metadata for token ${tokenId}...`);
    
    // Set a reasonable timeout
    await page.setDefaultTimeout(30000);
    
    // Navigate to the NFT page
    const url = `${BASE_URL}/${tokenId}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait a bit for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract metadata
    const metadata = await extractMetadataFromPage(page, tokenId);
    
    await page.close();
    return metadata;
    
  } catch (error) {
    console.log(`Error fetching metadata for token ${tokenId}:`, error.message);
    await page.close();
    return null;
  }
}

async function downloadBatchMetadataWithBrowser(browser, start, end) {
  console.log(`Fetching metadata batch ${start} to ${end}...`);
  const promises = [];
  
  for (let i = start; i <= end; i++) {
    promises.push(fetchNFTMetadataWithBrowser(browser, i));
  }
  
  const results = await Promise.all(promises);
  
  // Save successful metadata
  for (let i = 0; i < results.length; i++) {
    const tokenId = start + i;
    const metadata = results[i];
    
    if (metadata && (metadata.attributes.length > 0 || Object.keys(metadata.rarity).length > 0)) {
      const outputPath = path.join(OUTPUT_DIR, `${tokenId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
      console.log(`Saved metadata for token ${tokenId}`);
    } else if (metadata) {
      console.log(`No metadata found for token ${tokenId}`);
    }
  }
  
  console.log(`Completed metadata batch ${start} to ${end}`);
}

async function downloadAllMetadataWithBrowser() {
  console.log(`Starting metadata extraction for ${TOTAL_IMAGES} NFTs using Puppeteer...`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (let batchStart = START_TOKEN_ID; batchStart <= TOTAL_IMAGES; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TOTAL_IMAGES);
      await downloadBatchMetadataWithBrowser(browser, batchStart, batchEnd);
      
      // Add delay between batches to be respectful to the server
      if (batchEnd < TOTAL_IMAGES) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log('Metadata extraction completed!');
  } finally {
    await browser.close();
  }
}

// Run the metadata extraction
downloadAllMetadataWithBrowser().catch(console.error);
