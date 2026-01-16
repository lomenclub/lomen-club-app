import { databaseService } from '@lomen-club/database';
import { Admin, AdminAction, AdminPermission, AppError } from '@lomen-club/shared';

export class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Check if a wallet address is an admin
   */
  public async isAdmin(walletAddress: string): Promise<boolean> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      const admin = await adminsCollection.findOne({
        wallet_address: walletAddress.toLowerCase(),
        is_active: true
      });
      
      return !!admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if admin has specific permission
   */
  public async hasPermission(walletAddress: string, permission: AdminPermission): Promise<boolean> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      const admin = await adminsCollection.findOne({
        wallet_address: walletAddress.toLowerCase(),
        is_active: true
      });
      
      if (!admin) return false;
      
      return admin.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }

  /**
   * Get admin by wallet address
   */
  public async getAdmin(walletAddress: string): Promise<Admin | null> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      return await adminsCollection.findOne({
        wallet_address: walletAddress.toLowerCase()
      });
    } catch (error) {
      console.error('Error getting admin:', error);
      return null;
    }
  }

  /**
   * Get all admins
   */
  public async getAllAdmins(): Promise<Admin[]> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      return await adminsCollection.find({ is_active: true }).toArray();
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  /**
   * Add a new admin
   */
  public async addAdmin(
    walletAddress: string, 
    permissions: AdminPermission[], 
    createdBy: string
  ): Promise<Admin> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      
      // Check if admin already exists
      const existingAdmin = await adminsCollection.findOne({
        wallet_address: walletAddress.toLowerCase()
      });
      
      if (existingAdmin) {
        throw new AppError('Admin already exists', 400, 'ADMIN_EXISTS');
      }
      
      const newAdmin: Admin = {
        wallet_address: walletAddress.toLowerCase(),
        permissions,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: createdBy,
        is_active: true
      };
      
      const result = await adminsCollection.insertOne(newAdmin);
      
      // Log admin action
      await this.logAdminAction(createdBy, 'add_admin', walletAddress, { permissions });
      
      return { ...newAdmin, _id: result.insertedId };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error adding admin:', error);
      throw new AppError('Failed to add admin', 500, 'ADD_ADMIN_FAILED');
    }
  }

  /**
   * Update admin permissions
   */
  public async updateAdminPermissions(
    walletAddress: string,
    permissions: AdminPermission[],
    updatedBy: string
  ): Promise<Admin> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      
      const result = await adminsCollection.findOneAndUpdate(
        { wallet_address: walletAddress.toLowerCase() },
        {
          $set: {
            permissions,
            updated_at: new Date(),
            updated_by: updatedBy
          }
        },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
      }
      
      // Log admin action
      await this.logAdminAction(updatedBy, 'update_admin_permissions', walletAddress, { permissions });
      
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating admin permissions:', error);
      throw new AppError('Failed to update admin permissions', 500, 'UPDATE_ADMIN_FAILED');
    }
  }

  /**
   * Deactivate admin
   */
  public async deactivateAdmin(walletAddress: string, deactivatedBy: string): Promise<void> {
    try {
      const adminsCollection = databaseService.getAdminsCollection();
      
      const result = await adminsCollection.updateOne(
        { wallet_address: walletAddress.toLowerCase() },
        {
          $set: {
            is_active: false,
            updated_at: new Date(),
            deactivated_by: deactivatedBy,
            deactivated_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
      }
      
      // Log admin action
      await this.logAdminAction(deactivatedBy, 'deactivate_admin', walletAddress);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error deactivating admin:', error);
      throw new AppError('Failed to deactivate admin', 500, 'DEACTIVATE_ADMIN_FAILED');
    }
  }

  /**
   * Get admin actions log
   */
  public async getAdminActions(
    adminWallet?: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<AdminAction[]> {
    try {
      const adminActionsCollection = databaseService.getAdminActionsCollection();
      
      const query: any = {};
      if (adminWallet) {
        query.admin_wallet = adminWallet.toLowerCase();
      }
      
      return await adminActionsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error getting admin actions:', error);
      return [];
    }
  }

  /**
   * Log admin action
   */
  public async logAdminAction(
    adminWallet: string,
    action: string,
    target?: string,
    details?: any
  ): Promise<void> {
    try {
      const adminActionsCollection = databaseService.getAdminActionsCollection();
      
      const adminAction: AdminAction = {
        admin_wallet: adminWallet.toLowerCase(),
        action,
        target,
        details,
        timestamp: new Date()
      };
      
      await adminActionsCollection.insertOne(adminAction);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Check if user can perform admin action (has required permission)
   */
  public async canPerformAction(
    walletAddress: string,
    requiredPermission: AdminPermission
  ): Promise<boolean> {
    return await this.hasPermission(walletAddress, requiredPermission);
  }
}

export const adminService = AdminService.getInstance();
