import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/authApi.js';
import { profileApi } from '../services/profileApi.js';
import { useWallet } from '../hooks/useWallet.js';

// Inline types to avoid shared package import issues
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

interface AuthResponse {
  session_token: string;
  profile: UserProfile;
  is_new_user: boolean;
  expires_at: Date;
}

interface ProfileContextType {
  // Authentication state
  isAuthenticated: boolean;
  sessionToken: string | null;
  authLoading: boolean;
  authError: string | null;
  
  // Profile state
  profile: ProfileResponse | null;
  profileLoading: boolean;
  profileError: string | null;
  
  // Authentication methods
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  
  // Profile methods
  updateProfile: (updateData: ProfileUpdateRequest) => Promise<UserProfile>;
  syncNFTs: () => Promise<void>;
  setProfilePicture: (nftTokenId: number) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { isConnected, account, signMessage } = useWallet();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('lomen_session_token');
    if (savedSession) {
      setSessionToken(savedSession);
      verifySession(savedSession);
    }
  }, []);

  // Restore session when wallet connects (but don't auto-authenticate)
  useEffect(() => {
    if (isConnected && account && sessionToken) {
      // Verify existing session when wallet connects
      const currentWallet = localStorage.getItem('lomen_current_wallet');
      if (currentWallet === account) {
        console.log('Wallet reconnected, verifying existing session');
        verifySession();
      } else {
        // Different wallet, clear session
        console.log('Different wallet connected, clearing session');
        logout();
      }
    } else if (!isConnected && sessionToken) {
      // Wallet disconnected but session exists - keep session for now
      console.log('Wallet disconnected but session exists');
    }
  }, [isConnected, account]);

  // Auto-load profile when authenticated
  useEffect(() => {
    if (isAuthenticated && account && sessionToken) {
      refreshProfile();
    }
  }, [isAuthenticated, account, sessionToken]);

  const authenticate = async (): Promise<void> => {
    if (!isConnected || !account) {
      setAuthError('Wallet not connected');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      console.log('Starting authentication for wallet:', account);
      
      // Generate challenge
      const challenge = await authApi.generateChallenge(account);
      console.log('Challenge generated:', challenge);
      
      // Sign challenge with wallet
      console.log('Requesting signature from wallet...');
      const signature = await signMessage(challenge);
      console.log('Signature received:', signature);
      
      // Authenticate with backend
      console.log('Authenticating with backend...');
      const authResponse: AuthResponse = await authApi.authenticate({
        wallet_address: account,
        signature,
        challenge
      });

      console.log('Authentication successful:', authResponse);

      // Store session and current wallet
      setSessionToken(authResponse.session_token);
      setIsAuthenticated(true);
      localStorage.setItem('lomen_session_token', authResponse.session_token);
      localStorage.setItem('lomen_current_wallet', account);

      // Load profile
      setProfile({
        profile: authResponse.profile,
        stats: {
          total_nfts_owned: 0,
          reward_eligibility_status: 'not_eligible',
          total_staked_kcs: 0,
          governance_participation: false,
          membership_status: 'non_member'
        },
        owned_nfts: []
      });

      // Auto-sync NFTs after authentication
      try {
        console.log('Auto-syncing NFTs...');
        await syncNFTs();
        console.log('NFT sync completed');
      } catch (error) {
        console.error('Auto-sync NFTs failed:', error);
        // Don't fail authentication if sync fails
      }

    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      setIsAuthenticated(false);
      setSessionToken(null);
      localStorage.removeItem('lomen_session_token');
      localStorage.removeItem('lomen_current_wallet');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (sessionToken) {
      try {
        await authApi.logout(sessionToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setIsAuthenticated(false);
    setSessionToken(null);
    setProfile(null);
    localStorage.removeItem('lomen_session_token');
    localStorage.removeItem('lomen_current_wallet');
  };

  const verifySession = async (token?: string): Promise<boolean> => {
    const tokenToVerify = token || sessionToken;
    if (!tokenToVerify) return false;

    try {
      await authApi.verifySession(tokenToVerify);
      setIsAuthenticated(true);
      // Restore current wallet from localStorage if available
      const currentWallet = localStorage.getItem('lomen_current_wallet');
      if (currentWallet && account && currentWallet !== account) {
        console.log('Wallet mismatch during session verification, logging out');
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      setIsAuthenticated(false);
      setSessionToken(null);
      localStorage.removeItem('lomen_session_token');
      localStorage.removeItem('lomen_current_wallet');
      return false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!account || !sessionToken) return;

    setProfileLoading(true);
    setProfileError(null);

    try {
      const profileResponse = await profileApi.getProfile(account, sessionToken);
      setProfile(profileResponse);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to fetch profile');
      
      // If profile fetch fails due to auth, logout
      if (error instanceof Error && error.message.includes('Authentication')) {
        logout();
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (updateData: ProfileUpdateRequest): Promise<UserProfile> => {
    if (!account || !sessionToken) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedProfile = await profileApi.updateProfile(account, updateData, sessionToken);
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          profile: updatedProfile
        });
      }

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const syncNFTs = async (): Promise<void> => {
    if (!account || !sessionToken) return;

    try {
      await profileApi.syncUserNFTs(account, sessionToken);
      // Refresh profile to get updated NFTs
      await refreshProfile();
    } catch (error) {
      console.error('Error syncing NFTs:', error);
      throw error;
    }
  };

  const setProfilePicture = async (nftTokenId: number): Promise<UserProfile> => {
    if (!account || !sessionToken) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedProfile = await profileApi.setProfilePicture(account, nftTokenId, sessionToken);
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          profile: updatedProfile
        });
      }

      return updatedProfile;
    } catch (error) {
      console.error('Error setting profile picture:', error);
      throw error;
    }
  };

  const value: ProfileContextType = {
    // Authentication state
    isAuthenticated,
    sessionToken,
    authLoading,
    authError,
    
    // Profile state
    profile,
    profileLoading,
    profileError,
    
    // Authentication methods
    authenticate,
    logout,
    verifySession,
    
    // Profile methods
    updateProfile,
    syncNFTs,
    setProfilePicture,
    refreshProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
