// Inline types to avoid shared package import issues
interface APIResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  _id?: any;
  wallet_address: string;
  display_name?: string;
  kucoin_uid?: string;
  telegram_handle?: string;
  x_handle?: string;
  email?: string;
  profile_picture_nft_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

interface ProfileStats {
  total_nfts_owned: number;
  reward_eligibility_status: 'eligible' | 'not_eligible' | 'pending';
  total_staked_kcs: number;
  governance_participation: boolean;
  membership_status: 'member' | 'non_member';
}

interface UserNFT {
  _id?: any;
  wallet_address: string;
  nft_token_id: number;
  metadata: {
    name: string;
    image: string;
    rarity: {
      rank: number;
      score: number;
    };
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  last_synced_at: Date;
  created_at: Date;
}

interface ProfileResponse {
  profile: UserProfile;
  stats: ProfileStats;
  owned_nfts: UserNFT[];
}

interface ProfileUpdateRequest {
  display_name?: string;
  kucoin_uid?: string;
  telegram_handle?: string;
  x_handle?: string;
  email?: string;
  profile_picture_nft_id?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export interface ProfileApi {
  getProfile(walletAddress: string, sessionToken: string): Promise<ProfileResponse>;
  updateProfile(walletAddress: string, updateData: ProfileUpdateRequest, sessionToken: string): Promise<UserProfile>;
  syncUserNFTs(walletAddress: string, sessionToken: string): Promise<{ nfts: UserNFT[]; count: number; synced_at: Date }>;
  setProfilePicture(walletAddress: string, nftTokenId: number, sessionToken: string): Promise<UserProfile>;
  getUserNFTs(walletAddress: string, sessionToken: string): Promise<{ nfts: UserNFT[]; count: number }>;
  checkMembership(walletAddress: string, sessionToken: string): Promise<{ is_member: boolean; total_nfts: number; membership_status: string }>;
}

class ProfileApiService implements ProfileApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(sessionToken: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    };
  }

  async getProfile(walletAddress: string, sessionToken: string): Promise<ProfileResponse> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}`, {
      method: 'GET',
      headers: this.getAuthHeaders(sessionToken),
    });

    const result: APIResponse<ProfileResponse> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result.data!;
  }

  async updateProfile(walletAddress: string, updateData: ProfileUpdateRequest, sessionToken: string): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(sessionToken),
      body: JSON.stringify(updateData),
    });

    const result: APIResponse<UserProfile> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to update profile');
    }

    return result.data!;
  }

  async syncUserNFTs(walletAddress: string, sessionToken: string): Promise<{ nfts: UserNFT[]; count: number; synced_at: Date }> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}/sync-nfts`, {
      method: 'POST',
      headers: this.getAuthHeaders(sessionToken),
    });

    const result: APIResponse<{ nfts: UserNFT[]; count: number; synced_at: Date }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to sync NFTs');
    }

    return result.data!;
  }

  async setProfilePicture(walletAddress: string, nftTokenId: number, sessionToken: string): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}/profile-picture`, {
      method: 'POST',
      headers: this.getAuthHeaders(sessionToken),
      body: JSON.stringify({ nft_token_id: nftTokenId }),
    });

    const result: APIResponse<UserProfile> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to set profile picture');
    }

    return result.data!;
  }

  async getUserNFTs(walletAddress: string, sessionToken: string): Promise<{ nfts: UserNFT[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}/nfts`, {
      method: 'GET',
      headers: this.getAuthHeaders(sessionToken),
    });

    const result: APIResponse<{ nfts: UserNFT[]; count: number }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to fetch user NFTs');
    }

    return result.data!;
  }

  async checkMembership(walletAddress: string, sessionToken: string): Promise<{ is_member: boolean; total_nfts: number; membership_status: string }> {
    const response = await fetch(`${this.baseUrl}/profile/${walletAddress}/membership`, {
      method: 'GET',
      headers: this.getAuthHeaders(sessionToken),
    });

    const result: APIResponse<{ is_member: boolean; total_nfts: number; membership_status: string }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to check membership');
    }

    return result.data!;
  }
}

export const profileApi = new ProfileApiService();
