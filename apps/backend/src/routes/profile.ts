import express from 'express';
import { profileService } from '../services/profileService.js';
import { authenticate, authorizeResource, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AppError, APIResponse, ProfileUpdateRequest, ProfileResponse } from '@lomen-club/shared';

const router = express.Router();

/**
 * Get user profile (requires authentication)
 */
router.get('/:walletAddress', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;

    const profileResponse: ProfileResponse = await profileService.getProfile(walletAddress);

    res.json({
      status: 'success',
      data: profileResponse
    } as APIResponse<ProfileResponse>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error fetching profile:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch profile'
    } as APIResponse<null>);
  }
});

/**
 * Update user profile (requires authentication)
 */
router.put('/:walletAddress', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;
    const updateData: ProfileUpdateRequest = req.body;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'No update data provided'
      } as APIResponse<null>);
    }

    const updatedProfile = await profileService.updateProfile(walletAddress, updateData);

    res.json({
      status: 'success',
      data: updatedProfile
    } as APIResponse<any>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update profile'
    } as APIResponse<null>);
  }
});

/**
 * Sync user's NFTs from blockchain (requires authentication)
 */
router.post('/:walletAddress/sync-nfts', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;

    const userNFTs = await profileService.syncUserNFTs(walletAddress);

    res.json({
      status: 'success',
      data: {
        nfts: userNFTs,
        count: userNFTs.length,
        synced_at: new Date()
      }
    } as APIResponse<{ nfts: any[]; count: number; synced_at: Date }>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error syncing NFTs:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to sync NFTs'
    } as APIResponse<null>);
  }
});

/**
 * Set profile picture NFT (requires authentication)
 */
router.post('/:walletAddress/profile-picture', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;
    const { nft_token_id } = req.body;

    if (typeof nft_token_id !== 'number') {
      return res.status(400).json({
        status: 'error',
        error: 'NFT token ID is required and must be a number'
      } as APIResponse<null>);
    }

    const updatedProfile = await profileService.setProfilePicture(walletAddress, nft_token_id);

    res.json({
      status: 'success',
      data: updatedProfile
    } as APIResponse<any>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error setting profile picture:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to set profile picture'
    } as APIResponse<null>);
  }
});

/**
 * Get user's owned NFTs (requires authentication)
 */
router.get('/:walletAddress/nfts', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;

    // Import profile service to avoid circular dependency
    const { profileService } = await import('../services/profileService.js');
    const userNFTs = await profileService.getUserNFTs(walletAddress);

    res.json({
      status: 'success',
      data: {
        nfts: userNFTs,
        count: userNFTs.length
      }
    } as APIResponse<{ nfts: any[]; count: number }>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error fetching user NFTs:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch user NFTs'
    } as APIResponse<null>);
  }
});

/**
 * Check if user is a member (owns at least one NFT)
 */
router.get('/:walletAddress/membership', authenticate, authorizeResource('walletAddress'), async (req: AuthenticatedRequest, res) => {
  try {
    const { walletAddress } = req.params;

    const profileResponse = await profileService.getProfile(walletAddress);

    res.json({
      status: 'success',
      data: {
        is_member: profileResponse.stats.membership_status === 'member',
        total_nfts: profileResponse.stats.total_nfts_owned,
        membership_status: profileResponse.stats.membership_status
      }
    } as APIResponse<{ is_member: boolean; total_nfts: number; membership_status: string }>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error checking membership:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to check membership'
    } as APIResponse<null>);
  }
});

export { router as profileRoutes };
