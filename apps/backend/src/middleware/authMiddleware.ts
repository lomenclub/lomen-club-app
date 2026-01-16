import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { AppError } from '@lomen-club/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    wallet_address: string;
    session_token: string;
  };
}

/**
 * Middleware to authenticate requests using session token
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get session token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify session
    const session = authService.verifySession(sessionToken);
    if (!session) {
      throw new AppError('Invalid or expired session', 401);
    }

    // Add user info to request
    req.user = {
      wallet_address: session.wallet_address,
      session_token: sessionToken
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const sessionToken = authHeader.substring(7);
    const session = authService.verifySession(sessionToken);
    
    if (session) {
      req.user = {
        wallet_address: session.wallet_address,
        session_token: sessionToken
      };
    }

    next();
  } catch (error) {
    // For optional auth, just continue without authentication
    next();
  }
};

/**
 * Middleware to ensure user owns the resource they're trying to access
 */
export const authorizeResource = (resourceParam: string = 'walletAddress') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Get the resource identifier from request params or body
      let resourceIdentifier: string;
      
      if (req.params[resourceParam]) {
        resourceIdentifier = req.params[resourceParam];
      } else if (req.body[resourceParam]) {
        resourceIdentifier = req.body[resourceParam];
      } else {
        throw new AppError('Resource identifier not found', 400);
      }

      // Normalize wallet addresses for comparison
      const userWallet = req.user.wallet_address.toLowerCase();
      const resourceWallet = resourceIdentifier.toLowerCase();

      // Check if user owns the resource
      if (userWallet !== resourceWallet) {
        throw new AppError('Access denied - you do not own this resource', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }

      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

/**
 * Middleware to check if user is a member (owns at least one NFT)
 */
export const requireMembership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Import profile service here to avoid circular dependencies
    const { profileService } = await import('../services/profileService.js');
    const profile = await profileService.getProfile(req.user.wallet_address);

    if (profile.stats.membership_status !== 'member') {
      throw new AppError('You must be a member to access this resource', 403);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    console.error('Membership check error:', error);
    res.status(500).json({ error: 'Membership check failed' });
  }
};
