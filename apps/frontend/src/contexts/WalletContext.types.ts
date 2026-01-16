import { ReactNode } from 'react';

export interface WalletContextType {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  kcsBalance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToKCC: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletProviderProps {
  children: ReactNode;
}
