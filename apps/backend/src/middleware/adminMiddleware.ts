import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService.js';
import { AppError } from '@lomen-club/shared';
import { AuthenticatedRequest } from './authMiddleware.js';

/**
 * Middleware to require admin authentication
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // For now, allow the default admin wallet without database check
    const adminWallet = '0x2aECbe7d4b32dBC2Ca27D6361655195c430F548b';
    const isDefaultAdmin = req.user.wallet_address.toLowerCase() === adminWallet.toLowerCase();
    
    if (isDefaultAdmin) {
      // Default admin has all permissions
      (req as any).isDefaultAdmin = true;
      return next();
    }

    // For other wallets, check database
    const isAdmin = await adminService.isAdmin(req.user.wallet_address);
    if (!isAdmin) {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Admin check failed' });
  }
};

/**
 * Middleware to require specific admin permission
 */
export const requireAdminPermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // For now, allow the default admin wallet all permissions without database check
      const adminWallet = '0x2aECbe7d4b32dBC2Ca27D6361655195c430F548b';
      const isDefaultAdmin = req.user.wallet_address.toLowerCase() === adminWallet.toLowerCase();
      
      if (isDefaultAdmin) {
        // Default admin has all permissions
        return next();
      }

      // For other wallets, check database
      const hasPermission = await adminService.hasPermission(
        req.user.wallet_address, 
        permission as any
      );
      
      if (!hasPermission) {
        throw new AppError(`Permission '${permission}' required`, 403, 'PERMISSION_REQUIRED');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }

      console.error('Admin permission middleware error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Optional admin middleware - adds admin info to request if user is admin
 */
export const optionalAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(); // Continue without admin info
    }

    const isAdmin = await adminService.isAdmin(req.user.wallet_address);
    if (isAdmin) {
      // Add admin info to request
      (req as any).isAdmin = true;
      const admin = await adminService.getAdmin(req.user.wallet_address);
      if (admin) {
        (req as any).adminPermissions = admin.permissions;
      }
    } else {
      (req as any).isAdmin = false;
    }

    next();
  } catch (error) {
    // For optional admin, just continue without admin info
    console.error('Optional admin middleware error:', error);
    next();
  }
};
