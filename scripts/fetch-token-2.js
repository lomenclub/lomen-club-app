import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://nft.kuswap.finance/#/nfts/collections/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';
const OUTPUT_DIR = path.join(__dirname, '../public/metadata/nfts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchToken2Metadata() {
  console.log('Starting metadata extraction for token 2...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to token 2 page...');
    
    // Set a reasonable timeout
    await page.setDefaultTimeout(30000);
    
    // Navigate to the NFT page
    const url = `${BASE_URL}/2`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait a bit for the page to fully load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take a screenshot to debug what we're seeing
    await page.screenshot({ path: path.join(__dirname, 'token2-screenshot.png') });
    console.log('Screenshot saved to token2-screenshot.png');
    
    // Try to extract the name
    const name = await page.evaluate(() => {
      const nameElement = document.querySelector('h1, h2, [class*="name"], [class*="Name"]');
      return nameElement ? nameElement.textContent.trim() : null;
    });
    
    console.log('Name found:', name);
    
    // Try to extract description
    const description = await page.evaluate(() => {
      const descElement = document.querySelector('[class*="description"], [class*="Description"], p');
      return descElement ? descElement.textContent.trim() : null;
    });
    
    console.log('Description found:', description);
    
    // Try to find properties/attributes
    const attributes = await page.evaluate(() => {
      const props = [];
      // Look for property elements
      const propertyElements = document.querySelectorAll('[class*="property"], [class*="Property"], [class*="trait"], [class*="Trait"]');
      
      propertyElements.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes(':')) {
          const [traitType, value] = text.split(':').map(s => s.trim());
          if (traitType && value) {
            props.push({ trait_type: traitType, value: value });
          }
        }
      });
      
      return props;
    });
    
    console.log('Attributes found:', attributes);
    
    // Try to find rarity information
    const rarity = await page.evaluate(() => {
      const rarityInfo = {};
      const rarityElements = document.querySelectorAll('[class*="rarity"], [class*="Rarity"]');
      
      rarityElements.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('Rank')) {
          const rankMatch = text.match(/\d+/);
          if (rankMatch) {
            rarityInfo.rank = parseInt(rankMatch[0]);
          }
        }
        if (text.includes('Score')) {
          const scoreMatch = text.match(/\d+(\.\d+)?/);
          if (scoreMatch) {
            rarityInfo.score = parseFloat(scoreMatch[0]);
          }
        }
      });
      
      return rarityInfo;
    });
    
    console.log('Rarity found:', rarity);
    
    // Create metadata object
    const metadata = {
      tokenId: 2,
      name: name || "Lomen #2",
      description: description || "Lomen is the first randomly generated art NFTs on KCC issued by the KuCoin team, made up of 10,000 bots with different looks & unique features, and also is an important part of the KuCoin Metaverse. Lomen holders will have the chance to receive Trading Bot airdrop benefits and participate in the governance of the KuCoin Metaverse in the future. Users can get it by participating in the KuCoin Trading Bot anniversary activities. Don't miss your Lomen!",
      image: "/images/nfts/2.webp",
      attributes: attributes.length > 0 ? attributes : [
        { "trait_type": "Head", "value": "Unknown" },
        { "trait_type": "Headwear", "value": "Unknown" },
        { "trait_type": "Clothes", "value": "Unknown" },
        { "trait_type": "Face", "value": "Unknown" }
      ],
      rarity: Object.keys(rarity).length > 0 ? rarity : {
        rank: 0,
        score: 0
      }
    };
    
    // Save the metadata
    const outputPath = path.join(OUTPUT_DIR, '2.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata saved to ${outputPath}`);
    
    console.log('Final metadata:', JSON.stringify(metadata, null, 2));
    
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the metadata extraction
fetchToken2Metadata().catch(console.error);
