// Shared types for the Lomen Club platform

export interface NFTMetadata {
  _id?: any;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  rarity: NFTRarity;
  // Blockchain enrichment fields
  blockchainData?: BlockchainNFTData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlockchainNFTData {
  owner: string;
  ownerShort: string;
  isOwned: boolean;
  isOnSale: boolean;
  lastOwnerCheck: Date;
  lastSaleCheck: Date;
  network: string;
  note?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTRarity {
  rank: number;
  score: number;
}

export interface NFTQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: NFTFilter[];
}

export interface NFTFilter {
  traitType: string;
  traitValue: string;
  logic?: 'AND' | 'OR';
}

export interface NFTResponse {
  nfts: NFTMetadata[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AvailableTraits {
  [traitType: string]: string[];
}

export interface NFTStats {
  totalNFTs: number;
  avgRarityScore: number;
  minRarityRank: number;
  maxRarityRank: number;
  onSaleCount?: number;
}

// Blockchain Types
export interface NFTOwner {
  tokenId: number;
  owner: string;
  ownerShort: string;
  isOwned: boolean;
  note?: string;
  network?: string;
}

export interface NFTOwnerBatchResponse {
  owners: NFTOwner[];
  failedTokenIds?: number[];
  totalProcessed: number;
  totalFailed: number;
  network?: string;
}

export interface NFTTransaction {
  hash: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'Mint' | 'Transfer' | 'Sale';
}

export interface NFTTransactions {
  tokenId: number;
  transactions: NFTTransaction[];
  total: number;
  network?: string;
}

export interface WalletNFTs {
  wallet: string;
  totalNFTs: number;
  nfts: Array<{
    tokenId: number;
    name: string;
  }>;
  network?: string;
  note?: string;
}

export interface BlockchainStats {
  name: string;
  symbol: string;
  totalSupply: number;
  totalOwners: number | string;
  floorPrice: string;
  volume24h: string;
  marketCap: string;
  network: string;
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: 'success' | 'error';
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  [key: string]: any;
}

// Environment Configuration
export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  kccRpcUrl: string;
  lomenNftContract: string;
  blockchainPort: number;
}

// Admin Types
export interface Admin {
  _id?: any;
  wallet_address: string;
  permissions: AdminPermission[];
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  is_active: boolean;
}

export type AdminPermission = 
  | 'manage_admins'
  | 'manage_nfts'
  | 'manage_users'
  | 'run_sync'
  | 'view_analytics'
  | 'manage_settings';

export interface AdminAction {
  admin_wallet: string;
  action: string;
  target?: string;
  details?: any;
  timestamp: Date;
  ip_address?: string;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
