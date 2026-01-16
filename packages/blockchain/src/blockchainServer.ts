import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import { 
  NFTOwner, 
  NFTOwnerBatchResponse,
  NFTTransactions, 
  WalletNFTs, 
  BlockchainStats,
  HealthCheckResponse 
} from '@lomen-club/shared';
import { simpleCacheService } from './simpleCacheService.js';
import { executeWithResilience, getResilienceHealth } from './resilienceUtils.js';
import { getProviderManager } from './providerManager.js';

export function startBlockchainService() {
  console.log('🚀 Blockchain service starting... Batch endpoint should be available at POST /api/nfts/owners/batch');

  /* global process */
  dotenv.config();

  const app = express();
  const PORT = process.env['BLOCKCHAIN_PORT'] || 3003;

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));

  // Rate limiting for public RPC endpoints
  const limiter = rateLimit({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '60000'), // 1 minute
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // Conservative limit for public RPC
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);

  // CORS and JSON middleware
  app.use(cors());
  app.use(express.json());

  // KCC Configuration
  const KCC_RPC_URL = process.env['KCC_RPC_URL'] || 'http://localhost:8545';
  const KCC_WS_URL = process.env['KCC_WS_URL'] || 'ws://localhost:8546'; // Available for future WebSocket support
  const LOMEN_NFT_CONTRACT = process.env['LOMEN_NFT_CONTRACT'] || '0x4ca64bf392ee736f6007ce93e022deb471a9dfd1';

  // Standard ERC-721 ABI for basic functionality
  const ERC721_ABI = [
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tokenURI(uint256 tokenId) public view returns (string)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function totalSupply() public view returns (uint256)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];

  // Initialize ProviderManager
  const providerManager = getProviderManager({
    primary: KCC_RPC_URL,
    backups: [
      'https://rpc-mainnet.kcc.network',
      'https://kcc-rpc.com'
      // Removed https://kcc.mytokenpocket.vip due to 404 errors
    ]
  });

  // Initialize contract
  let nftContract: ethers.Contract | null = null;
  let providerHealthy = false;

  async function initializeBlockchainConnection() {
    try {
      // Get initial provider (don't wait for health checks)
      const initialProvider = new ethers.JsonRpcProvider(KCC_RPC_URL, undefined, {
        staticNetwork: true,
        batchMaxCount: 1,
      });
      
      // Check provider sanity with initial provider
      providerHealthy = await checkProviderSanity(initialProvider);
      
      if (!providerHealthy) {
        console.error('❌ Provider sanity check failed. Blockchain service may not function correctly.');
        console.log('💡 Check if your local KCC node is running and fully synced.');
        console.log('💡 For local development, ensure KCC_RPC_URL is set correctly in .env file.');
        console.log('💡 Default local URL: http://localhost:8545');
        console.log('💡 Docker Desktop (macOS) URL: http://host.docker.internal:8545');
      }
      
      // Initialize contract with initial provider
      nftContract = new ethers.Contract(LOMEN_NFT_CONTRACT, ERC721_ABI, initialProvider);
      console.log(`✅ Connected to Lomen NFT contract at: ${LOMEN_NFT_CONTRACT}`);
      console.log(`📊 Initial provider: ${KCC_RPC_URL}`);
      
      // Start health monitoring after contract is initialized
      setTimeout(() => {
        providerManager.startHealthMonitoring();
      }, 5000); // Start health monitoring after 5 seconds
      
    } catch (error: unknown) {
      console.error(`❌ Failed to initialize contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
      nftContract = null;
    }
  }

  // Provider sanity check function
  async function checkProviderSanity(provider: ethers.JsonRpcProvider): Promise<boolean> {
    try {
      console.log(`🔍 Checking provider connection...`);
      console.log(`📡 WebSocket URL available for future use: ${KCC_WS_URL}`);
      
      // Check chainId
      const chainId = await provider.send('eth_chainId', []);
      console.log(`📊 Provider chainId: ${chainId}`);
      
      if (chainId !== '0x141') {
        console.error(`❌ Invalid chainId: expected 0x141 (KCC Mainnet), got ${chainId}`);
        return false;
      }
      
      // Check block number
      const blockNumber = await provider.getBlockNumber();
      console.log(`📊 Current block number: ${blockNumber}`);
      
      // Check sync status
      const syncStatus = await provider.send('eth_syncing', []);
      if (syncStatus !== false) {
        console.warn(`⚠️  Provider is still syncing: ${JSON.stringify(syncStatus)}`);
      } else {
        console.log(`✅ Provider is fully synced`);
      }
      
      console.log(`✅ Provider sanity check passed for KCC Mainnet (chainId: 0x141)`);
      return true;
    } catch (error: unknown) {
      console.error(`❌ Provider sanity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // Utility function to format wallet addresses
  function formatWalletAddress(address: string): string {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Not Owned';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Health check endpoint with resilience and provider status
  app.get('/api/health', (_req, res) => {
    const resilienceHealth = getResilienceHealth();
    const providerHealth = providerManager.getHealthSummary();
    
    const response: HealthCheckResponse = { 
      status: 'OK', 
      message: 'Lomen Club Blockchain Service is running',
      contractConnected: !!nftContract,
      contractAddress: LOMEN_NFT_CONTRACT,
      network: 'KCC Mainnet',
      resilience: resilienceHealth,
      providerHealth: providerHealth
    };
    res.json(response);
  });

  // Get NFT owner with caching
  app.get('/api/nfts/:tokenId/owner', async (req, res) => {
    try {
      const { tokenId } = req.params;
      const cacheKey = `nft:owner:${tokenId}`;
      
      // Try to get from cache first
      const cachedData = await simpleCacheService.get<NFTOwner>(cacheKey);
      if (cachedData) {
        console.log(`📦 Serving NFT ${tokenId} owner from cache`);
        return res.json(cachedData);
      }
      
      if (!nftContract) {
        return res.status(503).json({ 
          error: 'Blockchain service not configured',
          message: 'Contract connection failed'
        });
      }
      
      // Get owner from blockchain with resilience
      const ownerAddress = await executeWithResilience(
        () => nftContract!['ownerOf'](tokenId),
        `ownerOf for NFT ${tokenId}`,
        { timeoutMs: 10000 }, // 10 second timeout for individual NFT
        () => {
          // Fallback: return zero address (not owned)
          console.warn(`⚠️  Using fallback for NFT ${tokenId} owner check`);
          return '0x0000000000000000000000000000000000000000';
        }
      );
      
      const response: NFTOwner = {
        tokenId: parseInt(tokenId),
        owner: ownerAddress,
        ownerShort: formatWalletAddress(ownerAddress),
        isOwned: ownerAddress !== '0x0000000000000000000000000000000000000000',
        network: 'KCC Mainnet'
      };
      
      // Cache the result
      await simpleCacheService.set(cacheKey, response, { ttl: 300 }); // 5 minutes cache
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error fetching NFT owner:', error);
      
      // Return error with helpful message
      if (error instanceof Error && (error as any).code === 'CALL_EXCEPTION') {
        res.status(404).json({ 
          error: 'NFT not found or not minted',
          tokenId: parseInt(req.params.tokenId),
          message: 'The NFT may not exist on the blockchain yet',
          network: 'KCC Mainnet'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to fetch NFT owner', 
          details: error instanceof Error ? error.message : 'Unknown error',
          network: 'KCC Mainnet'
        });
      }
    }
  });

  // Test route - simplified
  app.post('/api/test-batch', (_req, res) => {
    console.log('✅ Test batch route hit');
    res.json({ message: 'Test batch route works', timestamp: Date.now() });
  });

  // Get batch NFT owners (performance optimization for enrichment service)
  console.log('🔧 Registering batch endpoint: POST /api/nfts/owners/batch');
  app.post('/api/nfts/owners/batch', async (req, res) => {
    try {
      const { tokenIds } = req.body;
      
      // Validate input
      if (!Array.isArray(tokenIds)) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          message: 'tokenIds must be an array of numbers'
        });
      }
      
      if (tokenIds.length === 0) {
        return res.status(400).json({ 
          error: 'Empty batch',
          message: 'tokenIds array cannot be empty'
        });
      }
      
      if (tokenIds.length > 100) {
        return res.status(400).json({ 
          error: 'Batch too large',
          message: 'Maximum batch size is 100 token IDs'
        });
      }
      
      if (!nftContract) {
        return res.status(503).json({ 
          error: 'Blockchain service not configured',
          message: 'Contract connection failed'
        });
      }
      
      console.log(`📦 Processing batch request for ${tokenIds.length} NFTs`);
      
      const owners: NFTOwner[] = [];
      const failedTokenIds: number[] = [];
      
      // Process token IDs in parallel with Promise.allSettled
      const promises = tokenIds.map(async (tokenId: number) => {
        const cacheKey = `nft:owner:${tokenId}`;
        
        // Try cache first
        const cachedData = await simpleCacheService.get<NFTOwner>(cacheKey);
        if (cachedData) {
          return { success: true, data: cachedData, tokenId };
        }
        
        try {
          // Get owner from blockchain with resilience
          const ownerAddress = await executeWithResilience(
            () => nftContract!['ownerOf'](tokenId),
            `ownerOf for NFT ${tokenId} (batch)`,
            { timeoutMs: 15000 }, // 15 second timeout for batch operations
            () => {
              // Fallback: return zero address (not owned)
              console.warn(`⚠️  Using fallback for NFT ${tokenId} owner check in batch`);
              return '0x0000000000000000000000000000000000000000';
            }
          );
          
          const response: NFTOwner = {
            tokenId,
            owner: ownerAddress,
            ownerShort: formatWalletAddress(ownerAddress),
            isOwned: ownerAddress !== '0x0000000000000000000000000000000000000000',
            network: 'KCC Mainnet'
          };
          
          // Cache the result
          await simpleCacheService.set(cacheKey, response, { ttl: 300 }); // 5 minutes cache
          
          return { success: true, data: response, tokenId };
        } catch (error: unknown) {
          console.error(`Failed to fetch owner for NFT ${tokenId}:`, error);
          return { success: false, error, tokenId };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { success, data, tokenId, error: _error } = result.value;
          if (success && data) {
            owners.push(data);
          } else {
            failedTokenIds.push(tokenId);
          }
        } else {
          // This shouldn't happen with Promise.allSettled, but handle it
          console.error('Unexpected promise rejection:', result.reason);
        }
      });
      
      const response: NFTOwnerBatchResponse = {
        owners,
        totalProcessed: owners.length,
        totalFailed: failedTokenIds.length,
        network: 'KCC Mainnet'
      };
      
      // Only include failedTokenIds if there are failures
      if (failedTokenIds.length > 0) {
        response.failedTokenIds = failedTokenIds;
      }
      
      console.log(`✅ Batch processed: ${owners.length} successful, ${failedTokenIds.length} failed`);
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error processing batch NFT owners:', error);
      res.status(500).json({ 
        error: 'Failed to process batch NFT owners', 
        details: error instanceof Error ? error.message : 'Unknown error',
        network: 'KCC Mainnet'
      });
    }
  });

  // Get wallet NFTs
  app.get('/api/wallets/:address/nfts', async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!nftContract) {
        return res.status(503).json({ 
          error: 'Blockchain service not configured',
          message: 'Contract connection failed'
        });
      }
      
      // Validate address
      if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
      }
      
      // Get balance from blockchain with resilience
      const balance = await executeWithResilience(
        () => nftContract!['balanceOf'](address),
        `balanceOf for wallet ${address}`,
        { timeoutMs: 10000 },
        () => {
          // Fallback: return 0 balance
          console.warn(`⚠️  Using fallback for wallet ${address} balance check`);
          return BigInt(0);
        }
      );
      
      const response: WalletNFTs = {
        wallet: address,
        totalNFTs: parseInt(balance.toString()),
        nfts: [],
        network: 'KCC Mainnet',
        note: 'Individual NFT listing requires event scanning implementation'
      };
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error fetching wallet NFTs:', error);
      res.status(500).json({ 
        error: 'Failed to fetch wallet NFTs', 
        details: error instanceof Error ? error.message : 'Unknown error',
        network: 'KCC Mainnet'
      });
    }
  });

  // Get NFT transaction history
  app.get('/api/nfts/:tokenId/transactions', async (req, res) => {
    try {
      const { tokenId } = req.params;
      
      if (!nftContract) {
        return res.status(503).json({ 
          error: 'Blockchain service not configured',
          message: 'Contract connection failed'
        });
      }
      
      // Note: Transaction history requires event scanning
      // For now, return empty array with note
      const response: NFTTransactions = {
        tokenId: parseInt(tokenId),
        transactions: [],
        total: 0,
        network: 'KCC Mainnet'
      };
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error fetching NFT transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch NFT transactions', 
        details: error instanceof Error ? error.message : 'Unknown error',
        network: 'KCC Mainnet'
      });
    }
  });

  // Get blockchain stats
  app.get('/api/stats', async (_req, res) => {
    try {
      if (!nftContract) {
        return res.status(503).json({ 
          error: 'Blockchain service not configured',
          message: 'Contract connection failed'
        });
      }
      
      // Get basic stats from blockchain with resilience
      const totalSupply = await executeWithResilience(
        () => nftContract!['totalSupply'](),
        'totalSupply',
        { timeoutMs: 10000 },
        () => {
          // Fallback: return 0
          console.warn('⚠️  Using fallback for totalSupply');
          return BigInt(0);
        }
      );
      
      const name = await executeWithResilience(
        () => nftContract!['name'](),
        'name',
        { timeoutMs: 10000 },
        () => {
          // Fallback: return empty string
          console.warn('⚠️  Using fallback for contract name');
          return '';
        }
      );
      
      const symbol = await executeWithResilience(
        () => nftContract!['symbol'](),
        'symbol',
        { timeoutMs: 10000 },
        () => {
          // Fallback: return empty string
          console.warn('⚠️  Using fallback for contract symbol');
          return '';
        }
      );
      
      const response: BlockchainStats = {
        name: name,
        symbol: symbol,
        totalSupply: parseInt(totalSupply.toString()),
        totalOwners: 'N/A', // Would require scanning all token owners
        floorPrice: 'N/A',
        volume24h: 'N/A',
        marketCap: 'N/A',
        network: 'KCC Mainnet'
      };
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error fetching blockchain stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch blockchain stats', 
        details: error instanceof Error ? error.message : 'Unknown error',
        network: 'KCC Mainnet'
      });
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`✅ Blockchain service running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📡 NFT owner endpoint: http://localhost:${PORT}/api/nfts/:tokenId/owner`);
    console.log(`📡 Batch endpoint: http://localhost:${PORT}/api/nfts/owners/batch`);
    
    // Initialize blockchain connection after server starts
    initializeBlockchainConnection();
  });
}
