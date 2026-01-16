import { NFTMetadata, BlockchainNFTData, getBatchSize, KUSWAP_LISTING_WALLET, NFTOwnerBatchResponse } from '@lomen-club/shared';
import { withTimeout, DEFAULT_RPC_TIMEOUT_MS, createRpcTimeoutMessage } from './timeoutUtils.js';

// Cache configuration
const OWNER_CHECK_TTL = 5 * 60 * 1000; // 5 minutes
const SALE_CHECK_TTL = 2 * 60 * 1000; // 2 minutes

// Cached lowercase version of KuSwap wallet for performance
const KUSWAP_LISTING_WALLET_LOWER = KUSWAP_LISTING_WALLET.toLowerCase();

export class BlockchainEnrichmentService {
  private static instance: BlockchainEnrichmentService;

  private constructor() {}

  /**
   * Get the singleton instance of BlockchainEnrichmentService.
   * 
   * @returns {BlockchainEnrichmentService} The singleton instance
   */
  public static getInstance(): BlockchainEnrichmentService {
    if (!BlockchainEnrichmentService.instance) {
      BlockchainEnrichmentService.instance = new BlockchainEnrichmentService();
    }
    return BlockchainEnrichmentService.instance;
  }

  /**
   * Check if blockchain data needs refresh based on cache TTL.
   * 
   * Blockchain data is considered stale if:
   * - No blockchain data exists
   * - Owner check is older than OWNER_CHECK_TTL (5 minutes)
   * - Sale check is older than SALE_CHECK_TTL (2 minutes)
   * 
   * @param {NFTMetadata} nft - The NFT to check
   * @returns {boolean} True if blockchain data needs refresh, false otherwise
   */
  public needsBlockchainDataRefresh(nft: NFTMetadata): boolean {
    if (!nft.blockchainData) {
      return true;
    }
    
    const now = new Date();
    const lastOwnerCheck = new Date(nft.blockchainData.lastOwnerCheck);
    const lastSaleCheck = new Date(nft.blockchainData.lastSaleCheck);
    
    const ownerCheckExpired = (now.getTime() - lastOwnerCheck.getTime()) > OWNER_CHECK_TTL;
    const saleCheckExpired = (now.getTime() - lastSaleCheck.getTime()) > SALE_CHECK_TTL;
    
    return ownerCheckExpired || saleCheckExpired;
  }

