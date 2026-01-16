// Data Transfer Objects for API communication

import { NFTMetadata, NFTQueryParams, NFTFilter, NFTResponse, AvailableTraits, NFTStats } from './types';

// NFT Query DTO
export interface NFTQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: NFTFilter[];
  onSale?: boolean;
}

// NFT Response DTO
export interface NFTResponseDto {
  nfts: NFTMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation DTOs
export class CreateNFTDto {
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

  constructor(data: Partial<CreateNFTDto>) {
    Object.assign(this, data);
  }

  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.tokenId || this.tokenId < 0) {
      errors.push('tokenId must be a positive number');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('name is required');
    }
    
    if (!this.description || this.description.trim().length === 0) {
      errors.push('description is required');
    }
    
    if (!this.image || this.image.trim().length === 0) {
      errors.push('image URL is required');
    }
    
    if (!this.attributes || !Array.isArray(this.attributes)) {
      errors.push('attributes must be an array');
    }
    
    if (!this.rarity || typeof this.rarity !== 'object') {
      errors.push('rarity object is required');
    }
    
    return errors;
  }
}

export class UpdateNFTDto {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  rarity?: {
    rank: number;
    score: number;
  };

  constructor(data: Partial<UpdateNFTDto>) {
    Object.assign(this, data);
  }

  validate(): string[] {
    const errors: string[] = [];
    
    if (this.name && this.name.trim().length === 0) {
      errors.push('name cannot be empty');
    }
    
    if (this.description && this.description.trim().length === 0) {
      errors.push('description cannot be empty');
    }
    
    if (this.image && this.image.trim().length === 0) {
      errors.push('image URL cannot be empty');
    }
    
    if (this.attributes && !Array.isArray(this.attributes)) {
      errors.push('attributes must be an array');
    }
    
    return errors;
  }
}

// Query validation
export class NFTQueryValidation {
  static validate(query: NFTQueryDto): string[] {
    const errors: string[] = [];
    
    if (query.page && query.page < 1) {
      errors.push('page must be at least 1');
    }
    
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      errors.push('limit must be between 1 and 100');
    }
    
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      errors.push('sortOrder must be "asc" or "desc"');
    }
    
    if (query.filters && !Array.isArray(query.filters)) {
      errors.push('filters must be an array');
    }
    
    return errors;
  }
}
