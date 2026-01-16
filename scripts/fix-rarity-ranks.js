import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing NFT metadata files
const metadataDir = path.join(__dirname, '..', 'public', 'metadata', 'nfts');

// Function to process a single metadata file
function processMetadataFile(filePath) {
  try {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    const metadata = JSON.parse(data);
    
    // Check if rarity rank exists and is a number
    if (metadata.rarity && typeof metadata.rarity.rank === 'number') {
      const originalRank = metadata.rarity.rank;
      
      // Decrease the rank by 1
      metadata.rarity.rank = originalRank - 1;
      
      // Write the updated metadata back to the file
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
      
      console.log(`Fixed ${path.basename(filePath)}: ${originalRank} -> ${metadata.rarity.rank}`);
      return true;
    } else {
      console.log(`Skipped ${path.basename(filePath)}: No valid rarity rank found`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to process all metadata files
function processAllMetadataFiles() {
  console.log('Starting to fix rarity ranks...');
  
  try {
    // Read all files in the metadata directory
    const files = fs.readdirSync(metadataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} metadata files to process`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each file
    jsonFiles.forEach(file => {
      const filePath = path.join(metadataDir, file);
      const result = processMetadataFile(filePath);
      
      if (result === true) {
        processedCount++;
      } else if (result === false) {
        skippedCount++;
      } else {
        errorCount++;
      }
    });
    
    console.log('\n--- Summary ---');
    console.log(`Total files processed: ${jsonFiles.length}`);
    console.log(`Successfully fixed: ${processedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('Rarity rank fix completed!');
    
  } catch (error) {
    console.error('Error reading metadata directory:', error.message);
  }
}

// Run the script
processAllMetadataFiles();
