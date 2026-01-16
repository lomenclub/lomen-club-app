import { ethers } from 'ethers';
import crypto from 'crypto';
import { databaseService } from '@lomen-club/database';
import { AppError, AuthRequest, AuthResponse, UserProfile, AuthChallenge, AuthSession } from '@lomen-club/shared';

export class AuthService {
  private static instance: AuthService;
  private challenges: Map<string, AuthChallenge> = new Map();
  private sessions: Map<string, AuthSession> = new Map();

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generate a challenge for wallet authentication
   */
  public generateChallenge(walletAddress: string): string {
    // Clean and validate wallet address
    const cleanAddress = walletAddress.toLowerCase();
    if (!ethers.isAddress(cleanAddress)) {
      throw new AppError('Invalid wallet address', 400);
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const challenge = `Sign this message to authenticate with Lomen Club: ${nonce}`;
    
    // Store challenge with expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.challenges.set(cleanAddress, {
      challenge,
      expires_at: expiresAt,
      wallet_address: cleanAddress
    });

    // Clean up expired challenges
    this.cleanupExpiredChallenges();

    return challenge;
  }

  /**
   * Verify wallet signature and authenticate user
   */
  public async authenticate(request: AuthRequest): Promise<AuthResponse> {
    const { wallet_address, signature, challenge } = request;
    const cleanAddress = wallet_address.toLowerCase();

    // Validate inputs
    if (!ethers.isAddress(cleanAddress)) {
      throw new AppError('Invalid wallet address', 400);
    }

    if (!signature || !challenge) {
      throw new AppError('Signature and challenge are required', 400);
    }

    // Verify challenge exists and is not expired
    const storedChallenge = this.challenges.get(cleanAddress);
    if (!storedChallenge) {
      throw new AppError('Challenge not found or expired', 400);
    }

    if (storedChallenge.expires_at < new Date()) {
      this.challenges.delete(cleanAddress);
      throw new AppError('Challenge expired', 400);
    }

    if (storedChallenge.challenge !== challenge) {
      throw new AppError('Invalid challenge', 400);
    }

    // Verify signature
    const recoveredAddress = this.verifySignature(challenge, signature);
    if (recoveredAddress.toLowerCase() !== cleanAddress) {
      throw new AppError('Invalid signature', 401);
    }

    // Clean up used challenge
    this.challenges.delete(cleanAddress);

    // Get or create user profile
    let profile = await this.getUserProfile(cleanAddress);
    let isNewUser = false;

    if (!profile) {
      profile = await this.createUserProfile(cleanAddress);
      isNewUser = true;
    } else {
      // Update last login time
      await this.updateLastLogin(cleanAddress);
    }

    // Generate session token
    const sessionToken = this.generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session: AuthSession = {
      session_token: sessionToken,
      wallet_address: cleanAddress,
      expires_at: sessionExpiresAt,
      created_at: new Date()
    };

    // Store session
    this.sessions.set(sessionToken, session);

    // Auto-sync NFTs after successful authentication (non-blocking)
    this.autoSyncNFTs(cleanAddress).catch(error => {
      console.error('Auto-sync NFTs failed:', error);
      // Don't fail authentication if sync fails
    });

    return {
      session_token: sessionToken,
      profile,
      is_new_user: isNewUser,
      expires_at: sessionExpiresAt
    };
  }

  /**
   * Verify session token
   */
  public verifySession(sessionToken: string): AuthSession | null {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return null;
    }

    if (session.expires_at < new Date()) {
      this.sessions.delete(sessionToken);
      return null;
    }

    return session;
  }

  /**
   * Logout user by invalidating session
   */
  public logout(sessionToken: string): boolean {
    return this.sessions.delete(sessionToken);
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
   * Create new user profile
   */
  private async createUserProfile(walletAddress: string): Promise<UserProfile> {
    const now = new Date();
    const profile: UserProfile = {
      wallet_address: walletAddress,
      is_active: true,
      created_at: now,
      updated_at: now,
      last_login_at: now
    };

    try {
      const collection = databaseService.getUserProfilesCollection();
      const result = await collection.insertOne(profile);
      
      if (!result.acknowledged) {
        throw new AppError('Failed to create user profile', 500);
      }

      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new AppError('Failed to create user profile', 500);
    }
  }

  /**
   * Update last login time
   */
  private async updateLastLogin(walletAddress: string): Promise<void> {
    try {
      const collection = databaseService.getUserProfilesCollection();
      await collection.updateOne(
        { wallet_address: walletAddress },
        { 
          $set: { 
            last_login_at: new Date(),
            updated_at: new Date()
          } 
        }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error as this is non-critical
    }
  }

  /**
   * Verify signature and recover wallet address
   */
  private verifySignature(message: string, signature: string): string {
    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw new AppError('Invalid signature', 401);
    }
  }

  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = new Date();
    for (const [address, challenge] of this.challenges.entries()) {
      if (challenge.expires_at < now) {
        this.challenges.delete(address);
      }
    }
  }

  /**
   * Auto-sync NFTs for a wallet after authentication
   */
  private async autoSyncNFTs(walletAddress: string): Promise<void> {
    try {
      console.log(`🔄 Auto-syncing NFTs for wallet: ${walletAddress}`);
      
      // Import NFT sync service to avoid circular dependencies
      const { nftSyncService } = await import('./nftSyncService.js');
      
      // Perform NFT sync
      const syncResult = await nftSyncService.syncWalletNFTs(walletAddress);
      
      console.log(`✅ Auto-sync completed for wallet ${walletAddress}:`);
      console.log(`   - Blockchain reports: ${syncResult.totalNFTs} NFTs`);
      console.log(`   - Database now has: ${syncResult.nftsFound} NFTs`);
      console.log(`   - NFTs updated: ${syncResult.nftsUpdated}`);
      
    } catch (error) {
      console.error(`❌ Auto-sync NFTs failed for wallet ${walletAddress}:`, error);
      // Don't throw - this is a non-critical background operation
    }
  }

  /**
   * Clean up expired sessions (for maintenance)
   */
  public cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [token, session] of this.sessions.entries()) {
      if (session.expires_at < now) {
        this.sessions.delete(token);
      }
    }
  }
}

export const authService = AuthService.getInstance();
