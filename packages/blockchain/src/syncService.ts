import { ethers } from 'ethers';
import { MongoClient, Db, Collection } from 'mongodb';
import {
  TokenDocument,
  TransferEvent,
  SyncState,
  SyncConfig,
  SyncProgress,
  VerificationResult,
  ReorgDetection
} from '@lomen-club/shared';

// Standard ERC-721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = 'Transfer(address,address,uint256)';
const TRANSFER_EVENT_TOPIC = ethers.id(TRANSFER_EVENT_SIGNATURE);

export class NFTSyncService {
  private provider: ethers.JsonRpcProvider;
  private db: Db | null = null;
  private client: MongoClient | null = null;
  
  // Collections
  private tokensCollection: Collection<TokenDocument> | null = null;
  private transfersCollection: Collection<TransferEvent> | null = null;
  private syncStateCollection: Collection<SyncState> | null = null;
  
  // Configuration
  private config: Required<SyncConfig>;
  private contractAddress: string;
  private contract: ethers.Contract;
  
  // Current state
  private isRunning = false;
  private currentProgress: SyncProgress | null = null;
  
  // ERC-721 ABI for basic functionality
  private static readonly ERC721_ABI = [
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function tokenURI(uint256 tokenId) public view returns (string)",
    "function balanceOf(address owner) public view returns (uint256)",
    "function totalSupply() public view returns (uint256)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];

  constructor(config: SyncConfig) {
    // Validate required configuration
    if (!config.rpc_url) throw new Error('RPC URL is required');
    if (!config.contract_address) throw new Error('Contract address is required');
    if (!config.mongodb_uri) throw new Error('MongoDB URI is required');
    
    // Set configuration with defaults
    this.config = {
      ...config,
      from_block: config.from_block || 0,
      confirmations: config.confirmations || 20,
      batch_size: config.batch_size || 1000,
      max_retries: config.max_retries || 3,
      retry_delay_ms: config.retry_delay_ms || 1000,
      max_blocks_per_second: config.max_blocks_per_second || 50,
      max_requests_per_second: config.max_requests_per_second || 100,
      ws_url: config.ws_url
    };
    
    this.contractAddress = config.contract_address;
    
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(this.config.rpc_url, undefined, {
      staticNetwork: true,
      batchMaxCount: 1,
    });
    
    // Initialize contract
    this.contract = new ethers.Contract(
      this.contractAddress,
      NFTSyncService.ERC721_ABI,
      this.provider
    );
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing NFT Sync Service...');
    
    // Connect to MongoDB
    await this.connectToDatabase();
    
    // Create indexes
    await this.createIndexes();
    
    // Validate blockchain connection
    await this.validateBlockchainConnection();
    
    console.log('✅ NFT Sync Service initialized');
  }

  /**
   * Connect to MongoDB
   */
  private async connectToDatabase(): Promise<void> {
    try {
      console.log('🔗 Connecting to MongoDB...');
      this.client = new MongoClient(this.config.mongodb_uri);
      await this.client.connect();
      
      this.db = this.client.db('lomen-club');
      
      // Initialize collections
      this.tokensCollection = this.db.collection<TokenDocument>('tokens');
      this.transfersCollection = this.db.collection<TransferEvent>('transfers');
      this.syncStateCollection = this.db.collection<SyncState>('sync_state');
      
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Create necessary indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    
    try {
      // Tokens collection indexes
      await this.tokensCollection!.createIndex(
        { contract_address: 1, token_id: 1 },
        { unique: true, name: 'contract_token_unique' }
      );
      await this.tokensCollection!.createIndex(
        { owner_address: 1 },
        { name: 'owner_address_index' }
      );
      await this.tokensCollection!.createIndex(
        { last_synced_block: -1 },
        { name: 'last_synced_block_index' }
      );
      await this.tokensCollection!.createIndex(
        { updated_at: -1 },
        { name: 'updated_at_index' }
      );
      
      // Transfers collection indexes
      await this.transfersCollection!.createIndex(
        { tx_hash: 1, log_index: 1 },
        { unique: true, name: 'tx_hash_log_index_unique' }
      );
      await this.transfersCollection!.createIndex(
        { contract_address: 1, token_id: 1 },
        { name: 'contract_token_transfers_index' }
      );
      await this.transfersCollection!.createIndex(
        { block_number: 1 },
        { name: 'block_number_index' }
      );
      await this.transfersCollection!.createIndex(
        { from_address: 1 },
        { name: 'from_address_index' }
      );
      await this.transfersCollection!.createIndex(
        { to_address: 1 },
        { name: 'to_address_index' }
      );
      
      // Sync state collection indexes
      await this.syncStateCollection!.createIndex(
        { contract_address: 1 },
        { unique: true, name: 'contract_address_unique' }
      );
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create database indexes:', error);
      throw error;
    }
  }

  /**
   * Validate blockchain connection and contract
   */
  private async validateBlockchainConnection(): Promise<void> {
    try {
      console.log('🔍 Validating blockchain connection...');
      
      // Check chainId
      const chainId = await this.provider.send('eth_chainId', []);
      console.log(`📊 Chain ID: ${chainId}`);
      
      if (chainId !== '0x141') {
        throw new Error(`Invalid chainId: expected 0x141 (KCC Mainnet), got ${chainId}`);
      }
      
      // Check sync status
      const syncStatus = await this.provider.send('eth_syncing', []);
      if (syncStatus !== false) {
        console.warn(`⚠️  Blockchain node is still syncing: ${JSON.stringify(syncStatus)}`);
      } else {
        console.log('✅ Blockchain node is fully synced');
      }
      
      // Check contract
      const name = await this.contract.name();
      const symbol = await this.contract.symbol();
      const totalSupply = await this.contract.totalSupply();
      
      console.log(`📝 Contract: ${name} (${symbol})`);
      console.log(`📊 Total Supply: ${totalSupply.toString()}`);
      
      console.log('✅ Blockchain connection validated');
    } catch (error) {
      console.error('❌ Blockchain validation failed:', error);
      throw error;
    }
  }

  /**
   * Start the sync process
   */
  async startSync(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Sync is already running');
    }
    
    this.isRunning = true;
    
    try {
      console.log('🚀 Starting NFT sync...');
      
      // Get or create sync state
      let syncState = await this.getSyncState();
      if (!syncState) {
        syncState = await this.createInitialSyncState();
      }
      
      // Update progress
      this.currentProgress = {
        status: 'running',
        phase: 'initializing',
        start_block: syncState.start_block,
        current_block: syncState.current_block,
        head_block: syncState.head_block,
        finalized_to_block: syncState.finalized_to_block,
        blocks_processed: 0,
        blocks_remaining: 0,
        blocks_per_second: 0,
        estimated_time_remaining_seconds: 0,
        tokens_discovered: syncState.tokens_discovered,
        tokens_enriched: syncState.tokens_enriched,
        transfers_processed: syncState.transfers_processed,
        events_per_second: 0,
        started_at: new Date(),
        last_update_at: new Date(),
        retry_count: 0
      };
      
      // Main sync loop
      await this.syncLoop(syncState);
      
      // Mark as completed
      await this.markSyncCompleted(syncState);
      
      console.log('✅ NFT sync completed successfully');
    } catch (error) {
      console.error('❌ NFT sync failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get existing sync state or create new one
   */
  private async getSyncState(): Promise<SyncState | null> {
    if (!this.syncStateCollection) throw new Error('Database not connected');
    
    return await this.syncStateCollection.findOne({
      contract_address: this.contractAddress
    });
  }

  /**
   * Create initial sync state
   */
  private async createInitialSyncState(): Promise<SyncState> {
    if (!this.syncStateCollection) throw new Error('Database not connected');
    
    // Get current block number
    const headBlock = await this.provider.getBlockNumber();
    
    // Determine start block
    let startBlock = this.config.from_block;
    if (startBlock === 0) {
      // Try to find deployment block by scanning for first Transfer event
      startBlock = await this.findDeploymentBlock();
    }
    
    const syncState: SyncState = {
      contract_address: this.contractAddress,
      sync_type: 'full',
      start_block: startBlock,
      current_block: startBlock,
      finalized_to_block: startBlock - 1,
      head_block: headBlock,
      tokens_discovered: 0,
      tokens_enriched: 0,
      transfers_processed: 0,
      started_at: new Date(),
      last_updated_at: new Date(),
      completed_at: null,
      confirmations: this.config.confirmations,
      batch_size: this.config.batch_size,
      error_count: 0
    };
    
    await this.syncStateCollection.insertOne(syncState);
    return syncState;
  }

  /**
   * Find deployment block by scanning for first Transfer event
   */
  private async findDeploymentBlock(): Promise<number> {
    console.log('🔍 Finding deployment block...');
    
    const headBlock = await this.provider.getBlockNumber();
    let low = 0;
    let high = headBlock;
    let deploymentBlock = headBlock;
    
    // Binary search for first Transfer event
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      
      try {
        const logs = await this.provider.getLogs({
          address: this.contractAddress,
          topics: [TRANSFER_EVENT_TOPIC],
          fromBlock: mid,
          toBlock: Math.min(mid + 100, high)
        });
        
        if (logs.length > 0) {
          // Found Transfer events, search earlier
          deploymentBlock = mid;
          high = mid - 1;
        } else {
          // No Transfer events, search later
          low = mid + 1;
        }
      } catch (error) {
        // If range too large, narrow it down
        high = mid - 1;
      }
    }
    
    console.log(`📊 Deployment block found: ${deploymentBlock}`);
    return deploymentBlock;
  }

  /**
   * Main sync loop
   */
  private async syncLoop(syncState: SyncState): Promise<void> {
    let retryCount = 0;
    
    while (syncState.current_block <= syncState.head_block) {
      try {
        // Update current progress
        this.currentProgress!.phase = 'scanning';
        this.currentProgress!.current_block = syncState.current_block;
        this.currentProgress!.head_block = syncState.head_block;
        
        // Process batch of blocks
        const batchEndBlock = Math.min(
          syncState.current_block + syncState.batch_size - 1,
          syncState.head_block
        );
        
        console.log(`📊 Processing blocks ${syncState.current_block} to ${batchEndBlock}...`);
        
        await this.processBlockRange(syncState.current_block, batchEndBlock, syncState);
        
        // Update sync state
        syncState.current_block = batchEndBlock + 1;
        syncState.last_updated_at = new Date();
        
        // Check for reorgs
        await this.checkForReorgs(syncState);
        
        // Update finalized block (current block - confirmations)
        if (syncState.current_block > syncState.confirmations) {
          syncState.finalized_to_block = syncState.current_block - syncState.confirmations;
        }
        
        // Save progress
        await this.saveSyncState(syncState);
        
        // Update progress metrics
        this.updateProgressMetrics(syncState);
        
        // Reset retry count on success
        retryCount = 0;
        
        // Rate limiting
        await this.sleep(100); // 100ms delay between batches
        
      } catch (error) {
        console.error(`❌ Error processing block ${syncState.current_block}:`, error);
        
        retryCount++;
        if (retryCount > this.config.max_retries) {
          throw new Error(`Max retries exceeded: ${error}`);
        }
        
        console.log(`🔄 Retrying (${retryCount}/${this.config.max_retries})...`);
        await this.sleep(this.config.retry_delay_ms * retryCount);
      }
    }
  }

  /**
   * Process a range of blocks
   */
  private async processBlockRange(
    startBlock: number,
    endBlock: number,
    syncState: SyncState
  ): Promise<void> {
    // Get Transfer events in block range
    const logs = await this.provider.getLogs({
      address: this.contractAddress,
      topics: [TRANSFER_EVENT_TOPIC],
      fromBlock: startBlock,
      toBlock: endBlock
    });
    
    console.log(`📊 Found ${logs.length} Transfer events in blocks ${startBlock}-${endBlock}`);
    
    // Process each Transfer event
    for (const log of logs) {
      await this.processTransferEvent(log, syncState);
    }
    
    // Update statistics
    syncState.transfers_processed += logs.length;
  }

  /**
   * Process a single Transfer event
   */
  private async processTransferEvent(
    log: ethers.Log,
    syncState: SyncState
  ): Promise<void> {
    if (!this.transfersCollection || !this.tokensCollection) {
      throw new Error('Database not connected');
    }
    
    // Parse Transfer event
    const iface = new ethers.Interface(NFTSyncService.ERC721_ABI);
    const parsedLog = iface.parseLog(log);
    
    if (!parsedLog || parsedLog.name !== 'Transfer') {
      return;
    }
    
    const from = parsedLog.args[0];
    const to = parsedLog.args[1];
    const tokenId = parsedLog.args[2];
    
    // Create transfer event document
    const transferEvent: TransferEvent = {
      tx_hash: log.transactionHash,
      log_index: log.index,
      contract_address: this.contractAddress,
      token_id: Number(tokenId),
      from_address: from,
      to_address: to,
      block_number: Number(log.blockNumber),
      block_hash: log.blockHash,
      block_timestamp: (await this.provider.getBlock(log.blockNumber!)).timestamp,
      tx_index: log.transactionIndex,
      processed_at: new Date()
    };
    
    // Insert or update transfer event
    await this.transfersCollection.updateOne(
      { tx_hash: transferEvent.tx_hash, log_index: transferEvent.log_index },
      { $set: transferEvent },
      { upsert: true }
    );
    
    // Update token document
    const tokenDocument: Partial<TokenDocument> = {
      contract_address: this.contractAddress,
      token_id: Number(tokenId),
      owner_address: to,
      last_transfer_block: Number(log.blockNumber),
      last_transfer_tx_hash: log.transactionHash,
      last_transfer_log_index: log.index,
      updated_at: new Date(),
      last_synced_block: Number(log.blockNumber),
      last_synced_at: new Date()
    };
    
    // Check if token exists
    const existingToken = await this.tokensCollection.findOne({
      contract_address: this.contractAddress,
      token_id: Number(tokenId)
    });
    
    if (!existingToken) {
      // New token - fetch tokenURI and create document
      tokenDocument.created_at = new Date();
      
      try {
        const tokenURI = await this.contract.tokenURI(tokenId);
        tokenDocument.token_uri = tokenURI;
        
        // TODO: Fetch and cache metadata from tokenURI
      } catch (error) {
        tokenDocument.token_uri = null;
      }
      
      syncState.tokens_discovered++;
    }
    
    // Update token document
    await this.tokensCollection.updateOne(
      { contract_address: this.contractAddress, token_id: Number(tokenId) },
      { $set: tokenDocument },
      { upsert: true }
    );
  }

  /**
   * Check for blockchain reorganizations
   */
  private async checkForReorgs(syncState: SyncState): Promise<ReorgDetection> {
    const reorgDetection: ReorgDetection = {
      detected: false,
      affected_block_range: { from: 0, to: 0 },
      mismatched_blocks: [],
      action_taken: 'none',
      rollback_count: 0
    };
    
    // Check recent finalized blocks for hash mismatches
    const checkFrom = Math.max(syncState.finalized_to_block - 100, syncState.start_block);
    const checkTo = syncState.finalized_to_block;
    
    if (checkFrom >= checkTo) {
      return reorgDetection;
    }
    
    try {
      // Get stored block hashes from transfers
      const storedTransfers = await this.transfersCollection!.find({
        block_number: { $gte: checkFrom, $lte: checkTo }
      }).toArray();
      
      // Group by block number
      const blockHashes = new Map<number, string>();
      for (const transfer of storedTransfers) {
        if (!blockHashes.has(transfer.block_number)) {
          blockHashes.set(transfer.block_number, transfer.block_hash);
        }
      }
      
      // Check each block hash against blockchain
      for (const [blockNumber, storedHash] of blockHashes.entries()) {
        const currentBlock = await this.provider.getBlock(blockNumber);
        
        if (currentBlock && currentBlock.hash !== storedHash) {
          reorgDetection.detected = true;
          reorgDetection.mismatched_blocks.push({
            block_number: blockNumber,
            expected_hash: storedHash,
            actual_hash: currentBlock.hash
          });
        }
      }
      
      if (reorgDetection.detected) {
        console.warn(`⚠️  Reorg detected affecting ${reorgDetection.mismatched_blocks.length} blocks`);
        
        // Determine affected range
        const affectedBlocks = reorgDetection.mismatched_blocks.map(b => b.block_number);
        reorgDetection.affected_block_range.from = Math.min(...affectedBlocks);
        reorgDetection.affected_block_range.to = Math.max(...affectedBlocks);
        
        // Rollback affected blocks
        await this.rollbackBlocks(
          reorgDetection.affected_block_range.from,
          reorgDetection.affected_block_range.to
        );
        
        reorgDetection.action_taken = 'rollback';
        reorgDetection.rollback_count = affectedBlocks.length;
        
        // Update sync state to reprocess from affected range
        syncState.current_block = Math.min(
          syncState.current_block,
          reorgDetection.affected_block_range.from
        );
      }
      
    } catch (error) {
      console.error('❌ Error checking for reorgs:', error);
    }
    
    return reorgDetection;
  }

  /**
   * Rollback blocks affected by reorg
   */
  private async rollbackBlocks(fromBlock: number, toBlock: number): Promise<void> {
    if (!this.transfersCollection || !this.tokensCollection) {
      throw new Error('Database not connected');
    }
    
    console.log(`🔄 Rolling back blocks ${fromBlock} to ${toBlock}...`);
    
    // Delete transfers in affected range
    await this.transfersCollection.deleteMany({
      block_number: { $gte: fromBlock, $lte: toBlock }
    });
    
    // Reset token last_synced_block for affected tokens
    // Find tokens that were last updated in affected range
    const affectedTokens = await this.transfersCollection.find({
      block_number: { $gte: fromBlock, $lte: toBlock }
    }).toArray();
    
    const tokenIds = [...new Set(affectedTokens.map(t => t.token_id))];
    
    for (const tokenId of tokenIds) {
      // Find the most recent transfer before the reorg
      const lastValidTransfer = await this.transfersCollection.findOne(
        { token_id: tokenId, block_number: { $lt: fromBlock } },
        { sort: { block_number: -1 } }
      );
      
      if (lastValidTransfer) {
        // Update token to last valid state
        await this.tokensCollection.updateOne(
          { contract_address: this.contractAddress, token_id: tokenId },
          {
            $set: {
              owner_address: lastValidTransfer.to_address,
              last_transfer_block: lastValidTransfer.block_number,
              last_transfer_tx_hash: lastValidTransfer.tx_hash,
              last_transfer_log_index: lastValidTransfer.log_index,
              last_synced_block: lastValidTransfer.block_number,
              last_synced_at: new Date(),
              updated_at: new Date()
            }
          }
        );
      } else {
        // No previous transfers, token might have been minted in reorged block
        // We'll need to refetch from blockchain
        await this.tokensCollection.updateOne(
          { contract_address: this.contractAddress, token_id: tokenId },
          {
            $set: {
              last_synced_block: fromBlock - 1,
              last_synced_at: new Date(),
              updated_at: new Date()
            }
          }
        );
      }
    }
    
    console.log(`✅ Rollback completed for blocks ${fromBlock} to ${toBlock}`);
  }

  /**
   * Save sync state
   */
  private async saveSyncState(syncState: SyncState): Promise<void> {
    if (!this.syncStateCollection) throw new Error('Database not connected');
    
    await this.syncStateCollection.updateOne(
      { contract_address: this.contractAddress },
      { $set: syncState },
      { upsert: true }
    );
  }

  /**
   * Mark sync as completed
   */
  private async markSyncCompleted(syncState: SyncState): Promise<void> {
    syncState.completed_at = new Date();
    syncState.last_updated_at = new Date();
    await this.saveSyncState(syncState);
  }

  /**
   * Update progress metrics
   */
  private updateProgressMetrics(syncState: SyncState): void {
    if (!this.currentProgress) return;
    
    const now = new Date();
    const elapsedSeconds = (now.getTime() - this.currentProgress.started_at.getTime()) / 1000;
    
    this.currentProgress.last_update_at = now;
    this.currentProgress.blocks_processed = syncState.current_block - syncState.start_block;
    this.currentProgress.blocks_remaining = syncState.head_block - syncState.current_block;
    
    if (elapsedSeconds > 0) {
      this.currentProgress.blocks_per_second = this.currentProgress.blocks_processed / elapsedSeconds;
      this.currentProgress.events_per_second = syncState.transfers_processed / elapsedSeconds;
      
      if (this.currentProgress.blocks_per_second > 0) {
        this.currentProgress.estimated_time_remaining_seconds = 
          this.currentProgress.blocks_remaining / this.currentProgress.blocks_per_second;
      }
    }
    
    this.currentProgress.tokens_discovered = syncState.tokens_discovered;
    this.currentProgress.tokens_enriched = syncState.tokens_enriched;
    this.currentProgress.transfers_processed = syncState.transfers_processed;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress | null {
    return this.currentProgress;
  }

  /**
   * Stop the sync process
   */
  async stopSync(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Sync stopped by user');
  }

  /**
   * Run verification on synced data
   */
  async verifySync(sampleSize: number = 100): Promise<VerificationResult> {
    if (!this.tokensCollection) throw new Error('Database not connected');
    
    console.log(`🔍 Running verification with sample size: ${sampleSize}`);
    
    const result: VerificationResult = {
      sample_size: sampleSize,
      tokens_checked: 0,
      tokens_matched: 0,
      tokens_mismatched: 0,
      mismatches: [],
      total_tokens_in_db: 0,
      expected_total_tokens: 10000, // Lomen collection has exactly 10,000 NFTs
      total_transfers_in_db: 0,
      passed: false,
      timestamp: new Date()
    };
    
    try {
      // Get total counts
      result.total_tokens_in_db = await this.tokensCollection.countDocuments({
        contract_address: this.contractAddress
      });
      
      if (this.transfersCollection) {
        result.total_transfers_in_db = await this.transfersCollection.countDocuments({
          contract_address: this.contractAddress
        });
      }
      
      // Random sample verification
      const allTokens = await this.tokensCollection.find({
        contract_address: this.contractAddress
      }).toArray();
      
      // Shuffle and take sample
      const shuffled = [...allTokens].sort(() => Math.random() - 0.5);
      const sample = shuffled.slice(0, Math.min(sampleSize, allTokens.length));
      
      result.tokens_checked = sample.length;
      
      // Check each token in sample
      for (const token of sample) {
        try {
          // Check owner
          const chainOwner = await this.contract.ownerOf(token.token_id);
          const dbOwner = token.owner_address;
          
          if (chainOwner.toLowerCase() !== dbOwner.toLowerCase()) {
            result.tokens_mismatched++;
            result.mismatches.push({
              token_id: token.token_id,
              field: 'owner',
              expected: chainOwner,
              actual: dbOwner,
              block_number: token.last_transfer_block
            });
            continue;
          }
          
          // Check tokenURI if available
          if (token.token_uri) {
            try {
              const chainTokenURI = await this.contract.tokenURI(token.token_id);
              if (chainTokenURI !== token.token_uri) {
                result.tokens_mismatched++;
                result.mismatches.push({
                  token_id: token.token_id,
                  field: 'token_uri',
                  expected: chainTokenURI,
                  actual: token.token_uri,
                  block_number: token.last_transfer_block
                });
                continue;
              }
            } catch (error) {
              // tokenURI might not be supported or fail
            }
          }
          
          result.tokens_matched++;
          
        } catch (error) {
          console.error(`❌ Error verifying token ${token.token_id}:`, error);
        }
      }
      
      // Determine if verification passed
      const tokenCountMatch = result.total_tokens_in_db === result.expected_total_tokens;
      const sampleAccuracy = result.tokens_matched / result.tokens_checked;
      
      result.passed = tokenCountMatch && sampleAccuracy >= 0.99; // 99% accuracy threshold
      
      console.log(`📊 Verification results:`);
      console.log(`   Tokens in DB: ${result.total_tokens_in_db} / ${result.expected_total_tokens}`);
      console.log(`   Sample checked: ${result.tokens_checked}`);
      console.log(`   Matched: ${result.tokens_matched}`);
      console.log(`   Mismatched: ${result.tokens_mismatched}`);
      console.log(`   Passed: ${result.passed ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      result.passed = false;
    }
    
    return result;
  }

  /**
   * Get sync status for monitoring
   */
  async getStatus(): Promise<{
    last_finalized_block: number;
    head_block: number;
    lag: number;
    tokens_count: number;
    transfers_count: number;
    is_running: boolean;
    progress?: SyncProgress;
  }> {
    if (!this.tokensCollection || !this.transfersCollection) {
      throw new Error('Database not connected');
    }
    
    const headBlock = await this.provider.getBlockNumber();
    const syncState = await this.getSyncState();
    
    const tokensCount = await this.tokensCollection.countDocuments({
      contract_address: this.contractAddress
    });
    
    const transfersCount = await this.transfersCollection.countDocuments({
      contract_address: this.contractAddress
    });
    
    return {
      last_finalized_block: syncState?.finalized_to_block || 0,
      head_block: headBlock,
      lag: headBlock - (syncState?.finalized_to_block || 0),
      tokens_count: tokensCount,
      transfers_count: transfersCount,
      is_running: this.isRunning,
      progress: this.currentProgress
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.tokensCollection = null;
      this.transfersCollection = null;
      this.syncStateCollection = null;
    }
    
    console.log('🧹 NFT Sync Service cleaned up');
  }
}
