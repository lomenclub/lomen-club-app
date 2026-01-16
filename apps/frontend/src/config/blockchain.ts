// KCC Mainnet configuration
// Note: Wallet connections typically use public RPC endpoints
// Backend blockchain service uses KCC_RPC_URL from environment for local node
export const KCC_MAINNET = {
  chainId: '0x141', // 321 in decimal
  chainName: 'KCC Mainnet',
  nativeCurrency: {
    name: 'KCS',
    symbol: 'KCS',
    decimals: 18,
  },
  rpcUrls: [import.meta.env.VITE_KCC_RPC_URL || 'https://rpc-mainnet.kcc.network'],
  blockExplorerUrls: ['https://explorer.kcc.io'],
};

// Extend Window interface to include ethereum
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}
