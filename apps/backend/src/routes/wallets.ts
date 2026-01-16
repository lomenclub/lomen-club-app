import { Router } from 'express';
import { walletService } from '../services/walletService.js';
import { AppError } from '@lomen-club/shared';

const router = Router();

// Get all NFTs owned by a specific wallet address
router.get('/:walletAddress/nfts', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const walletNFTs = await walletService.getNFTsByWallet(walletAddress);
    res.json(walletNFTs);
  } catch (error: any) {
    console.error('Error fetching wallet NFTs:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch wallet NFTs', 
        details: error.message,
        status: 'error'
      });
    }
  }
});

// Get token IDs owned by a specific wallet address
router.get('/:walletAddress/token-ids', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const tokenIds = await walletService.getTokenIdsByWallet(walletAddress);
    res.json({
      wallet: walletAddress,
      tokenIds,
      total: tokenIds.length
    });
  } catch (error: any) {
    console.error('Error fetching wallet token IDs:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch wallet token IDs', 
        details: error.message,
        status: 'error'
      });
    }
  }
});

// Check if a wallet owns specific NFTs
router.post('/:walletAddress/ownership', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { tokenIds } = req.body;
    
    if (!tokenIds || !Array.isArray(tokenIds)) {
      throw new AppError('tokenIds array is required', 400);
    }
    
    const ownership = await walletService.checkWalletOwnership(walletAddress, tokenIds);
    res.json({
      wallet: walletAddress,
      ownership
    });
  } catch (error: any) {
    console.error('Error checking wallet ownership:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to check wallet ownership', 
        details: error.message,
        status: 'error'
      });
    }
  }
});

// Get wallet holder statistics
router.get('/stats/holders', async (_req, res) => {
  try {
    const stats = await walletService.getWalletHolderStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching wallet holder stats:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch wallet holder statistics', 
        details: error.message,
        status: 'error'
      });
    }
  }
});

export { router as walletRoutes };
