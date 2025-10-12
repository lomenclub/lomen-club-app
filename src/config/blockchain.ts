// KCC Mainnet configuration
export const KCC_MAINNET = {
  chainId: '0x141', // 321 in decimal
  chainName: 'KCC Mainnet',
  nativeCurrency: {
    name: 'KCS',
    symbol: 'KCS',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-mainnet.kcc.network'],
  blockExplorerUrls: ['https://explorer.kcc.io'],
};

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
