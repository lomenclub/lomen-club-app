// Inline types to avoid shared package import issues
interface APIResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
}

interface AuthRequest {
  wallet_address: string;
  signature: string;
  challenge: string;
}

interface AuthResponse {
  session_token: string;
  profile: {
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
  };
  is_new_user: boolean;
  expires_at: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export interface AuthApi {
  generateChallenge(walletAddress: string): Promise<string>;
  authenticate(authRequest: AuthRequest): Promise<AuthResponse>;
  logout(sessionToken: string): Promise<boolean>;
  verifySession(sessionToken: string): Promise<{ wallet_address: string; expires_at: Date }>;
}

class AuthApiService implements AuthApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async generateChallenge(walletAddress: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });

    const result: APIResponse<{ challenge: string }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Failed to generate challenge');
    }

    return result.data!.challenge;
  }

  async authenticate(authRequest: AuthRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authRequest),
    });

    const result: APIResponse<AuthResponse> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Authentication failed');
    }

    return result.data!;
  }

  async logout(sessionToken: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_token: sessionToken }),
    });

    const result: APIResponse<{ success: boolean }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Logout failed');
    }

    return result.data!.success;
  }

  async verifySession(sessionToken: string): Promise<{ wallet_address: string; expires_at: Date }> {
    const response = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    const result: APIResponse<{ wallet_address: string; expires_at: Date }> = await response.json();

    if (result.status === 'error') {
      throw new Error(result.error || 'Session verification failed');
    }

    return result.data!;
  }
}

export const authApi = new AuthApiService();
