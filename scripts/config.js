// Configuration for development vs production environments
// Set NODE_ENV=development for local development with local KCC node
// Set NODE_ENV=production for production with external services

const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  // Blockchain configuration
  blockchain: {
    // Use local node for development, external for production
    baseUrl: isDevelopment ? 'http://localhost:3003' : 'http://localhost:3003',
    // Rate limiting settings
    rateLimitDelay: isDevelopment ? 50 : 1000, // ms between requests
    batchSize: isDevelopment ? 50 : 10, // Batch size for processing
  },
  
  // Image download configuration
  imageDownload: {
    baseUrl: 'https://mrkt.kuswap.finance/static/0x4ca64bf392ee736f6007ce93e022deb471a9dfd1',
    batchSize: isDevelopment ? 200 : 100, // Larger batches for local development
    delayBetweenBatches: isDevelopment ? 500 : 1000, // ms between batches
  },
  
  // Metadata download configuration
  metadataDownload: {
    delayBetweenRequests: isDevelopment ? 100 : 2000, // ms between requests
    batchSize: isDevelopment ? 50 : 10, // Batch size for processing
  },
  
  // Environment flags
  isDevelopment,
  isProduction: !isDevelopment,
};

export default config;