  /**
   * Fetch current owner from blockchain service with timeout.
   * 
   * Calls the blockchain service API to get the current owner of an NFT.
   * Includes a timeout to prevent hanging requests.
   * 
   * @param {number} tokenId - The NFT token ID
   * @returns {Promise<object>} Owner data including address, short address, ownership status, and network
   * @throws {Error} If the request fails or times out
   */
  public async fetchCurrentOwner(tokenId: number): Promise<{
    owner: string;
    ownerShort: string;
    isOwned: boolean;
    network: string;
  }> {
    try {
      const fetchPromise = async () => {
        const response = await fetch(`http://localhost:3003/api/nfts/${tokenId}/owner`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch owner for NFT ${tokenId}: ${response.statusText}`);
        }

        return await response.json();
      };

      const ownerData = await withTimeout(
        fetchPromise(),
        DEFAULT_RPC_TIMEOUT_MS,
        createRpcTimeoutMessage('fetch owner', tokenId)
      );
      
      return {
        owner: ownerData.owner,
        ownerShort: ownerData.ownerShort,
        isOwned: ownerData.isOwned,
        network: ownerData.network || 'KCC Mainnet'
      };
    } catch (error) {
      console.error(`Failed to fetch owner for NFT ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch batch owners from blockchain service with timeout.
   * 
   * Calls the blockchain service batch API to get owners for multiple NFTs.
   * Includes a timeout to prevent hanging requests.
   * 
   * @param {number[]} tokenIds - Array of NFT token IDs
   * @returns {Promise<NFTOwnerBatchResponse>} Batch owner data including successful and failed token IDs
   * @throws {Error} If the request fails or times out
   */
  public async fetchBatchOwners(tokenIds: number[]): Promise<NFTOwnerBatchResponse> {
    try {
      const fetchPromise = async () => {
        const response = await fetch('http://localhost:3003/api/nfts/owners/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tokenIds }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch batch owners: ${response.statusText}`);
        }

        return await response.json();
      };

      const batchData = await withTimeout(
        fetchPromise(),
        DEFAULT_RPC_TIMEOUT_MS * 2, // Allow more time for batch requests
        createRpcTimeoutMessage('fetch batch owners', tokenIds.length)
      );
      
      return batchData;
    } catch (error) {
      console.error(`Failed to fetch batch owners for ${tokenIds.length} NFTs:`, error);
      throw error;
    }
  }

  /**
   * Check if NFT is on sale (owned by KuSwap listing wallet).
   * 
   * Compares the owner address with the KuSwap listing wallet address.
   * Uses case-insensitive comparison since Ethereum addresses are case-insensitive.
   * 
   * @param {string} owner - The owner address to check
   * @returns {boolean} True if the NFT is on sale (owned by KuSwap), false otherwise
   */
  public isOnSale(owner: string): boolean {
    return owner.toLowerCase() === KUSWAP_LISTING_WALLET_LOWER;
  }

  /**
   * Enrich a single NFT with blockchain data.
   * 
   * Fetches current owner from blockchain and updates blockchain data.
   * If the fetch fails, returns the NFT with existing data or minimal fallback data.
   * 
   * @param {NFTMetadata} nft - The NFT to enrich
   * @returns {Promise<NFTMetadata>} The enriched NFT with updated blockchain data
   */
  public async enrichNFT(nft: NFTMetadata): Promise<NFTMetadata> {
    try {
      console.log(`🔍 Enriching NFT ${nft.tokenId} with blockchain data...`);
      
      const ownerData = await this.fetchCurrentOwner(nft.tokenId);
      const now = new Date();

      const blockchainData: BlockchainNFTData = {
        owner: ownerData.owner,
        ownerShort: ownerData.ownerShort,
        isOwned: ownerData.isOwned,
        isOnSale: this.isOnSale(ownerData.owner),
        lastOwnerCheck: now,
        lastSaleCheck: now,
        network: ownerData.network,
        note: this.isOnSale(ownerData.owner) ? 'Listed on KuSwap marketplace' : undefined
      };

      return {
        ...nft,
        blockchainData,
        updatedAt: now
      };
    } catch (error) {
      console.error(`Failed to enrich NFT ${nft.tokenId}:`, error);
      
      // Return NFT with existing blockchain data if available, or create minimal data
      const now = new Date();
      return {
        ...nft,
        blockchainData: nft.blockchainData || {
          owner: 'Unknown',
          ownerShort: 'Unknown',
          isOwned: false,
          isOnSale: false,
          lastOwnerCheck: now,
          lastSaleCheck: now,
          network: 'KCC Mainnet',
          note: 'Blockchain data unavailable'
        },
        updatedAt: now
      };
    }
  }

  /**
   * Batch enrich multiple NFTs with blockchain data.
   * 
   * Processes NFTs in configurable batches for better performance.
   * Uses batch endpoint when multiple NFTs need enrichment.
   * Falls back to individual calls if batch endpoint fails.
   * 
   * @param {NFTMetadata[]} nfts - Array of NFTs to enrich
   * @returns {Promise<NFTMetadata[]>} Array of enriched NFTs
   */
  public async enrichNFTs(nfts: NFTMetadata[]): Promise<NFTMetadata[]> {
    console.log(`🏪 Enriching ${nfts.length} NFTs with blockchain data...`);
    
    if (nfts.length === 0) {
      return [];
    }
    
    // Use batch endpoint for 2 or more NFTs, individual calls for single NFT
    if (nfts.length >= 2) {
      try {
        console.log(`📦 Using batch endpoint for ${nfts.length} NFTs`);
        return await this.enrichNFTsWithBatch(nfts);
      } catch (error) {
        console.warn(`Batch endpoint failed, falling back to individual calls:`, error);
        // Fall back to individual calls
        return await this.enrichNFTsIndividually(nfts);
      }
    } else {
      // Single NFT - use individual call
      return await this.enrichNFTsIndividually(nfts);
    }
  }

  /**
   * Enrich NFTs using batch endpoint for optimal performance.
   * 
   * @param {NFTMetadata[]} nfts - Array of NFTs to enrich
   * @returns {Promise<NFTMetadata[]>} Array of enriched NFTs
   * @private
   */
  private async enrichNFTsWithBatch(nfts: NFTMetadata[]): Promise<NFTMetadata[]> {
    const tokenIds = nfts.map(nft => nft.tokenId);
    const now = new Date();
    
    try {
      const batchData = await this.fetchBatchOwners(tokenIds);
      
      // Create a map of tokenId to owner data for quick lookup
      const ownerMap = new Map<number, {
        owner: string;
        ownerShort: string;
        isOwned: boolean;
        network: string;
      }>();
      
      batchData.owners.forEach(owner => {
        ownerMap.set(owner.tokenId, {
          owner: owner.owner,
          ownerShort: owner.ownerShort,
          isOwned: owner.isOwned,
          network: owner.network || 'KCC Mainnet'
        });
      });
      
      // Process failed token IDs
      const failedTokenIds = batchData.failedTokenIds || [];
      if (failedTokenIds.length > 0) {
        console.warn(`⚠️  Batch had ${failedTokenIds.length} failed token IDs:`, failedTokenIds);
      }
      
      // Enrich NFTs with batch data
      const enrichedNFTs: NFTMetadata[] = [];
      
      for (const nft of nfts) {
        const ownerData = ownerMap.get(nft.tokenId);
        
        if (ownerData) {
          const blockchainData: BlockchainNFTData = {
            owner: ownerData.owner,
            ownerShort: ownerData.ownerShort,
            isOwned: ownerData.isOwned,
            isOnSale: this.isOnSale(ownerData.owner),
            lastOwnerCheck: now,
            lastSaleCheck: now,
            network: ownerData.network,
            note: this.isOnSale(ownerData.owner) ? 'Listed on KuSwap marketplace' : undefined
          };
          
          enrichedNFTs.push({
            ...nft,
            blockchainData,
            updatedAt: now
          });
        } else if (failedTokenIds.includes(nft.tokenId)) {
          // NFT failed in batch - use fallback
          console.warn(`NFT ${nft.tokenId} failed in batch, using fallback`);
          enrichedNFTs.push(await this.enrichNFTWithFallback(nft, now));
        } else {
          // NFT not in batch results (shouldn't happen)
          console.warn(`NFT ${nft.tokenId} not found in batch results, using fallback`);
          enrichedNFTs.push(await this.enrichNFTWithFallback(nft, now));
        }
      }
      
      console.log(`✅ Batch enriched ${enrichedNFTs.length} NFTs (${failedTokenIds.length} failed)`);
      return enrichedNFTs;
    } catch (error) {
      console.error(`Batch enrichment failed:`, error);
      throw error;
    }
  }

  /**
   * Enrich NFTs using individual calls (fallback method).
   * 
   * @param {NFTMetadata[]} nfts - Array of NFTs to enrich
   * @returns {Promise<NFTMetadata[]>} Array of enriched NFTs
   * @private
   */
  private async enrichNFTsIndividually(nfts: NFTMetadata[]): Promise<NFTMetadata[]> {
    const enrichedNFTs: NFTMetadata[] = [];
    
    // Process NFTs in batches - configurable size
    const batchSize = getBatchSize();
    for (let i = 0; i < nfts.length; i += batchSize) {
      const batch = nfts.slice(i, i + batchSize);
      const batchPromises = batch.map(nft => this.enrichNFT(nft));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            enrichedNFTs.push(result.value);
          } else {
            console.error(`Failed to enrich NFT ${batch[index].tokenId}:`, result.reason);
            // Keep the original NFT if enrichment fails
            enrichedNFTs.push(batch[index]);
          }
        });

        // No delays between batches - process as fast as possible
      } catch (error) {
        console.error(`Batch enrichment failed for batch starting at ${i}:`, error);
        // Add original NFTs if batch fails
        enrichedNFTs.push(...batch);
      }
    }

    console.log(`✅ Individually enriched ${enrichedNFTs.length} NFTs`);
    return enrichedNFTs;
  }

