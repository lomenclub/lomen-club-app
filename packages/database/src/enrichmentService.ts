import { Collection } from 'mongodb';
import { NFTMetadata, AvailableTraits, NFTStats, getBatchSize, KUSWAP_LISTING_WALLET } from '@lomen-club/shared';
import { blockchainEnrichmentService } from '@lomen-club/blockchain';

export class DatabaseEnrichmentService {
  private static instance: DatabaseEnrichmentService;
  private nftsCollection: Collection<NFTMetadata> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseEnrichmentService {
    if (!DatabaseEnrichmentService.instance) {
      DatabaseEnrichmentService.instance = new DatabaseEnrichmentService();
    }
    return DatabaseEnrichmentService.instance;
  }

  public setNFTsCollection(collection: Collection<NFTMetadata>): void {
    this.nftsCollection = collection;
  }

  /**
   * Enrich and update NFTs with blockchain data
   */
  public async enrichAndUpdateNFTs(nfts: NFTMetadata[]): Promise<void> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    const nftsNeedingRefresh = blockchainEnrichmentService.getNFTsNeedingRefresh(nfts);
    
    if (nftsNeedingRefresh.length === 0) {
      console.log('✅ All NFTs have fresh blockchain data');
      return;
    }

    console.log(`🔄 Refreshing blockchain data for ${nftsNeedingRefresh.length} NFTs...`);
    
    // Process in batches - configurable size
    const batchSize = getBatchSize();
    let processed = 0;
    
