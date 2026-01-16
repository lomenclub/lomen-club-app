import { blockchainEnrichmentService } from '@lomen-club/blockchain';
import { databaseEnrichmentService, syncDataService } from '@lomen-club/database';
import { AppError, fetchJsonWithTimeout, isValidWalletAddress } from '@lomen-club/shared';

// Default timeout for service calls (30 seconds)
const DEFAULT_SERVICE_TIMEOUT_MS = 30 * 1000;

export interface WalletNFTsResponse {
  wallet: string;
  totalNFTs: number;
  nfts: Array<{
    tokenId: number;
    name: string;
    image: string;
    rarity: {
      rank: number;
      score: number;
    };
    blockchainData?: {
      owner: string;
      ownerShort: string;
      isOwned: boolean;
      isOnSale: boolean;
      lastOwnerCheck: Date;
      lastSaleCheck: Date;
      network: string;
      note?: string;
    };
  }>;
}

export class WalletService {
  private static instance: WalletService;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Get all NFTs owned by a specific wallet address
   */
  public async getNFTsByWallet(walletAddress: string): Promise<WalletNFTsResponse> {
    if (!isValidWalletAddress(walletAddress)) {
      throw new AppError('Invalid wallet address', 400);
    }

    try {
      // First, get the actual owned NFTs from blockchain service with timeout
      console.log(`🔍 Fetching actual owned NFTs for wallet ${walletAddress} from blockchain...`);
      const blockchainData = await fetchJsonWithTimeout<any>(
        `http://localhost:3003/api/wallets/${walletAddress}/nfts`,
        {},
        DEFAULT_SERVICE_TIMEOUT_MS
      );
      console.log(`📊 Blockchain service reports ${blockchainData.totalNFTs} NFTs owned by ${walletAddress}`);

      // Get NFTs from database that are owned by this wallet
      const databaseNFTs = await databaseEnrichmentService.getNFTsByOwner(walletAddress);
      console.log(`💾 Database has ${databaseNFTs.length} NFTs recorded for ${walletAddress}`);

      // If blockchain shows more NFTs than database, we need to update the database
      if (blockchainData.totalNFTs > databaseNFTs.length) {
        console.log(`🔄 Blockchain shows ${blockchainData.totalNFTs - databaseNFTs.length} more NFTs than database. Need to update database.`);
        // Note: We can't get specific token IDs from blockchain service yet, so we'll rely on database enrichment
      }

      // Enrich NFTs with latest blockchain data
      const nftsNeedingRefresh = blockchainEnrichmentService.getNFTsNeedingRefresh(databaseNFTs);
      if (nftsNeedingRefresh.length > 0) {
        console.log(`🔄 Refreshing blockchain data for ${nftsNeedingRefresh.length} NFTs...`);
        await databaseEnrichmentService.enrichAndUpdateNFTs(nftsNeedingRefresh);
        
        // Re-fetch the NFTs to get updated data
        const updatedNFTs = await databaseEnrichmentService.getNFTsByOwner(walletAddress);
        
        return {
          wallet: walletAddress,
          totalNFTs: updatedNFTs.length,
          nfts: updatedNFTs.map(nft => ({
            tokenId: nft.tokenId,
            name: nft.name,
            image: nft.image,
            rarity: nft.rarity,
            blockchainData: nft.blockchainData
          }))
        };
      }

      return {
        wallet: walletAddress,
        totalNFTs: databaseNFTs.length,
        nfts: databaseNFTs.map(nft => ({
          tokenId: nft.tokenId,
          name: nft.name,
          image: nft.image,
          rarity: nft.rarity,
          blockchainData: nft.blockchainData
        }))
      };
    } catch (error) {
      console.error(`Error fetching NFTs for wallet ${walletAddress}:`, error);
      throw new AppError('Failed to fetch NFTs', 500);
    }
  }

  /**
   * Get token IDs owned by a specific wallet address
   */
  public async getTokenIdsByWallet(walletAddress: string): Promise<number[]> {
    if (!isValidWalletAddress(walletAddress)) {
      throw new AppError('Invalid wallet address', 400);
    }

    try {
      const nfts = await databaseEnrichmentService.getNFTsByOwner(walletAddress);
      return nfts.map(nft => nft.tokenId);
    } catch (error) {
      console.error(`Error fetching token IDs for wallet ${walletAddress}:`, error);
      throw new AppError('Failed to fetch token IDs', 500);
    }
  }

  /**
   * Check if a wallet owns specific NFTs
   */
  public async checkWalletOwnership(walletAddress: string, tokenIds: number[]): Promise<{ [tokenId: number]: boolean }> {
    if (!isValidWalletAddress(walletAddress)) {
      throw new AppError('Invalid wallet address', 400);
    }

    if (!tokenIds || tokenIds.length === 0) {
      throw new AppError('No token IDs provided', 400);
    }

    try {
      const walletNFTs = await this.getNFTsByWallet(walletAddress);
      const ownedTokenIds = new Set(walletNFTs.nfts.map(nft => nft.tokenId));
      
      const ownership: { [tokenId: number]: boolean } = {};
      tokenIds.forEach(tokenId => {
        ownership[tokenId] = ownedTokenIds.has(tokenId);
      });

      return ownership;
    } catch (error) {
      console.error(`Error checking ownership for wallet ${walletAddress}, token IDs: ${tokenIds.join(', ')}:`, error);
      throw new AppError('Failed to check ownership', 500);
    }
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
    try {
      // Use the syncDataService to get real wallet holder statistics from the database
      const stats = await syncDataService.getWalletHolderStats();
      return stats;
    } catch (error) {
      console.error('Error fetching wallet holder stats:', error);
      throw new AppError('Failed to fetch wallet holder statistics', 500);
    }
  }
}

export const walletService = WalletService.getInstance();
