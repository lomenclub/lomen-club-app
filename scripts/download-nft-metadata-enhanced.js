import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nft.kuswap.finance/#/nfts/collections/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');
const TOTAL_IMAGES = 10000;
const BATCH_SIZE = 5; // Smaller batch size for reliability
const DELAY_BETWEEN_BATCHES = 3000; // 3 second delay between batches
const START_TOKEN_ID = 3; // Start from token 3

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
    // Wait longer for the page to load
    await page.waitForSelector('body', { timeout: 15000 });
    
    // Get the page text content
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Extract data using text patterns
    const extractedData = await page.evaluate(() => {
      const data = {
        name: null,
        attributes: [],
        rarity: {}
      };
      
      // Look for name
      const nameElements = document.querySelectorAll('h1, h2, h3, [class*="name"], [class*="Name"]');
      for (const element of nameElements) {
        const text = element.textContent.trim();
        if (text.includes('Lomen #') || text.includes('Lomen Genesis')) {
          data.name = text;
          break;
        }
      }
      
      // Look for attributes/properties - try multiple patterns
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent.trim();
        
        // Look for Head attribute
        if (text.toLowerCase().includes('head') && !text.toLowerCase().includes('headwear')) {
          const headMatch = text.match(/head[:\s]*([^\n\r]+)/i);
          if (headMatch && headMatch[1]) {
            data.attributes.push({ trait_type: "Head", value: headMatch[1].trim() });
          }
        }
        
        // Look for Headwear attribute
        if (text.toLowerCase().includes('headwear')) {
          const headwearMatch = text.match(/headwear[:\s]*([^\n\r]+)/i);
          if (headwearMatch && headwearMatch[1]) {
            data.attributes.push({ trait_type: "Headwear", value: headwearMatch[1].trim() });
          }
        }
        
        // Look for Clothes attribute
        if (text.toLowerCase().includes('clothes')) {
          const clothesMatch = text.match(/clothes[:\s]*([^\n\r]+)/i);
          if (clothesMatch && clothesMatch[1]) {
            data.attributes.push({ trait_type: "Clothes", value: clothesMatch[1].trim() });
          }
        }
        
        // Look for Face attribute
        if (text.toLowerCase().includes('face')) {
          const faceMatch = text.match(/face[:\s]*([^\n\r]+)/i);
          if (faceMatch && faceMatch[1]) {
            data.attributes.push({ trait_type: "Face", value: faceMatch[1].trim() });
          }
        }
        
        // Look for Rarity Rank
        if (text.includes('Rarity Rank')) {
          const rankMatch = text.match(/Rarity Rank[:\s]*#?([\d,]+)/i);
          if (rankMatch && rankMatch[1]) {
            data.rarity.rank = parseInt(rankMatch[1].replace(/,/g, ''));
          }
        }
        
        // Look for Rarity Score
        if (text.includes('Rarity Score')) {
          const scoreMatch = text.match(/Rarity Score[:\s]*([\d.]+)/i);
          if (scoreMatch && scoreMatch[1]) {
            data.rarity.score = parseFloat(scoreMatch[1]);
          }
        }
      });
      
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
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
      console.log(`✅ Saved metadata for token ${tokenId}`);
    } else if (metadata) {
      console.log(`❌ No metadata found for token ${tokenId}`);
    }
  }
  
  console.log(`Completed metadata batch ${start} to ${end}`);
}

async function downloadAllMetadataWithBrowser() {
  console.log(`Starting enhanced metadata extraction for ${TOTAL_IMAGES} NFTs using Puppeteer...`);
  console.log(`Starting from token ${START_TOKEN_ID}`);
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
