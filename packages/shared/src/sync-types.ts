// Types for NFT sync pipeline

export interface TokenDocument {
  // Core identifiers
  contract_address: string;
  token_id: number;
  
  // Current state
  owner_address: string;
  token_uri: string | null;
  
  // Metadata (cached from tokenURI if available)
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  
  // Last transfer information
  last_transfer_block: number;
  last_transfer_tx_hash: string;
  last_transfer_log_index: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  
  // Sync tracking
  last_synced_block: number;
  last_synced_at: Date;
}

export interface TransferEvent {
  // Unique identifier
  tx_hash: string;
  log_index: number;
  
  // Event data
  contract_address: string;
  token_id: number;
  from_address: string;
  to_address: string;
  
  // Block information
  block_number: number;
  block_hash: string;
  block_timestamp: number;
  
  // Transaction information
  tx_index: number;
  
  // Sync tracking
  processed_at: Date;
}

export interface SyncState {
  // Sync identifier
  contract_address: string;
  sync_type: 'full' | 'incremental';
  
  // Progress tracking
  start_block: number;
  current_block: number;
  finalized_to_block: number;
  head_block: number;
  
  // Statistics
  tokens_discovered: number;
  tokens_enriched: number;
  transfers_processed: number;
  
  // Timing
  started_at: Date;
  last_updated_at: Date;
  completed_at: Date | null;
  
  // Configuration
  confirmations: number;
  batch_size: number;
  
  // Error tracking
  last_error?: string;
  error_count: number;
}

export interface SyncConfig {
  // Required configuration
  rpc_url: string;
  contract_address: string;
  mongodb_uri: string;
  
  // Optional configuration with defaults
  from_block?: number; // If not provided, will discover from first Transfer event
  confirmations?: number; // Default: 20 blocks
  batch_size?: number; // Default: 1000 blocks per batch
  max_retries?: number; // Default: 3
  retry_delay_ms?: number; // Default: 1000
  
  // Performance tuning
  max_blocks_per_second?: number; // Rate limiting
  max_requests_per_second?: number; // Rate limiting
  
  // WebSocket for real-time updates (optional)
  ws_url?: string;
}

export interface SyncProgress {
  // Current state
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  phase: 'initializing' | 'scanning' | 'enriching' | 'verifying' | 'finalizing';
  
  // Progress metrics
  start_block: number;
  current_block: number;
  head_block: number;
  finalized_to_block: number;
  
  // Statistics
  blocks_processed: number;
  blocks_remaining: number;
  blocks_per_second: number;
  estimated_time_remaining_seconds: number;
  
  // Data metrics
  tokens_discovered: number;
  tokens_enriched: number;
  transfers_processed: number;
  events_per_second: number;
  
  // Timestamps
  started_at: Date;
  last_update_at: Date;
  
  // Error information (if any)
  error?: string;
  retry_count: number;
}

export interface VerificationResult {
  // Sample verification
  sample_size: number;
  tokens_checked: number;
  tokens_matched: number;
  tokens_mismatched: number;
  
  // Mismatch details
  mismatches: Array<{
    token_id: number;
    field: 'owner' | 'token_uri';
    expected: string;
    actual: string;
    block_number: number;
  }>;
  
  // Collection verification
  total_tokens_in_db: number;
  expected_total_tokens: number;
  total_transfers_in_db: number;
  
  // Status
  passed: boolean;
  timestamp: Date;
}

export interface ReorgDetection {
  detected: boolean;
  affected_block_range: {
    from: number;
    to: number;
  };
  mismatched_blocks: Array<{
    block_number: number;
    expected_hash: string;
    actual_hash: string;
  }>;
  action_taken: 'none' | 'rollback' | 'reprocess';
  rollback_count: number;
}