    for (let i = 0; i < nftsNeedingRefresh.length; i += batchSize) {
      const batch = nftsNeedingRefresh.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1} (NFTs ${i + 1}-${Math.min(i + batchSize, nftsNeedingRefresh.length)})...`);
      
      const enrichedNFTs = await blockchainEnrichmentService.enrichNFTs(batch);

      // Update NFTs in database
      const updatePromises = enrichedNFTs.map(async (nft) => {
        try {
          await this.nftsCollection!.updateOne(
            { tokenId: nft.tokenId },
            { 
              $set: { 
                blockchainData: nft.blockchainData,
                updatedAt: nft.updatedAt
              } 
            }
          );
          console.log(`✅ Updated blockchain data for NFT ${nft.tokenId}`);
          processed++;
        } catch (error) {
          console.error(`Failed to update NFT ${nft.tokenId}:`, error);
        }
      });

      await Promise.allSettled(updatePromises);
      
      // No delays between batches - process as fast as possible
    }
    
    console.log(`✅ Completed blockchain data refresh for ${processed} NFTs`);
  }

  /**
   * Get NFTs with on-sale status from database (READ-ONLY)
   * This is the primary method for API endpoints - no enrichment triggered
   */
  public async getNFTsWithOnSaleStatus(
    query: any = {},
    options: { 
      page?: number; 
      limit?: number; 
      sort?: any;
      onSale?: boolean;
    } = {}
  ): Promise<{ nfts: NFTMetadata[]; total: number }> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    const { page = 1, limit = 20, sort = { tokenId: 1 }, onSale } = options;
    const skip = (page - 1) * limit;

    // Build MongoDB query with on-sale filter
    let mongoQuery = { ...query };
    
    // Only apply on-sale filter when explicitly requested
    if (onSale === true) {
      // NFTs that are on sale (owned by KuSwap wallet)
      // Use case-insensitive matching since blockchain addresses are case-insensitive
      const normalizedKuSwapWallet = KUSWAP_LISTING_WALLET.toLowerCase();
      mongoQuery['blockchainData.owner'] = { 
        $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') 
      };
      console.log(`🔍 On Sale filter: Looking for NFTs owned by ${KUSWAP_LISTING_WALLET} (case-insensitive)`);
    }
    // Note: when onSale is false or undefined, don't apply any filter - show all NFTs

    // Get NFTs with pagination
    const nfts = await this.nftsCollection
      .find(mongoQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await this.nftsCollection.countDocuments(mongoQuery);

    console.log(`🔍 Found ${total} total NFTs matching query, returning ${nfts.length} NFTs`);
    
    // IMPORTANT: No enrichment triggered here - this is a read-only API path
    // Enrichment should happen in background jobs, not during API requests
    
    return { nfts, total };
  }

  /**
   * Get count of NFTs on sale
   */
  public async getOnSaleCount(): Promise<number> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    // Use case-insensitive matching for consistency
    const normalizedKuSwapWallet = KUSWAP_LISTING_WALLET.toLowerCase();
    return await this.nftsCollection.countDocuments({
      'blockchainData.owner': { 
        $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') 
      }
    });
  }

  /**
   * Get NFT by tokenId
   */
  public async getNFTByTokenId(tokenId: number): Promise<NFTMetadata | null> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    return await this.nftsCollection.findOne({ tokenId });
  }

  /**
   * Get available traits for filtering
   */
  public async getAvailableTraits(): Promise<AvailableTraits> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    const traits = await this.nftsCollection.aggregate([
      { $unwind: '$attributes' },
      {
        $group: {
          _id: '$attributes.trait_type',
          values: { $addToSet: '$attributes.value' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const result: AvailableTraits = {};
    traits.forEach((trait: any) => {
      result[trait._id] = trait.values.sort();
    });

    return result;
  }

  /**
   * Get NFT statistics
   */
  public async getNFTStats(): Promise<NFTStats> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    const stats = await this.nftsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalNFTs: { $sum: 1 },
          avgRarityScore: { $avg: '$rarity.score' },
          minRarityRank: { $min: '$rarity.rank' },
          maxRarityRank: { $max: '$rarity.rank' }
        }
      }
    ]).toArray();

    // Get on-sale count from enriched data
    const onSaleCount = await this.getOnSaleCount();

    return stats[0] ? {
      totalNFTs: stats[0].totalNFTs || 0,
      avgRarityScore: stats[0].avgRarityScore || 0,
      minRarityRank: stats[0].minRarityRank || 0,
      maxRarityRank: stats[0].maxRarityRank || 0,
      onSaleCount
    } : {
      totalNFTs: 0,
      avgRarityScore: 0,
      minRarityRank: 0,
      maxRarityRank: 0,
      onSaleCount: 0
    };
  }

  /**
   * Get NFTs owned by specific wallet
   */
  public async getNFTsByOwner(owner: string): Promise<NFTMetadata[]> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    // Use case-insensitive regex matching for consistency with other methods
    // Blockchain addresses are case-insensitive in practice
    const normalizedOwner = owner.toLowerCase();
    
    return await this.nftsCollection
      .find({ 
        'blockchainData.owner': { 
          $regex: new RegExp(`^${normalizedOwner}$`, 'i') 
        }
      })
      .sort({ tokenId: 1 })
      .toArray();
  }

  /**
   * Initialize blockchain data for all NFTs (first-time setup)
   */
  public async initializeBlockchainData(): Promise<void> {
    if (!this.nftsCollection) {
      throw new Error('NFTs collection not set. Call setNFTsCollection() first.');
    }

    console.log('🚀 Initializing blockchain data for all NFTs...');
    
    // Get all NFTs without blockchain data
    const nftsWithoutData = await this.nftsCollection
      .find({ blockchainData: { $exists: false } })
      .toArray();

    if (nftsWithoutData.length === 0) {
      console.log('✅ All NFTs already have blockchain data');
      return;
    }

    console.log(`🔍 Found ${nftsWithoutData.length} NFTs without blockchain data`);
    
    // Enrich in batches - configurable size
    const batchSize = getBatchSize();
    for (let i = 0; i < nftsWithoutData.length; i += batchSize) {
      const batch = nftsWithoutData.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}...`);
      
      await this.enrichAndUpdateNFTs(batch);
      
      // No delays between batches - process as fast as possible
    }

    console.log('✅ Blockchain data initialization completed');
  }
}

export const databaseEnrichmentService = DatabaseEnrichmentService.getInstance();
