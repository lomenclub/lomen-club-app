import { databaseService } from '@lomen-club/database';
import { walletService } from './walletService.js';
import { nftSyncService } from './nftSyncService.js';
import { 
  AppError, 
  UserProfile, 
  ProfileUpdateRequest, 
  ProfileResponse, 
  ProfileStats,
  UserNFT,
  ProfileValidation,
  ProfileValidationResult,
  ProfileError
} from '@lomen-club/shared';

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Get complete profile data including stats and owned NFTs
   */
  public async getProfile(walletAddress: string): Promise<ProfileResponse> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    try {
      const cleanAddress = walletAddress.toLowerCase();
      
      // Get user profile
      const profile = await this.getUserProfile(cleanAddress);
      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      // Get profile stats
      const stats = await this.getProfileStats(cleanAddress);

      // Get owned NFTs
      const ownedNFTs = await this.getUserNFTs(cleanAddress);

      return {
        profile,
        stats,
        owned_nfts: ownedNFTs
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error fetching profile:', error);
      throw new AppError('Failed to fetch profile', 500);
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(walletAddress: string, updateData: ProfileUpdateRequest): Promise<UserProfile> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    // Validate profile data
    const validation = this.validateProfileData(updateData);
    if (!validation.isValid) {
      throw new AppError('Profile validation failed', 400, 'VALIDATION_ERROR');
    }

    try {
      const cleanAddress = walletAddress.toLowerCase();
      
      // Check if profile exists
      const existingProfile = await this.getUserProfile(cleanAddress);
      if (!existingProfile) {
        throw new AppError('Profile not found', 404);
      }

      // If setting profile picture NFT, verify ownership
      if (updateData.profile_picture_nft_id !== undefined) {
        const ownsNFT = await this.verifyNFTOwnership(cleanAddress, updateData.profile_picture_nft_id);
        if (!ownsNFT) {
          throw new AppError('You do not own this NFT', 403);
        }
      }

      const updateFields: any = {
        updated_at: new Date()
      };

      // Add only provided fields to update
      if (updateData.display_name !== undefined) updateFields.display_name = updateData.display_name;
      if (updateData.kucoin_uid !== undefined) updateFields.kucoin_uid = updateData.kucoin_uid;
      if (updateData.telegram_handle !== undefined) updateFields.telegram_handle = updateData.telegram_handle;
      if (updateData.x_handle !== undefined) updateFields.x_handle = updateData.x_handle;
      if (updateData.email !== undefined) updateFields.email = updateData.email;
      if (updateData.profile_picture_nft_id !== undefined) updateFields.profile_picture_nft_id = updateData.profile_picture_nft_id;

      const collection = databaseService.getUserProfilesCollection();
      const result = await collection.findOneAndUpdate(
        { wallet_address: cleanAddress },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new AppError('Failed to update profile', 500);
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating profile:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  /**
   * Sync user's NFTs from blockchain
   */
  public async syncUserNFTs(walletAddress: string): Promise<UserNFT[]> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    try {
      const cleanAddress = walletAddress.toLowerCase();
      
      // Use NFT sync service to get comprehensive sync
      const syncResult = await nftSyncService.syncWalletNFTs(cleanAddress);
      
      console.log(`✅ NFT sync completed for ${cleanAddress}:`);
      console.log(`   - Blockchain reports: ${syncResult.totalNFTs} NFTs`);
      console.log(`   - Database has: ${syncResult.nftsFound} NFTs`);
      console.log(`   - NFTs updated: ${syncResult.nftsUpdated}`);
      
      // Get updated NFTs from database
      const userNFTs = await this.getUserNFTs(cleanAddress);
      
      return userNFTs;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error syncing user NFTs:', error);
      throw new AppError('Failed to sync user NFTs', 500);
    }
  }

  /**
   * Set profile picture NFT
   */
  public async setProfilePicture(walletAddress: string, nftTokenId: number): Promise<UserProfile> {
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address', 400);
    }

    if (typeof nftTokenId !== 'number' || nftTokenId < 0) {
      throw new AppError('Invalid NFT token ID', 400);
    }

    try {
      const cleanAddress = walletAddress.toLowerCase();
      
      // Verify NFT ownership
      const ownsNFT = await this.verifyNFTOwnership(cleanAddress, nftTokenId);
      if (!ownsNFT) {
        throw new AppError('You do not own this NFT', 403);
      }

      // Update profile
      return await this.updateProfile(cleanAddress, {
        profile_picture_nft_id: nftTokenId
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error setting profile picture:', error);
      throw new AppError('Failed to set profile picture', 500);
    }
  }

  /**
   * Get user profile by wallet address
   */
  private async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const collection = databaseService.getUserProfilesCollection();
      return await collection.findOne({ wallet_address: walletAddress });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user's NFTs
   */
  public async getUserNFTs(walletAddress: string): Promise<UserNFT[]> {
    try {
      const collection = databaseService.getUserNFTsCollection();
      return await collection.find({ wallet_address: walletAddress }).toArray();
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }

  /**
   * Get profile statistics
   */
  private async getProfileStats(walletAddress: string): Promise<ProfileStats> {
    try {
      // Get owned NFTs count from user_nfts collection
      const userNFTs = await this.getUserNFTs(walletAddress);
      let totalNFTsOwned = userNFTs.length;

      // If no NFTs in user_nfts collection, check blockchain directly
      if (totalNFTsOwned === 0) {
        try {
          const walletNFTs = await walletService.getNFTsByWallet(walletAddress);
          totalNFTsOwned = walletNFTs.nfts.length;
          
          // If blockchain shows NFTs but user_nfts is empty, trigger sync
          if (totalNFTsOwned > 0) {
            console.log(`Auto-syncing NFTs for ${walletAddress} (found ${totalNFTsOwned} NFTs on blockchain)`);
            await this.syncUserNFTs(walletAddress);
          }
        } catch (blockchainError) {
          console.error('Error checking blockchain for NFTs:', blockchainError);
          // Continue with user_nfts count if blockchain check fails
        }
      }

      // Determine membership status
      const membershipStatus = totalNFTsOwned > 0 ? 'member' : 'non_member';

      // Determine reward eligibility (placeholder logic)
      const rewardEligibilityStatus = totalNFTsOwned > 0 ? 'eligible' : 'not_eligible';

      return {
        total_nfts_owned: totalNFTsOwned,
        reward_eligibility_status: rewardEligibilityStatus,
        total_staked_kcs: 0, // Placeholder until staking integration
        governance_participation: false, // Placeholder
        membership_status: membershipStatus
      };
    } catch (error) {
      console.error('Error calculating profile stats:', error);
      return {
        total_nfts_owned: 0,
        reward_eligibility_status: 'not_eligible',
        total_staked_kcs: 0,
        governance_participation: false,
        membership_status: 'non_member'
      };
    }
  }

  /**
   * Verify that user owns a specific NFT
   */
  private async verifyNFTOwnership(walletAddress: string, nftTokenId: number): Promise<boolean> {
    try {
      const userNFTs = await this.getUserNFTs(walletAddress);
      return userNFTs.some(nft => nft.nft_token_id === nftTokenId);
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }

  /**
   * Validate profile data
   */
  private validateProfileData(data: ProfileUpdateRequest): ProfileValidationResult {
    const errors: ProfileError[] = [];

    if (data.display_name !== undefined) {
      if (data.display_name.length < ProfileValidation.display_name.minLength) {
        errors.push({
          field: 'display_name',
          message: `Display name must be at least ${ProfileValidation.display_name.minLength} characters`,
          code: 'TOO_SHORT'
        });
      }
      if (data.display_name.length > ProfileValidation.display_name.maxLength) {
        errors.push({
          field: 'display_name',
          message: `Display name must be at most ${ProfileValidation.display_name.maxLength} characters`,
          code: 'TOO_LONG'
        });
      }
      if (!ProfileValidation.display_name.pattern.test(data.display_name)) {
        errors.push({
          field: 'display_name',
          message: 'Display name can only contain letters, numbers, spaces, hyphens, and underscores',
          code: 'INVALID_CHARACTERS'
        });
      }
    }

    if (data.kucoin_uid !== undefined && data.kucoin_uid !== '') {
      if (data.kucoin_uid.length < ProfileValidation.kucoin_uid.minLength) {
        errors.push({
          field: 'kucoin_uid',
          message: `KuCoin UID must be at least ${ProfileValidation.kucoin_uid.minLength} characters`,
          code: 'TOO_SHORT'
        });
      }
      if (data.kucoin_uid.length > ProfileValidation.kucoin_uid.maxLength) {
        errors.push({
          field: 'kucoin_uid',
          message: `KuCoin UID must be at most ${ProfileValidation.kucoin_uid.maxLength} characters`,
          code: 'TOO_LONG'
        });
      }
      if (!ProfileValidation.kucoin_uid.pattern.test(data.kucoin_uid)) {
        errors.push({
          field: 'kucoin_uid',
          message: 'KuCoin UID can only contain letters, numbers, and underscores',
          code: 'INVALID_CHARACTERS'
        });
      }
    }

    if (data.telegram_handle !== undefined && data.telegram_handle !== '') {
      if (data.telegram_handle.length < ProfileValidation.telegram_handle.minLength) {
        errors.push({
          field: 'telegram_handle',
          message: `Telegram handle must be at least ${ProfileValidation.telegram_handle.minLength} character`,
          code: 'TOO_SHORT'
        });
      }
      if (data.telegram_handle.length > ProfileValidation.telegram_handle.maxLength) {
        errors.push({
          field: 'telegram_handle',
          message: `Telegram handle must be at most ${ProfileValidation.telegram_handle.maxLength} characters`,
          code: 'TOO_LONG'
        });
      }
      if (!ProfileValidation.telegram_handle.pattern.test(data.telegram_handle)) {
        errors.push({
          field: 'telegram_handle',
          message: 'Telegram handle can only contain letters, numbers, and underscores',
          code: 'INVALID_CHARACTERS'
        });
      }
    }

    if (data.x_handle !== undefined && data.x_handle !== '') {
      if (data.x_handle.length < ProfileValidation.x_handle.minLength) {
        errors.push({
          field: 'x_handle',
          message: `X handle must be at least ${ProfileValidation.x_handle.minLength} character`,
          code: 'TOO_SHORT'
        });
      }
      if (data.x_handle.length > ProfileValidation.x_handle.maxLength) {
        errors.push({
          field: 'x_handle',
          message: `X handle must be at most ${ProfileValidation.x_handle.maxLength} characters`,
          code: 'TOO_LONG'
        });
      }
      if (!ProfileValidation.x_handle.pattern.test(data.x_handle)) {
        errors.push({
          field: 'x_handle',
          message: 'X handle can only contain letters, numbers, and underscores',
          code: 'INVALID_CHARACTERS'
        });
      }
    }

    if (data.email !== undefined && data.email !== '') {
      if (!ProfileValidation.email.pattern.test(data.email)) {
        errors.push({
          field: 'email',
          message: 'Please enter a valid email address',
          code: 'INVALID_FORMAT'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const profileService = ProfileService.getInstance();
