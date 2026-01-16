import express from 'express';
import { authService } from '../services/authService.js';
import { AppError, APIResponse, AuthRequest, AuthResponse } from '@lomen-club/shared';

const router = express.Router();

/**
 * Generate authentication challenge for wallet
 */
router.post('/challenge', async (req, res) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({
        status: 'error',
        error: 'Wallet address is required'
      } as APIResponse<null>);
    }

    const challenge = authService.generateChallenge(wallet_address);

    res.json({
      status: 'success',
      data: { challenge }
    } as APIResponse<{ challenge: string }>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Error generating challenge:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to generate challenge'
    } as APIResponse<null>);
  }
});

/**
 * Authenticate wallet with signature
 */
router.post('/authenticate', async (req, res) => {
  try {
    const authRequest: AuthRequest = req.body;

    if (!authRequest.wallet_address || !authRequest.signature || !authRequest.challenge) {
      return res.status(400).json({
        status: 'error',
        error: 'Wallet address, signature, and challenge are required'
      } as APIResponse<null>);
    }

    const authResponse: AuthResponse = await authService.authenticate(authRequest);

    res.json({
      status: 'success',
      data: authResponse
    } as APIResponse<AuthResponse>);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        error: error.message,
        code: error.code
      } as APIResponse<null>);
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Authentication failed'
    } as APIResponse<null>);
  }
});

/**
 * Logout user by invalidating session
 */
router.post('/logout', async (req, res) => {
  try {
    const { session_token } = req.body;

    if (!session_token) {
      return res.status(400).json({
        status: 'error',
        error: 'Session token is required'
      } as APIResponse<null>);
    }

    const success = authService.logout(session_token);

    res.json({
      status: 'success',
      data: { success }
    } as APIResponse<{ success: boolean }>);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Logout failed'
    } as APIResponse<null>);
  }
});

/**
 * Verify session token
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'Authentication required'
      } as APIResponse<null>);
    }

    const sessionToken = authHeader.substring(7);
    const session = authService.verifySession(sessionToken);

    if (!session) {
      return res.status(401).json({
        status: 'error',
        error: 'Invalid or expired session'
      } as APIResponse<null>);
    }

    res.json({
      status: 'success',
      data: {
        wallet_address: session.wallet_address,
        expires_at: session.expires_at
      }
    } as APIResponse<{ wallet_address: string; expires_at: Date }>);
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Session verification failed'
    } as APIResponse<null>);
  }
});

export { router as authRoutes };
