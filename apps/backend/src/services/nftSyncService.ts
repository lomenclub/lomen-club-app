import { databaseService } from '@lomen-club/database';
import { blockchainEnrichmentService } from '@lomen-club/blockchain';
import { databaseEnrichmentService } from '@lomen-club/database';
import { AppError, fetchJsonWithTimeout } from '@lomen-club/shared';

// Default timeout for service calls (30 seconds)
const DEFAULT_SERVICE_TIMEOUT_MS = 30 * 1000;

export interface SyncResult {
  wallet: string;
  totalNFTs: number;
  nftsFound: number;
  nftsUpdated: number;
  nftsAdded: number;
  errors: string[];
}

export class NFTSyncService {
  private static instance: NFTSyncService;

  private constructor() {}

  public static getInstance(): NFTSyncService {
    if (!NFTSyncService.instance) {
      NFTSyncService.instance = new NFTSyncService();
    }
    return NFTSyncService.instance;
  }

  /**
   * Sync NFTs for a specific wallet - update ownership data for all NFTs
   */
  public async syncWalletNFTs(walletAddress: string): Promise<SyncResult> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const result: SyncResult = {
      wallet: walletAddress,
      totalNFTs: 0,
      nftsFound: 0,
      nftsUpdated: 0,
      nftsAdded: 0,
      errors: []
    };

