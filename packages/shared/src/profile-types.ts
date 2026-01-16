// Profile-related types for the Lomen Club platform

export interface UserProfile {
  _id?: any;
  wallet_address: string; // Primary identity
  display_name?: string;
  kucoin_uid?: string;
  telegram_handle?: string;
  x_handle?: string;
  email?: string;
  profile_picture_nft_id?: number; // NFT used as avatar
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface UserNFT {
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

export interface ProfileStats {
  total_nfts_owned: number;
  reward_eligibility_status: 'eligible' | 'not_eligible' | 'pending';
  total_staked_kcs: number; // Placeholder until staking integration
  governance_participation: boolean; // Future-ready placeholder
  membership_status: 'member' | 'non_member';
}

export interface AuthChallenge {
  challenge: string;
  expires_at: Date;
  wallet_address: string;
}

export interface AuthSession {
  session_token: string;
  wallet_address: string;
  expires_at: Date;
  created_at: Date;
}

export interface ProfileUpdateRequest {
  display_name?: string;
  kucoin_uid?: string;
  telegram_handle?: string;
  x_handle?: string;
  email?: string;
  profile_picture_nft_id?: number;
}

export interface ProfileResponse {
  profile: UserProfile;
  stats: ProfileStats;
  owned_nfts: UserNFT[];
}

export interface AuthRequest {
  wallet_address: string;
  signature: string;
  challenge: string;
}

export interface AuthResponse {
  session_token: string;
  profile: UserProfile;
  is_new_user: boolean;
  expires_at: Date;
}

// Validation schemas
export const ProfileValidation = {
  display_name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  kucoin_uid: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  telegram_handle: {
    minLength: 1,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  x_handle: {
    minLength: 1,
    maxLength: 15,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

export interface ProfileError {
  field: string;
  message: string;
  code: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileError[];
}
