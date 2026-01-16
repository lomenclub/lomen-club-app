const API_BASE_URL = 'http://localhost:3002/api';

export interface NFTMetadata {
  _id: number;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  rarity: {
    rank: number;
    score: number;
  };
  createdAt: string;
  updatedAt: string;
  blockchainData?: {
    owner: string;
    ownerShort: string;
    isOwned: boolean;
    isOnSale: boolean;
    lastOwnerCheck: string;
    lastSaleCheck: string;
    network: string;
    note?: string | null;
  };
}

export interface FilterState {
  traitType: string;
  traitValue: string;
  logic: 'AND' | 'OR';
}

export interface NFTsResponse {
  nfts: NFTMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AvailableTraits {
  [traitType: string]: string[];
}

export interface NFTStats {
  totalNFTs: number;
  avgRarityScore: number;
  minRarityRank: number;
  maxRarityRank: number;
}

class NFTService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getNFTs(params: {
    page?: number;
    limit?: number;
    sortBy?: 'tokenId' | 'rarityRank';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: FilterState[];
    onSale?: boolean;
  }): Promise<NFTsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);
    if (params.filters && params.filters.length > 0) {
      queryParams.append('filters', JSON.stringify(params.filters));
    }
    if (params.onSale) {
      queryParams.append('onSale', 'true');
    }

    const response = await fetch(`${this.baseUrl}/nfts?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }

    return response.json();
  }

  async getNFT(tokenId: number): Promise<NFTMetadata> {
    const response = await fetch(`${this.baseUrl}/nfts/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFT ${tokenId}: ${response.statusText}`);
    }

    return response.json();
  }

  async getAvailableTraits(): Promise<AvailableTraits> {
    const response = await fetch(`${this.baseUrl}/nfts/traits/available`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available traits: ${response.statusText}`);
    }

    return response.json();
  }

  async getNFTStats(): Promise<NFTStats> {
    const response = await fetch(`${this.baseUrl}/nfts/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFT stats: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const nftService = new NFTService();
