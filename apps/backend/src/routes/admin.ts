import { Router, Response, NextFunction } from 'express';
import { databaseEnrichmentService } from '@lomen-club/database';
import { blockchainEnrichmentService } from '@lomen-club/blockchain';
import { AppError, AdminPermission } from '@lomen-club/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin, requireAdminPermission } from '../middleware/adminMiddleware.js';
import { adminService } from '../services/adminService.js';

const router = Router();

// TODO: Re-enable authentication when message signing is implemented
// For now, we'll bypass authentication and check wallet address directly
// router.use(authenticate);

// Custom middleware to extract wallet address from query param for now
const extractWalletFromQuery = (req: any, res: Response, next: NextFunction) => {
  // For now, we'll get wallet from query param
  // In the future, this will come from authenticated session
  const walletAddress = req.query.walletAddress || req.headers['x-wallet-address'];
  
  if (walletAddress) {
    (req as any).user = {
      wallet_address: walletAddress
    };
  }
  
  next();
};

// Use our custom middleware instead of authenticate
router.use((req, res, next) => extractWalletFromQuery(req, res, next));

/**
 * GET /api/admin/check
 * Check if current user is admin
 */
router.get('/check', requireAdmin, async (req, res, next) => {
  try {
    const walletAddress = (req as any).user.wallet_address;
    const admin = await adminService.getAdmin(walletAddress);
    
    res.json({
      success: true,
      data: {
        isAdmin: true,
        walletAddress,
        permissions: admin?.permissions || [],
        adminInfo: admin
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/admins
 * Get all admins (requires manage_admins permission)
 */
router.get('/admins', requireAdminPermission('manage_admins'), async (_req, res, next) => {
  try {
    const admins = await adminService.getAllAdmins();
    
    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/admins
 * Add new admin (requires manage_admins permission)
 */
router.post('/admins', requireAdminPermission('manage_admins'), async (req, res, next) => {
  try {
    const { walletAddress, permissions } = req.body;
    const createdBy = (req as any).user.wallet_address;
    
    if (!walletAddress || !permissions || !Array.isArray(permissions)) {
      throw new AppError('Invalid request: walletAddress and permissions array required', 400);
    }
    
    // Validate permissions
    const validPermissions: AdminPermission[] = [
      'manage_admins', 'manage_nfts', 'manage_users', 
      'run_sync', 'view_analytics', 'manage_settings'
    ];
    
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        throw new AppError(`Invalid permission: ${perm}`, 400);
      }
    }
    
    const admin = await adminService.addAdmin(walletAddress, permissions, createdBy);
    
    res.json({
      success: true,
      message: 'Admin added successfully',
      data: admin
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/admins/:walletAddress/permissions
 * Update admin permissions (requires manage_admins permission)
 */
router.put('/admins/:walletAddress/permissions', requireAdminPermission('manage_admins'), async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { permissions } = req.body;
    const updatedBy = (req as any).user.wallet_address;
    
    if (!permissions || !Array.isArray(permissions)) {
      throw new AppError('Invalid request: permissions array required', 400);
    }
    
    // Validate permissions
    const validPermissions: AdminPermission[] = [
      'manage_admins', 'manage_nfts', 'manage_users', 
      'run_sync', 'view_analytics', 'manage_settings'
    ];
    
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        throw new AppError(`Invalid permission: ${perm}`, 400);
      }
    }
    
    const admin = await adminService.updateAdminPermissions(walletAddress, permissions, updatedBy);
    
    res.json({
      success: true,
      message: 'Admin permissions updated successfully',
      data: admin
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/admins/:walletAddress
 * Deactivate admin (requires manage_admins permission)
 */
router.delete('/admins/:walletAddress', requireAdminPermission('manage_admins'), async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const deactivatedBy = (req as any).user.wallet_address;
    
    await adminService.deactivateAdmin(walletAddress, deactivatedBy);
    
    res.json({
      success: true,
      message: 'Admin deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/actions
 * Get admin actions log (requires view_analytics permission)
 */
router.get('/actions', requireAdminPermission('view_analytics'), async (req, res, next) => {
  try {
    const { limit = 100, skip = 0, adminWallet } = req.query;
    
    const actions = await adminService.getAdminActions(
      adminWallet as string,
      parseInt(limit as string),
      parseInt(skip as string)
    );
    
    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/enrichment/status
 * Get current enrichment status (requires run_sync permission)
 */
router.get('/enrichment/status', requireAdminPermission('run_sync'), async (_req, res, next) => {
  try {
    // Get counts from database
    const stats = await databaseEnrichmentService.getNFTStats();
    
    res.json({
      success: true,
      data: {
        totalNFTs: stats.totalNFTs,
        onSaleCount: stats.onSaleCount,
        lastUpdated: new Date().toISOString(),
        blockchainService: 'localhost:3003'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/enrichment/refresh
 * Trigger blockchain data refresh for all NFTs (requires run_sync permission)
 * Optional query parameters:
 * - limit: max number of NFTs to refresh (default: all)
 * - batchSize: batch size for processing (default: 20)
 */
router.post('/enrichment/refresh', requireAdminPermission('run_sync'), async (req, res, next) => {
  try {
    const { limit, batchSize = 20 } = req.query;
    const maxNFTs = limit ? parseInt(limit as string) : undefined;
    
    console.log(`🔄 Admin: Triggering blockchain data refresh${maxNFTs ? ` (limit: ${maxNFTs})` : ''}`);
    
    // Get NFTs collection
    const nftsCollection = databaseEnrichmentService['nftsCollection'];
    if (!nftsCollection) {
      throw new AppError('NFTs collection not initialized', 500);
    }
    
    // Get all NFTs (or limited subset with offset)
    let query = {};
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    if (maxNFTs) {
      // Get NFTs with pagination (offset + limit)
      const nfts = await nftsCollection.find({})
        .skip(offset)
        .limit(maxNFTs)
        .toArray();
      
      // Check which NFTs need refresh
      const nftsNeedingRefresh = blockchainEnrichmentService.getNFTsNeedingRefresh(nfts);
      
      console.log(`🔍 ${nftsNeedingRefresh.length} NFTs need blockchain data refresh (offset: ${offset}, limit: ${maxNFTs})`);
      
      if (nftsNeedingRefresh.length === 0) {
        return res.json({
          success: true,
          message: 'All NFTs in this batch have fresh blockchain data',
          refreshed: 0,
          total: nfts.length,
          offset,
          limit: maxNFTs
        });
      }
      
      // Process in batches
      const actualBatchSize = Math.min(parseInt(batchSize as string), 50); // Max 50 per batch
      const totalBatches = Math.ceil(nftsNeedingRefresh.length / actualBatchSize);
      let processed = 0;
      let successful = 0;
      let failed = 0;
      
      for (let i = 0; i < nftsNeedingRefresh.length; i += actualBatchSize) {
        const batch = nftsNeedingRefresh.slice(i, i + actualBatchSize);
        const currentBatch = Math.floor(i / actualBatchSize) + 1;
        console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (NFTs ${i + 1}-${Math.min(i + actualBatchSize, nftsNeedingRefresh.length)})...`);
        
        try {
          await databaseEnrichmentService.enrichAndUpdateNFTs(batch);
          successful += batch.length;
        } catch (error) {
          console.error(`❌ Failed to process batch:`, error);
          failed += batch.length;
        }
        
        processed += batch.length;
        
        // Rate limiting: wait 1 second between batches
        if (i + actualBatchSize < nftsNeedingRefresh.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Get updated stats
      const updatedStats = await databaseEnrichmentService.getNFTStats();
      
      res.json({
        success: true,
        message: `Blockchain data refresh completed for batch`,
        details: {
          processed,
          successful,
          failed,
          totalNFTs: updatedStats.totalNFTs,
          onSaleCount: updatedStats.onSaleCount,
          batchSize: actualBatchSize,
          offset,
          limit: maxNFTs
        }
      });
      return;
    } else {
      // Get all NFTs (no limit)
      const nfts = await nftsCollection.find({}).toArray();
      
      // Check which NFTs need refresh
      const nftsNeedingRefresh = blockchainEnrichmentService.getNFTsNeedingRefresh(nfts);
      
      console.log(`🔍 ${nftsNeedingRefresh.length} NFTs need blockchain data refresh`);
      
      if (nftsNeedingRefresh.length === 0) {
        return res.json({
          success: true,
          message: 'All NFTs have fresh blockchain data',
          refreshed: 0,
          total: nfts.length
        });
      }
      
      // Process in batches
      const actualBatchSize = Math.min(parseInt(batchSize as string), 50); // Max 50 per batch
      const totalBatches = Math.ceil(nftsNeedingRefresh.length / actualBatchSize);
      let processed = 0;
      let successful = 0;
      let failed = 0;
      
      for (let i = 0; i < nftsNeedingRefresh.length; i += actualBatchSize) {
        const batch = nftsNeedingRefresh.slice(i, i + actualBatchSize);
        const currentBatch = Math.floor(i / actualBatchSize) + 1;
        console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (NFTs ${i + 1}-${Math.min(i + actualBatchSize, nftsNeedingRefresh.length)})...`);
        
        try {
          await databaseEnrichmentService.enrichAndUpdateNFTs(batch);
          successful += batch.length;
        } catch (error) {
          console.error(`❌ Failed to process batch:`, error);
          failed += batch.length;
        }
        
        processed += batch.length;
        
        // Rate limiting: wait 1 second between batches
        if (i + actualBatchSize < nftsNeedingRefresh.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Get updated stats
      const updatedStats = await databaseEnrichmentService.getNFTStats();
      
      res.json({
        success: true,
        message: `Blockchain data refresh completed`,
        details: {
          processed,
          successful,
          failed,
          totalNFTs: updatedStats.totalNFTs,
          onSaleCount: updatedStats.onSaleCount,
          batchSize: actualBatchSize
        }
      });
      return;
    }
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/enrichment/schedule
 * Configure enrichment schedule (requires manage_settings permission)
 * Body: { intervalMinutes: 5, enabled: true }
 */
router.post('/enrichment/schedule', requireAdminPermission('manage_settings'), async (req, res, next) => {
  try {
    const { intervalMinutes = 5, enabled = true } = req.body;
    
    // In a real implementation, this would save to a config database
    // For now, just return the configuration
    
    res.json({
      success: true,
      message: `Enrichment schedule ${enabled ? 'enabled' : 'disabled'}`,
      schedule: {
        intervalMinutes,
        enabled,
        nextRun: enabled ? `Every ${intervalMinutes} minutes` : 'Disabled'
      }
    });
  } catch (error) {
    next(error);
  }
});

export const adminRoutes = router;
