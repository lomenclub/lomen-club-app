import { Collection, Db } from 'mongodb';
import { NFTMetadata, NFTStats, AvailableTraits } from '@lomen-club/shared';
import { TokenDocument, TransferEvent } from '@lomen-club/shared';

export class SyncDataService {
  private static instance: SyncDataService;
  private db: Db | null = null;
  
  // Collections
  private tokensCollection: Collection<TokenDocument> | null = null;
  private transfersCollection: Collection<TransferEvent> | null = null;
  private nftsCollection: Collection<NFTMetadata> | null = null;

  private constructor() {}

  public static getInstance(): SyncDataService {
    if (!SyncDataService.instance) {
      SyncDataService.instance = new SyncDataService();
    }
    return SyncDataService.instance;
  }

  /**
   * Initialize the service with database connection
   */
  public async initialize(db: Db): Promise<void> {
    this.db = db;
    this.tokensCollection = db.collection<TokenDocument>('tokens');
    this.transfersCollection = db.collection<TransferEvent>('transfers');
    this.nftsCollection = db.collection<NFTMetadata>('nfts');
    
    console.log('✅ Sync Data Service initialized');
  }

  /**
   * Convert TokenDocument to NFTMetadata
   */
  private convertTokenToNFT(token: TokenDocument): NFTMetadata {
    // Extract metadata from token_uri if available
    let metadata = token.metadata || {};
    
    // Create NFTMetadata structure
    const nft: NFTMetadata = {
      tokenId: token.token_id,
      name: metadata.name || `Lomen NFT #${token.token_id}`,
      description: metadata.description || 'A unique Lomen Club NFT',
      image: metadata.image || `/images/nfts/${token.token_id}.webp`,
      attributes: metadata.attributes || [],
      rarity: {
        rank: 0,
        score: 0
      },
      blockchainData: {
        owner: token.owner_address,
        ownerShort: this.formatWalletAddress(token.owner_address),
        isOwned: token.owner_address !== '0x0000000000000000000000000000000000000000',
        isOnSale: false, // Will be determined by separate logic
        lastOwnerCheck: token.last_synced_at,
        lastSaleCheck: token.last_synced_at,
        network: 'KCC Mainnet'
      },
      createdAt: token.created_at,
      updatedAt: token.updated_at
    };

    return nft;
  }

