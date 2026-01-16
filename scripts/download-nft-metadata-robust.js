import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nft.kuswap.finance/#/nfts/collections/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');
const TOTAL_IMAGES = 10000;
const START_TOKEN_ID = 3086; // Start from token 3086
const DELAY_BETWEEN_REQUESTS = 2000; // 2 second delay between requests
const MAX_RETRIES = 3;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check which tokens already exist
function getExistingTokens() {
  const files = fs.readdirSync(OUTPUT_DIR);
  const existingTokens = new Set();
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const tokenId = parseInt(file.replace('.json', ''));
      if (!isNaN(tokenId)) {
        existingTokens.add(tokenId);
      }
    }
  });
  
  return existingTokens;
}

async function extractMetadataFromPage(page, tokenId) {
  const metadata = {
    tokenId: parseInt(tokenId),
    name: `Lomen #${tokenId}`,
    description: "Lomen is the first randomly generated art NFTs on KCC issued by the KuCoin team, made up of 10,000 bots with different looks & unique features, and also is an important part of the KuCoin Metaverse. Lomen holders will have the chance to receive Trading Bot airdrop benefits and participate in the governance of the KuCoin Metaverse in the future. Users can get it by participating in the KuCoin Trading Bot anniversary activities. Don't miss your Lomen!",
    image: `/images/nfts/${tokenId}.webp`,
    attributes: [],
    rarity: {}
  };

  try {
    // Wait for the page to load
    await page.waitForSelector('body', { timeout: 15000 });
    
    // Get the entire page text
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Extract data using text patterns
    const extractedData = await page.evaluate(() => {
      const data = {
        name: null,
        attributes: [],
        rarity: {}
      };
      
      // Look for name in various elements
      const nameSelectors = [
        'h1', 'h2', 'h3', 
        '[class*="name"]', '[class*="Name"]',
        '[class*="title"]', '[class*="Title"]'
      ];
      
      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          const text = element.textContent.trim();
          if (text.includes('Lomen #') || text.includes('Lomen Genesis')) {
            data.name = text;
            break;
          }
        }
      }
      
      // Look for all text content that might contain attributes
      const allText = document.body.innerText;
      
      // Extract Head attribute
      const headMatch = allText.match(/head[:\s]*([^\n\r]+)/i);
      if (headMatch && headMatch[1] && !headMatch[1].toLowerCase().includes('headwear')) {
        data.attributes.push({ trait_type: "Head", value: headMatch[1].trim() });
      }
      
      // Extract Headwear attribute
      const headwearMatch = allText.match(/headwear[:\s]*([^\n\r]+)/i);
      if (headwearMatch && headwearMatch[1]) {
        data.attributes.push({ trait_type: "Headwear", value: headwearMatch[1].trim() });
      }
      
      // Extract Clothes attribute
      const clothesMatch = allText.match(/clothes[:\s]*([^\n\r]+)/i);
      if (clothesMatch && clothesMatch[1]) {
        data.attributes.push({ trait_type: "Clothes", value: clothesMatch[1].trim() });
      }
      
      // Extract Face attribute
      const faceMatch = allText.match(/face[:\s]*([^\n\r]+)/i);
      if (faceMatch && faceMatch[1]) {
        data.attributes.push({ trait_type: "Face", value: faceMatch[1].trim() });
      }
      
      // Extract Rarity Rank
      const rankMatch = allText.match(/Rarity Rank[:\s]*#?([\d,]+)/i);
      if (rankMatch && rankMatch[1]) {
        data.rarity.rank = parseInt(rankMatch[1].replace(/,/g, ''));
      }
      
      // Extract Rarity Score
      const scoreMatch = allText.match(/Rarity Score[:\s]*([\d.]+)/i);
      if (scoreMatch && scoreMatch[1]) {
        data.rarity.score = parseFloat(scoreMatch[1]);
      }
      
      return data;
    });
    
    // Update metadata with extracted data
    if (extractedData.name) {
      metadata.name = extractedData.name;
    }
    
    if (extractedData.attributes.length > 0) {
      metadata.attributes = extractedData.attributes;
    }
    
    if (Object.keys(extractedData.rarity).length > 0) {
      metadata.rarity = extractedData.rarity;
    }
    
    console.log(`Extracted for token ${tokenId}:`, {
      attributes: metadata.attributes.length,
      rarity: metadata.rarity
    });
    
  } catch (error) {
    console.log(`Error extracting metadata for token ${tokenId}:`, error.message);
  }
  
  return metadata;
}

async function fetchNFTMetadataWithRetry(browser, tokenId) {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    const page = await browser.newPage();
    
    try {
      console.log(`Fetching metadata for token ${tokenId} (attempt ${retries + 1})...`);
      
      // Set a reasonable timeout
      await page.setDefaultTimeout(30000);
      
      // Navigate to the NFT page
      const url = `${BASE_URL}/${tokenId}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait a bit for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Extract metadata
      const metadata = await extractMetadataFromPage(page, tokenId);
      
      await page.close();
      return metadata;
      
    } catch (error) {
      console.log(`Attempt ${retries + 1} failed for token ${tokenId}:`, error.message);
      await page.close();
      retries++;
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying token ${tokenId} in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log(`Failed to fetch metadata for token ${tokenId} after ${MAX_RETRIES} attempts`);
  return null;
}

async function downloadAllMetadataWithBrowser() {
  console.log(`Starting robust metadata extraction for ${TOTAL_IMAGES} NFTs using Puppeteer...`);
  console.log(`Starting from token ${START_TOKEN_ID}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // Get existing tokens to avoid re-downloading
  const existingTokens = getExistingTokens();
  console.log(`Found ${existingTokens.size} existing metadata files`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (let tokenId = START_TOKEN_ID; tokenId <= TOTAL_IMAGES; tokenId++) {
      // Skip if already exists
      if (existingTokens.has(tokenId)) {
        console.log(`Skipping token ${tokenId} - already exists`);
        continue;
      }
      
      const metadata = await fetchNFTMetadataWithRetry(browser, tokenId);
      
      if (metadata && (metadata.attributes.length > 0 || Object.keys(metadata.rarity).length > 0)) {
        const outputPath = path.join(OUTPUT_DIR, `${tokenId}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
        console.log(`✅ Saved metadata for token ${tokenId}`);
        successCount++;
      } else {
        console.log(`❌ No metadata found for token ${tokenId}`);
        failCount++;
      }
      
      // Progress update every 100 tokens
      if (tokenId % 100 === 0) {
        console.log(`Progress: ${tokenId}/${TOTAL_IMAGES} (${successCount} success, ${failCount} fail)`);
      }
      
      // Add delay between requests to be respectful to the server
      if (tokenId < TOTAL_IMAGES) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    console.log(`Metadata extraction completed!`);
    console.log(`Success: ${successCount}, Failed: ${failCount}, Total: ${successCount + failCount}`);
    
  } finally {
    await browser.close();
  }
}

// Run the metadata extraction
downloadAllMetadataWithBrowser().catch(console.error);
