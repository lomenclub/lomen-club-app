import { MongoClient, Db, Collection } from 'mongodb';
import { NFTMetadata, UserProfile, UserNFT, Admin, AdminAction } from '@lomen-club/shared';

let client: MongoClient | null = null;
let database: Db | null = null;

// Export enrichment service
export { databaseEnrichmentService } from './enrichmentService.js';
export { syncDataService } from './syncDataService.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private nftsCollection: Collection<NFTMetadata> | null = null;
  private userProfilesCollection: Collection<UserProfile> | null = null;
  private userNFTsCollection: Collection<UserNFT> | null = null;
  private adminsCollection: Collection<Admin> | null = null;
  private adminActionsCollection: Collection<AdminAction> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(mongodbUri?: string): Promise<void> {
    if (client && database) {
      return;
    }

    try {
      const uri = mongodbUri || process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      console.log('🔗 Connecting to MongoDB...');
      client = new MongoClient(uri);
      await client.connect();
      
      database = client.db('lomen-club');
      this.nftsCollection = database.collection<NFTMetadata>('nfts');
      this.userProfilesCollection = database.collection<UserProfile>('user_profiles');
      this.userNFTsCollection = database.collection<UserNFT>('user_nfts');
      this.adminsCollection = database.collection<Admin>('admins');
      this.adminActionsCollection = database.collection<AdminAction>('admin_actions');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      // Initialize default admin if not exists
      await this.initializeDefaultAdmin();
      
      // Verify connection
      const count = await this.nftsCollection.countDocuments();
      console.log(`✅ MongoDB connected successfully - Found ${count} NFTs`);
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!database) return;

    try {
      // User profiles indexes
      await this.userProfilesCollection!.createIndex({ wallet_address: 1 }, { unique: true });
      await this.userProfilesCollection!.createIndex({ created_at: -1 });
      await this.userProfilesCollection!.createIndex({ updated_at: -1 });
      
      // User NFTs indexes
      await this.userNFTsCollection!.createIndex({ wallet_address: 1, nft_token_id: 1 }, { unique: true });
      await this.userNFTsCollection!.createIndex({ wallet_address: 1 });
      await this.userNFTsCollection!.createIndex({ nft_token_id: 1 });
      await this.userNFTsCollection!.createIndex({ last_synced_at: -1 });
      
      // Admin indexes
      await this.adminsCollection!.createIndex({ wallet_address: 1 }, { unique: true });
      await this.adminsCollection!.createIndex({ is_active: 1 });
      await this.adminsCollection!.createIndex({ created_at: -1 });
      
      // Admin actions indexes
      await this.adminActionsCollection!.createIndex({ admin_wallet: 1 });
      await this.adminActionsCollection!.createIndex({ timestamp: -1 });
      await this.adminActionsCollection!.createIndex({ action: 1 });
      
      // NFTs collection indexes (CRITICAL for performance)
      // Note: tokenId index may already exist (non-unique), so we don't specify unique
      // to avoid conflict with existing index
      await this.nftsCollection!.createIndex({ tokenId: 1 });
      await this.nftsCollection!.createIndex({ 'blockchainData.owner': 1 });
      await this.nftsCollection!.createIndex({ 'rarity.rank': 1 });
      await this.nftsCollection!.createIndex({ 
        'attributes.trait_type': 1, 
        'attributes.value': 1 
      });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create database indexes:', error);
    }
  }

  public async disconnect(): Promise<void> {
    if (client) {
      await client.close();
      client = null;
      database = null;
      this.nftsCollection = null;
      this.userProfilesCollection = null;
      this.userNFTsCollection = null;
      console.log('🔌 MongoDB disconnected');
    }
  }

  public getNFTsCollection(): Collection<NFTMetadata> {
    if (!this.nftsCollection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.nftsCollection;
  }

  public getUserProfilesCollection(): Collection<UserProfile> {
    if (!this.userProfilesCollection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.userProfilesCollection;
  }

  public getUserNFTsCollection(): Collection<UserNFT> {
    if (!this.userNFTsCollection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.userNFTsCollection;
  }

  public getAdminsCollection(): Collection<Admin> {
    if (!this.adminsCollection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.adminsCollection;
  }

  public getAdminActionsCollection(): Collection<AdminAction> {
    if (!this.adminActionsCollection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.adminActionsCollection;
  }

  public isConnected(): boolean {
    return !!client && !!database;
  }

  /**
   * Initialize default admin wallet if not exists
   */
  private async initializeDefaultAdmin(): Promise<void> {
    if (!this.adminsCollection) return;

    const defaultAdminWallet = '0x2aECbe7d4b32dBC2Ca27D6361655195c430F548b';
    
    try {
      const existingAdmin = await this.adminsCollection.findOne({ 
        wallet_address: defaultAdminWallet 
      });
      
      if (!existingAdmin) {
        const defaultAdmin: Admin = {
          wallet_address: defaultAdminWallet,
          permissions: [
            'manage_admins',
            'manage_nfts',
            'manage_users',
            'run_sync',
            'view_analytics',
            'manage_settings'
          ],
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
          is_active: true
        };
        
        await this.adminsCollection.insertOne(defaultAdmin);
        console.log(`✅ Default admin initialized: ${defaultAdminWallet}`);
        
        // Log the admin action
        if (this.adminActionsCollection) {
          await this.adminActionsCollection.insertOne({
            admin_wallet: 'system',
            action: 'initialize_default_admin',
            target: defaultAdminWallet,
            details: { permissions: defaultAdmin.permissions },
            timestamp: new Date()
          });
        }
      } else {
        console.log(`✅ Default admin already exists: ${defaultAdminWallet}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize default admin:', error);
    }
  }
}

export const databaseService = DatabaseService.getInstance();