  /**
   * Enrich a single NFT with fallback data.
   * 
   * @param {NFTMetadata} nft - The NFT to enrich
   * @param {Date} now - Current timestamp
   * @returns {Promise<NFTMetadata>} The enriched NFT with fallback data
   * @private
   */
  private async enrichNFTWithFallback(nft: NFTMetadata, now: Date): Promise<NFTMetadata> {
    try {
      // Try individual fetch as fallback
      const ownerData = await this.fetchCurrentOwner(nft.tokenId);
      
      const blockchainData: BlockchainNFTData = {
        owner: ownerData.owner,
        ownerShort: ownerData.ownerShort,
        isOwned: ownerData.isOwned,
        isOnSale: this.isOnSale(ownerData.owner),
        lastOwnerCheck: now,
        lastSaleCheck: now,
        network: ownerData.network,
        note: this.isOnSale(ownerData.owner) ? 'Listed on KuSwap marketplace' : undefined
      };
      
      return {
        ...nft,
        blockchainData,
        updatedAt: now
      };
    } catch (error) {
      console.error(`Fallback enrichment failed for NFT ${nft.tokenId}:`, error);
      
      // Return NFT with existing blockchain data if available, or create minimal data
      return {
        ...nft,
        blockchainData: nft.blockchainData || {
          owner: 'Unknown',
          ownerShort: 'Unknown',
          isOwned: false,
          isOnSale: false,
          lastOwnerCheck: now,
          lastSaleCheck: now,
          network: 'KCC Mainnet',
          note: 'Blockchain data unavailable'
        },
        updatedAt: now
      };
    }
  }

  /**
   * Get NFTs that need blockchain data refresh.
   * 
   * Filters an array of NFTs to return only those that need blockchain data refresh
   * based on cache TTL.
   * 
   * @param {NFTMetadata[]} nfts - Array of NFTs to filter
   * @returns {NFTMetadata[]} NFTs that need blockchain data refresh
   */
  public getNFTsNeedingRefresh(nfts: NFTMetadata[]): NFTMetadata[] {
    return nfts.filter(nft => this.needsBlockchainDataRefresh(nft));
  }

  /**
   * Get count of NFTs on sale from enriched data.
   * 
   * Counts how many NFTs in the array are marked as "on sale" (owned by KuSwap).
   * 
   * @param {NFTMetadata[]} nfts - Array of NFTs to check
   * @returns {number} Count of NFTs on sale
   */
  public getOnSaleCount(nfts: NFTMetadata[]): number {
    return nfts.filter(nft => nft.blockchainData?.isOnSale).length;
  }
}

export const blockchainEnrichmentService = BlockchainEnrichmentService.getInstance();
