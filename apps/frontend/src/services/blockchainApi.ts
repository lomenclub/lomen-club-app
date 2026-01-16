const BLOCKCHAIN_BASE_URL = 'http://localhost:3003/api';

export interface NFTOwner {
  tokenId: number;
  owner: string;
  ownerShort: string;
  isOwned: boolean;
  note?: string;
}

export interface NFTTransaction {
  hash: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'Mint' | 'Transfer' | 'Sale';
}

export interface NFTTransactions {
  tokenId: number;
  transactions: NFTTransaction[];
  total: number;
}

export interface WalletNFTs {
  wallet: string;
  totalNFTs: number;
  nfts: Array<{
    tokenId: number;
    name: string;
  }>;
}

export interface BlockchainStats {
  totalSupply: number;
  totalOwners: number;
  floorPrice: string;
  volume24h: string;
  marketCap: string;
}

class BlockchainService {
  private baseUrl: string;

  constructor(baseUrl: string = BLOCKCHAIN_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getNFTOwner(tokenId: number): Promise<NFTOwner> {
    const response = await fetch(`${this.baseUrl}/nfts/${tokenId}/owner`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFT owner: ${response.statusText}`);
    }

    return response.json();
  }

  async getWalletNFTs(walletAddress: string): Promise<WalletNFTs> {
    const response = await fetch(`${this.baseUrl}/wallets/${walletAddress}/nfts`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet NFTs: ${response.statusText}`);
    }

    return response.json();
  }

  async getNFTTransactions(tokenId: number): Promise<NFTTransactions> {
    const response = await fetch(`${this.baseUrl}/nfts/${tokenId}/transactions`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch NFT transactions: ${response.statusText}`);
    }

    return response.json();
  }

  async getBlockchainStats(): Promise<BlockchainStats> {
    const response = await fetch(`${this.baseUrl}/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blockchain stats: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Blockchain service health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility function to format wallet addresses
  formatWalletAddress(address: string): string {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'Not Owned';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Utility function to get KCC explorer URL
  getKCCExplorerUrl(type: 'address' | 'tx' | 'token', value: string): string {
    const baseUrl = 'https://explorer.kcc.io';
    
    switch (type) {
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'token':
        return `${baseUrl}/token/${value}`;
      default:
        return baseUrl;
    }
  }
}

export const blockchainService = new BlockchainService();