  /**
   * Format wallet address for display
   */
  private formatWalletAddress(address: string): string {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Not Owned';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get NFT by tokenId from synced data
   */
  public async getNFTByTokenId(tokenId: number): Promise<NFTMetadata | null> {
    if (!this.tokensCollection) {
      throw new Error('Service not initialized');
    }

    const token = await this.tokensCollection.findOne({
      token_id: tokenId
    });

    if (!token) {
      return null;
    }

    return this.convertTokenToNFT(token);
  }

  /**
   * Get NFTs with pagination and filtering
   */
  public async getNFTs(
    query: any = {},
    options: { 
      page?: number; 
      limit?: number; 
      sort?: any;
      onSale?: boolean;
    } = {}
  ): Promise<{ nfts: NFTMetadata[]; total: number }> {
    if (!this.tokensCollection) {
      throw new Error('Service not initialized');
    }

    const { page = 1, limit = 20, sort = { token_id: 1 }, onSale } = options;
    const skip = (page - 1) * limit;

    // Build MongoDB query
    let mongoQuery: any = {};
    
    // Apply on-sale filter if specified
    if (onSale !== undefined) {
      // This would need to check against KuSwap listing wallet
      // For now, we'll implement basic filtering
      const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
      const normalizedKuSwapWallet = KUSWAP_LISTING_WALLET.toLowerCase();
      if (onSale) {
        mongoQuery.owner_address = { 
          $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') 
        };
      } else {
        mongoQuery.owner_address = { 
          $not: { $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') }
        };
      }
    }

    // Get tokens with pagination
    const tokens = await this.tokensCollection
      .find(mongoQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await this.tokensCollection.countDocuments(mongoQuery);

    // Convert tokens to NFTs
    const nfts = tokens.map(token => this.convertTokenToNFT(token));

    return { nfts, total };
  }

  /**
   * Get available traits for filtering
   */
  public async getAvailableTraits(): Promise<AvailableTraits> {
    if (!this.nftsCollection) {
      throw new Error('Service not initialized');
    }

    // For now, use the existing nfts collection for traits
    // In the future, we might want to store traits in tokens collection
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
    if (!this.tokensCollection || !this.nftsCollection) {
      throw new Error('Service not initialized');
    }

    // Get total tokens count
    const totalTokens = await this.tokensCollection.countDocuments();
    
    // Get on-sale count
    const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
    const normalizedKuSwapWallet = KUSWAP_LISTING_WALLET.toLowerCase();
    const onSaleCount = await this.tokensCollection.countDocuments({
      owner_address: { 
        $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') 
      }
    });

    // Get rarity stats from nfts collection
    const rarityStats = await this.nftsCollection.aggregate([
      {
        $group: {
          _id: null,
          avgRarityScore: { $avg: '$rarity.score' },
          minRarityRank: { $min: '$rarity.rank' },
          maxRarityRank: { $max: '$rarity.rank' }
        }
      }
    ]).toArray();

    return {
      totalNFTs: totalTokens,
      avgRarityScore: rarityStats[0]?.avgRarityScore || 0,
      minRarityRank: rarityStats[0]?.minRarityRank || 0,
      maxRarityRank: rarityStats[0]?.maxRarityRank || 0,
      onSaleCount
    };
  }

  /**
   * Get NFTs owned by specific wallet
   */
  public async getNFTsByOwner(owner: string): Promise<NFTMetadata[]> {
    if (!this.tokensCollection) {
      throw new Error('Service not initialized');
    }

    // Normalize address for case-insensitive matching
    const normalizedOwner = owner.toLowerCase();
    
    const tokens = await this.tokensCollection
      .find({ 
        owner_address: normalizedOwner
      })
      .sort({ token_id: 1 })
      .toArray();

    return tokens.map(token => this.convertTokenToNFT(token));
  }

  /**
   * Get transfer history for a token
   */
  public async getTokenTransfers(tokenId: number): Promise<TransferEvent[]> {
    if (!this.transfersCollection) {
      throw new Error('Service not initialized');
    }

    return await this.transfersCollection
      .find({ token_id: tokenId })
      .sort({ block_number: -1 })
      .toArray();
  }

  /**
   * Get wallet transfer history
   */
  public async getWalletTransfers(walletAddress: string): Promise<TransferEvent[]> {
    if (!this.transfersCollection) {
      throw new Error('Service not initialized');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    
    return await this.transfersCollection
      .find({
        $or: [
          { from_address: normalizedAddress },
          { to_address: normalizedAddress }
        ]
      })
      .sort({ block_number: -1 })
      .toArray();
  }

  /**
   * Check if sync data is complete (has all 10,000 tokens)
   */
  public async isSyncComplete(): Promise<boolean> {
    if (!this.tokensCollection) {
      return false;
    }

    const count = await this.tokensCollection.countDocuments();
    return count === 10000;
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
    if (!this.tokensCollection || !this.transfersCollection) {
      throw new Error('Service not initialized');
    }

    const totalTokens = await this.tokensCollection.countDocuments();
    const totalTransfers = await this.transfersCollection.countDocuments();
    
    // Get the highest last_synced_block
    const latestToken = await this.tokensCollection
      .find()
      .sort({ last_synced_block: -1 })
      .limit(1)
      .toArray();

    return {
      total_tokens: totalTokens,
      total_transfers: totalTransfers,
      expected_tokens: 10000,
      is_complete: totalTokens === 10000,
      last_synced_block: latestToken[0]?.last_synced_block || 0
    };
  }

  /**
   * Get wallet holder statistics
   */
  public async getWalletHolderStats(): Promise<{
    totalHolders: number;
    totalNFTs: number;
    onSaleCount: number;
    topWallets: Array<{
      wallet: string;
      walletShort: string;
      nftCount: number;
      percentage: number;
    }>;
  }> {
    if (!this.tokensCollection) {
      throw new Error('Service not initialized');
    }

    // Get total NFTs count
    const totalNFTs = await this.tokensCollection.countDocuments();
    
    // Get on-sale count (NFTs owned by KuSwap listing wallet)
    const KUSWAP_LISTING_WALLET = '0xD6B69d820872C40dCdaAB2b35cd1C805a33AB16C';
    const normalizedKuSwapWallet = KUSWAP_LISTING_WALLET.toLowerCase();
    const onSaleCount = await this.tokensCollection.countDocuments({
      owner_address: { 
        $regex: new RegExp(`^${normalizedKuSwapWallet}$`, 'i') 
      }
    });

    // Get unique wallet holders (excluding zero address and KuSwap listing wallet)
    const uniqueHolders = await this.tokensCollection.aggregate([
      {
        $match: {
          owner_address: {
            $nin: [
              '0x0000000000000000000000000000000000000000',
              normalizedKuSwapWallet
            ]
          }
        }
      },
      {
        $group: {
          _id: '$owner_address'
        }
      },
      {
        $count: 'totalHolders'
      }
    ]).toArray();

    const totalHolders = uniqueHolders[0]?.totalHolders || 0;

    // Get top wallets by NFT count
    const topWalletsAggregation = await this.tokensCollection.aggregate([
      {
        $match: {
          owner_address: {
            $nin: [
              '0x0000000000000000000000000000000000000000',
              normalizedKuSwapWallet
            ]
          }
        }
      },
      {
        $group: {
          _id: '$owner_address',
          nftCount: { $sum: 1 }
        }
      },
      {
        $sort: { nftCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          wallet: '$_id',
          nftCount: 1,
          percentage: {
            $divide: ['$nftCount', totalNFTs]
          }
        }
      }
    ]).toArray();

    // Format the results
    const topWallets = topWalletsAggregation.map((wallet: any) => ({
      wallet: wallet.wallet,
      walletShort: this.formatWalletAddress(wallet.wallet),
      nftCount: wallet.nftCount,
      percentage: wallet.percentage
    }));

    return {
      totalHolders,
      totalNFTs,
      onSaleCount,
      topWallets
    };
  }
}

export const syncDataService = SyncDataService.getInstance();