    try {
      console.log(`🔄 Starting NFT sync for wallet: ${walletAddress}`);

      // Get total NFT count from blockchain service with timeout
      const blockchainData = await fetchJsonWithTimeout<any>(
        `http://localhost:3003/api/wallets/${walletAddress}/nfts`,
        {},
        DEFAULT_SERVICE_TIMEOUT_MS
      );
      result.totalNFTs = blockchainData.totalNFTs;
      console.log(`📊 Blockchain reports ${result.totalNFTs} NFTs for wallet ${walletAddress}`);

      // Get current NFTs from database
      const currentNFTs = await databaseEnrichmentService.getNFTsByOwner(walletAddress);
      result.nftsFound = currentNFTs.length;
      console.log(`💾 Database has ${result.nftsFound} NFTs for wallet ${walletAddress}`);

      // If there's a discrepancy, perform a comprehensive scan
      if (result.totalNFTs > result.nftsFound) {
        console.log(`🔄 Blockchain shows ${result.totalNFTs - result.nftsFound} more NFTs than database. Performing comprehensive scan...`);
        const forceResult = await this.forceRefreshWalletNFTs(walletAddress);
        result.nftsFound = forceResult.nftsFound;
        result.nftsUpdated = forceResult.nftsUpdated;
        result.errors = [...result.errors, ...forceResult.errors];
      } else {
        // Update blockchain data for current NFTs
        if (currentNFTs.length > 0) {
          console.log(`🔄 Updating blockchain data for ${currentNFTs.length} existing NFTs...`);
          await databaseEnrichmentService.enrichAndUpdateNFTs(currentNFTs);
          result.nftsUpdated = currentNFTs.length;
        }
      }

      console.log(`✅ NFT sync completed for wallet ${walletAddress}`);
      console.log(`   - Total NFTs (blockchain): ${result.totalNFTs}`);
      console.log(`   - NFTs in database: ${result.nftsFound}`);
      console.log(`   - NFTs updated: ${result.nftsUpdated}`);

      return result;

    } catch (error) {
      console.error(`❌ NFT sync failed for wallet ${walletAddress}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during sync');
      throw new AppError(`Failed to sync NFTs for wallet: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Force refresh all NFTs for a wallet by checking each NFT individually
   * This is a more comprehensive but slower approach
   */
  public async forceRefreshWalletNFTs(walletAddress: string): Promise<SyncResult> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    const result: SyncResult = {
      wallet: walletAddress,
      totalNFTs: 0,
      nftsFound: 0,
      nftsUpdated: 0,
      nftsAdded: 0,
      errors: []
    };

    try {
      console.log(`🔄 Starting force refresh for wallet: ${walletAddress}`);

      // Get total NFT count from blockchain service with timeout
      const blockchainData = await fetchJsonWithTimeout<any>(
        `http://localhost:3003/api/wallets/${walletAddress}/nfts`,
        {},
        DEFAULT_SERVICE_TIMEOUT_MS
      );
      result.totalNFTs = blockchainData.totalNFTs;

      // Get all NFTs from database
      const nftsCollection = databaseService.getNFTsCollection();
      const userNFTsCollection = databaseService.getUserNFTsCollection();
      const allNFTs = await nftsCollection.find({}).toArray();

      console.log(`🔍 Checking ownership for ${allNFTs.length} NFTs...`);

      // Check each NFT to see if it's owned by this wallet
      const batchSize = parseInt(process.env.BATCH_SIZE || '100');
      let processed = 0;
      const ownedTokenIds: number[] = [];
      const ownedNFTs: any[] = [];

      for (let i = 0; i < allNFTs.length; i += batchSize) {
        const batch = allNFTs.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1} (NFTs ${i + 1}-${Math.min(i + batchSize, allNFTs.length)})...`);

        const batchPromises = batch.map(async (nft) => {
          try {
            // Check if this NFT is owned by the wallet
            const ownerData = await blockchainEnrichmentService.fetchCurrentOwner(nft.tokenId);
            const isOwnedByWallet = ownerData.owner.toLowerCase() === walletAddress.toLowerCase();

            if (isOwnedByWallet) {
              result.nftsFound++;
              ownedTokenIds.push(nft.tokenId);
              ownedNFTs.push(nft);
              
              // Add to user_nfts collection
              const userNFT = {
                wallet_address: walletAddress.toLowerCase(),
                nft_token_id: nft.tokenId,
                metadata: {
                  name: nft.name,
                  image: nft.image,
                  rarity: nft.rarity,
                  attributes: nft.attributes
                },
                last_synced_at: new Date(),
                created_at: new Date()
              };
              
              await userNFTsCollection.updateOne(
                { wallet_address: walletAddress.toLowerCase(), nft_token_id: nft.tokenId },
                { $set: userNFT },
                { upsert: true }
              );
              
              console.log(`✅ Added NFT ${nft.tokenId} to user_nfts collection`);
            }

            // Update the NFT with current blockchain data
            const enrichedNFT = await blockchainEnrichmentService.enrichNFT(nft);
            await nftsCollection.updateOne(
              { tokenId: nft.tokenId },
              { 
                $set: { 
                  blockchainData: enrichedNFT.blockchainData,
                  updatedAt: enrichedNFT.updatedAt
                } 
              }
            );

            processed++;
            return { success: true, tokenId: nft.tokenId, owned: isOwnedByWallet };
          } catch (error) {
            console.error(`❌ Failed to process NFT ${nft.tokenId}:`, error);
            return { success: false, tokenId: nft.tokenId, error };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((batchResult) => {
          if (batchResult.status === 'fulfilled' && !batchResult.value.success) {
            result.errors.push(`Failed to process NFT ${batchResult.value.tokenId}`);
          }
        });

        // No delays between batches - process as fast as possible
      }

      result.nftsUpdated = processed;
      result.nftsAdded = ownedNFTs.length;
      
      // Clean up NFTs no longer owned by this wallet
      if (ownedTokenIds.length > 0) {
        const deleteResult = await userNFTsCollection.deleteMany({
          wallet_address: walletAddress.toLowerCase(),
          nft_token_id: { $nin: ownedTokenIds }
        });
        console.log(`🗑️  Cleaned up ${deleteResult.deletedCount} NFTs no longer owned by wallet ${walletAddress}`);
      } else {
        // If wallet owns no NFTs, delete all their records
        const deleteResult = await userNFTsCollection.deleteMany({
          wallet_address: walletAddress.toLowerCase()
        });
        console.log(`🗑️  Cleaned up ${deleteResult.deletedCount} NFTs (wallet owns none)`);
      }
      
      console.log(`✅ Force refresh completed for wallet ${walletAddress}`);
      console.log(`   - Total NFTs (blockchain): ${result.totalNFTs}`);
      console.log(`   - NFTs found in database: ${result.nftsFound}`);
      console.log(`   - NFTs added to user_nfts: ${result.nftsAdded}`);
      console.log(`   - NFTs processed: ${result.nftsUpdated}`);

      return result;

    } catch (error) {
      console.error(`❌ Force refresh failed for wallet ${walletAddress}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error during force refresh');
      throw new AppError(`Failed to force refresh NFTs for wallet: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
}

export const nftSyncService = NFTSyncService.getInstance();
