import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { databaseService, databaseEnrichmentService, syncDataService } from '@lomen-club/database';
import path from 'path';
import { fileURLToPath } from 'url';

/* global process */
// const __filename = fileURLToPath(import.meta.url); // Unused
// const __dirname = path.dirname(__filename); // Unused

// Load .env file from project root
const envPath = path.join(process.cwd(), '../../.env');
console.log('🔍 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting - DISABLED for local development to allow bulk NFT refresh
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // Increased limit for local development
});
app.use(limiter);

// CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
const mongodbUri = process.env.MONGODB_URI;
console.log('🔍 Checking MONGODB_URI:', mongodbUri ? 'Found' : 'Not found');
if (!mongodbUri) {
  console.error('❌ MONGODB_URI environment variable is required');
} else {
  databaseService.connect(mongodbUri)
    .then(async () => {
      // Initialize enrichment service with NFTs collection
      const nftsCollection = databaseService.getNFTsCollection();
      databaseEnrichmentService.setNFTsCollection(nftsCollection);
      
      // Initialize sync data service with database connection
      const db = databaseService.isConnected() ? databaseService.getNFTsCollection().db : null;
      if (db) {
        await syncDataService.initialize(db);
        console.log('✅ Sync data service initialized');
      }
      
      console.log('✅ Database connected and enrichment service initialized');
      
      // Initialize blockchain data for all NFTs (first-time setup)
      databaseEnrichmentService.initializeBlockchainData().catch(console.error);
    })
    .catch(console.error);
}

// Import and use routes
import { nftRoutes } from './routes/nfts.js';
import { walletRoutes } from './routes/wallets.js';
import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { adminRoutes } from './routes/admin.js';
import healthRoutes from './routes/health.js';
app.use('/api/nfts', nftRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lomen Club API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/nfts - Get NFTs with filtering & pagination`);
  console.log(`   GET /api/nfts/:tokenId - Get single NFT`);
  console.log(`   GET /api/nfts/traits/available - Get available traits`);
  console.log(`   GET /api/nfts/stats - Get NFT statistics`);
  console.log(`   GET /api/wallets/:address/nfts - Get NFTs by wallet`);
  console.log(`   GET /api/wallets/:address/token-ids - Get token IDs by wallet`);
  console.log(`   POST /api/wallets/:address/ownership - Check NFT ownership`);
  console.log(`   POST /api/auth/challenge - Generate auth challenge`);
  console.log(`   POST /api/auth/authenticate - Authenticate wallet`);
  console.log(`   POST /api/auth/logout - Logout user`);
  console.log(`   GET /api/auth/verify - Verify session`);
  console.log(`   GET /api/profile/:walletAddress - Get user profile`);
  console.log(`   PUT /api/profile/:walletAddress - Update user profile`);
  console.log(`   POST /api/profile/:walletAddress/sync-nfts - Sync user NFTs`);
  console.log(`   POST /api/profile/:walletAddress/profile-picture - Set profile picture`);
  console.log(`   GET /api/profile/:walletAddress/nfts - Get user NFTs`);
  console.log(`   GET /api/profile/:walletAddress/membership - Check membership`);
});
