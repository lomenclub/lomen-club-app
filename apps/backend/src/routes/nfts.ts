import { Router } from 'express';
import { nftService } from '../services/nftService.js';
import { NFTQueryDto, AppError } from '@lomen-club/shared';

const router = Router();

// Get all NFTs with pagination, sorting, filtering, and on-sale status
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'tokenId',
      sortOrder = 'asc',
      search = '',
      filters = '[]',
      onSale = 'false'
    } = req.query;

    // Parse filters from query string
    let parsedFilters = [];
    try {
      parsedFilters = JSON.parse(filters as string);
    } catch (error) {
      console.warn('Invalid filters format, using empty array');
    }

    // Build query DTO
    const query: NFTQueryDto = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
      filters: parsedFilters,
      onSale: onSale === 'true'
    };

    const response = await nftService.getNFTs(query);
    res.json(response);
  } catch (error: unknown) {
    console.error('Error fetching NFTs:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch NFTs', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  }
});

// Get available traits for filtering
router.get('/traits/available', async (_req, res) => {
  try {
    const traits = await nftService.getAvailableTraits();
    res.json(traits);
  } catch (error: unknown) {
    console.error('Error fetching available traits:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch available traits', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  }
});

// Get NFT statistics including on-sale count
router.get('/stats', async (_req, res) => {
  try {
    const stats = await nftService.getNFTStats();
    res.json(stats);
  } catch (error: unknown) {
    console.error('Error fetching NFT stats:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch NFT stats', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  }
});

// Get single NFT by tokenId
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // Check if tokenId is numeric
    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum)) {
      throw new AppError('Invalid tokenId', 400);
    }

    const nft = await nftService.getNFT(tokenIdNum);
    res.json(nft);
  } catch (error: unknown) {
    console.error('Error fetching NFT:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch NFT', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  }
});

// Get NFTs on sale (convenience endpoint)
router.get('/on-sale', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'tokenId',
      sortOrder = 'asc'
    } = req.query;

    // Build query DTO
    const query: NFTQueryDto = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      onSale: true
    };

    const response = await nftService.getNFTsOnSale(query);
    res.json(response);
  } catch (error: unknown) {
    console.error('Error fetching NFTs on sale:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        status: 'error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch NFTs on sale', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    }
  }
});

export { router as nftRoutes };
