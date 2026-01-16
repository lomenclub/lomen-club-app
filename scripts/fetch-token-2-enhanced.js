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
  console.log('Starting enhanced metadata extraction for token 2...');
  
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
    
    // Get the page HTML to understand the structure
    const htmlContent = await page.content();
    fs.writeFileSync(path.join(__dirname, 'token2-page.html'), htmlContent);
    console.log('Page HTML saved to token2-page.html');
    
    // Try multiple approaches to extract data
    console.log('Attempting to extract data using multiple methods...');
    
    // Method 1: Look for specific data patterns in the entire page
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page text sample:', pageText.substring(0, 500));
    
    // Method 2: Look for specific property patterns
    const extractedData = await page.evaluate(() => {
      const data = {
        name: null,
        description: null,
        attributes: [],
        rarity: {}
      };
      
      // Try to find name in various elements
      const nameSelectors = [
        'h1', 'h2', 'h3', 
        '[class*="name"]', '[class*="Name"]',
        '[class*="title"]', '[class*="Title"]',
        '.nft-name', '.token-name'
      ];
      
      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          data.name = element.textContent.trim();
          break;
        }
      }
      
      // Try to find description
      const descSelectors = [
        '[class*="description"]', '[class*="Description"]',
        '[class*="desc"]', '[class*="Desc"]',
        'p', '.nft-description'
      ];
      
      for (const selector of descSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim() && element.textContent.length > 50) {
          data.description = element.textContent.trim();
          break;
        }
      }
      
      // Look for attributes/properties - try multiple patterns
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent.trim();
        
        // Look for Head attribute
        if (text.includes('Head') && !text.includes('Headwear')) {
          const headMatch = text.match(/Head[:\s]*([^\n\r]+)/i);
          if (headMatch && headMatch[1]) {
            data.attributes.push({ trait_type: "Head", value: headMatch[1].trim() });
          }
        }
        
        // Look for Headwear attribute
        if (text.includes('Headwear')) {
          const headwearMatch = text.match(/Headwear[:\s]*([^\n\r]+)/i);
          if (headwearMatch && headwearMatch[1]) {
            data.attributes.push({ trait_type: "Headwear", value: headwearMatch[1].trim() });
          }
        }
        
        // Look for Clothes attribute
        if (text.includes('Clothes')) {
          const clothesMatch = text.match(/Clothes[:\s]*([^\n\r]+)/i);
          if (clothesMatch && clothesMatch[1]) {
            data.attributes.push({ trait_type: "Clothes", value: clothesMatch[1].trim() });
          }
        }
        
        // Look for Face attribute
        if (text.includes('Face')) {
          const faceMatch = text.match(/Face[:\s]*([^\n\r]+)/i);
          if (faceMatch && faceMatch[1]) {
            data.attributes.push({ trait_type: "Face", value: faceMatch[1].trim() });
          }
        }
        
        // Look for Rarity Rank
        if (text.includes('Rarity Rank')) {
          const rankMatch = text.match(/Rarity Rank[:\s]*([\d,]+)/i);
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
    
    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
    
    // Create final metadata object
    const metadata = {
      tokenId: 2,
      name: extractedData.name || "Lomen #2",
      description: extractedData.description || "Lomen is the first randomly generated art NFTs on KCC issued by the KuCoin team, made up of 10,000 bots with different looks & unique features, and also is an important part of the KuCoin Metaverse. Lomen holders will have the chance to receive Trading Bot airdrop benefits and participate in the governance of the KuCoin Metaverse in the future. Users can get it by participating in the KuCoin Trading Bot anniversary activities. Don't miss your Lomen!",
      image: "/images/nfts/2.webp",
      attributes: extractedData.attributes.length > 0 ? extractedData.attributes : [
        { "trait_type": "Head", "value": "Unknown" },
        { "trait_type": "Headwear", "value": "Unknown" },
        { "trait_type": "Clothes", "value": "Unknown" },
        { "trait_type": "Face", "value": "Unknown" }
      ],
      rarity: Object.keys(extractedData.rarity).length > 0 ? extractedData.rarity : {
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
