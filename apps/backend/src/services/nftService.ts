import { NFTMetadata, NFTQueryParams, NFTResponse, AvailableTraits, NFTStats } from '@lomen-club/shared';
import { NFTQueryDto, NFTQueryValidation } from '@lomen-club/shared';
import { databaseEnrichmentService } from '@lomen-club/database';
import { AppError } from '@lomen-club/shared';

export class NFTService {
  private static instance: NFTService;

  private constructor() {}

  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  /**
   * Get NFTs with pagination, filtering, and sorting
   */
  public async getNFTs(query: NFTQueryDto): Promise<NFTResponse> {
    // Validate query parameters
    const validationErrors = NFTQueryValidation.validate(query);
    if (validationErrors.length > 0) {
      throw new AppError(`Invalid query parameters: ${validationErrors.join(', ')}`, 400);
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

      // Build MongoDB query
      let mongoQuery: any = {};
      
      // Search filter
      if (search) {
        mongoQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { 'attributes.value': { $regex: search, $options: 'i' } }
        ];
      }

      // Attribute filters
      if (filters.length > 0) {
        const filterConditions = filters.map((filter) => ({
          'attributes': {
            $elemMatch: {
              trait_type: filter.traitType,
              value: filter.traitValue
            }
          }
        }));

        if (filters[0].logic === 'AND') {
          mongoQuery.$and = filterConditions;
        } else {
          mongoQuery.$or = filterConditions;
        }
      }

      // Build sort object
      const sort: any = {};
      if (sortBy === 'rarityRank') {
        sort['rarity.rank'] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
      }

      // Get NFTs with on-sale filtering using enriched blockchain data
      const { nfts, total } = await databaseEnrichmentService.getNFTsWithOnSaleStatus(
        mongoQuery,
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
   * Get single NFT by tokenId (READ-ONLY)
   */
  public async getNFT(tokenId: number): Promise<NFTMetadata> {
    if (!tokenId || tokenId < 0) {
      throw new AppError('Invalid tokenId', 400);
    }

    try {
      const nft = await databaseEnrichmentService.getNFTByTokenId(tokenId);
      
      if (!nft) {
        throw new AppError('NFT not found', 404);
      }

      // IMPORTANT: No enrichment triggered here - this is a read-only API path
      // Enrichment should happen in background jobs, not during API requests
      
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
      return await databaseEnrichmentService.getAvailableTraits();
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
      return await databaseEnrichmentService.getNFTStats();
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
}

export const nftService = NFTService.getInstance();
