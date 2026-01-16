import { NFTMetadata, NFTQueryParams, NFTResponse, AvailableTraits, NFTStats } from '@lomen-club/shared';
import { NFTQueryDto, NFTQueryValidation } from '@lomen-club/shared';
import { syncDataService } from '@lomen-club/database';
import { AppError } from '@lomen-club/shared';

export class NFTServiceV2 {
  private static instance: NFTServiceV2;

  private constructor() {}

  public static getInstance(): NFTServiceV2 {
    if (!NFTServiceV2.instance) {
      NFTServiceV2.instance = new NFTServiceV2();
    }
    return NFTServiceV2.instance;
  }

  /**
   * Get NFTs with pagination, filtering, and sorting
   */
  public async getNFTs(query: NFTQueryDto): Promise<NFTResponse> {
    // Validate query parameters
    const validationErrors = NFTQueryValidation.validate(query);
    if (validationErrors.length > 0) {
      throw new AppError(`Invalid query parameters: ${validationErrors.join(', ')}`);
    }

    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'tokenId',
        sortOrder = 'asc',
        search = '',
        filters = [],
        onSale = false
      } = query;

      // Build sort object for tokens collection
      let sort: any = {};
      if (sortBy === 'tokenId') {
        sort = { token_id: sortOrder === 'asc' ? 1 : -1 };
      } else if (sortBy === 'rarityRank') {
        // Note: Rarity data is in nfts collection, not tokens
        // For now, sort by token_id
        sort = { token_id: sortOrder === 'asc' ? 1 : -1 };
      } else {
        // Other sorts not supported in tokens collection
        sort = { token_id: 1 };
      }

      // Get NFTs from sync data service
      const { nfts, total } = await syncDataService.getNFTs(
        {}, // Empty query for now (filters not implemented in syncDataService yet)
        {
          page: Number(page),
          limit: Number(limit),
          sort,
          onSale: onSale === true
        }
      );

      return {
        nfts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw new AppError('Failed to fetch NFTs', 500);
    }
  }

  /**
   * Get single NFT by tokenId
   */
  public async getNFT(tokenId: number): Promise<NFTMetadata> {
    if (!tokenId || tokenId < 0) {
      throw new AppError('Invalid tokenId', 400);
    }

    try {
      const nft = await syncDataService.getNFTByTokenId(tokenId);
      
      if (!nft) {
        throw new AppError('NFT not found', 404);
      }

      return nft;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error fetching NFT:', error);
      throw new AppError('Failed to fetch NFT', 500);
    }
  }

  /**
   * Get available traits for filtering
   */
  public async getAvailableTraits(): Promise<AvailableTraits> {
    try {
      return await syncDataService.getAvailableTraits();
    } catch (error) {
      console.error('Error fetching available traits:', error);
      throw new AppError('Failed to fetch available traits', 500);
    }
  }

  /**
   * Get NFT statistics including on-sale count
   */
  public async getNFTStats(): Promise<NFTStats> {
    try {
      return await syncDataService.getNFTStats();
    } catch (error) {
      console.error('Error fetching NFT stats:', error);
      throw new AppError('Failed to fetch NFT stats', 500);
    }
  }

  /**
   * Get NFTs on sale (convenience method)
   */
  public async getNFTsOnSale(query: NFTQueryDto): Promise<NFTResponse> {
    return this.getNFTs({
      ...query,
      onSale: true
    });
  }

  /**
   * Get sync status
   */
  public async getSyncStatus(): Promise<{
    total_tokens: number;
    total_transfers: number;
    expected_tokens: number;
    is_complete: boolean;
    last_synced_block: number;
  }> {
    try {
      return await syncDataService.getSyncStatus();
    } catch (error) {
      console.error('Error fetching sync status:', error);
      throw new AppError('Failed to fetch sync status', 500);
    }
  }
}

export const nftServiceV2 = NFTServiceV2.getInstance();
