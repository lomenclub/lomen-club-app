import React, { useState, useEffect } from 'react';
import { KCC_MAINNET } from '../config/blockchain';
import { WalletContextType, WalletProviderProps } from './WalletContext.types';
import { WalletContext } from './WalletContext';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [kcsBalance, setKcsBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && !!window.ethereum;
  };

  // Get KCS balance
  const getKCSBalance = async (address: string) => {
    if (!isMetaMaskInstalled()) return null;
    
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert from wei to KCS (18 decimals)
      const balanceInKCS = (parseInt(balance as string, 16) / 1e18).toFixed(4);
      return balanceInKCS;
    } catch (error) {
      console.error('Error fetching KCS balance:', error);
      return null;
    }
  };

  // Get current account and chain
  const updateWalletState = async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setChainId(chainId);
        setIsConnected(true);
        
        // Fetch KCS balance when connected
        if (chainId === KCC_MAINNET.chainId) {
          const balance = await getKCSBalance(accounts[0]);
          setKcsBalance(balance);
        } else {
          setKcsBalance(null);
        }
      } else {
        setIsConnected(false);
        setAccount(null);
        setChainId(null);
        setKcsBalance(null);
      }
    } catch (error) {
      console.error('Error updating wallet state:', error);
      setIsConnected(false);
      setAccount(null);
      setChainId(null);
      setKcsBalance(null);
    }
  };

  // Switch to KCC network
  const switchToKCC = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      setError(null);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: KCC_MAINNET.chainId }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [KCC_MAINNET],
          });
        } catch (addError) {
          setError('Failed to add KCC network to MetaMask');
          console.error('Failed to add KCC network:', addError);
        }
      } else {
        setError('Failed to switch to KCC network');
        console.error('Failed to switch to KCC network:', switchError);
      }
    }
  };

  // Connect wallet with MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // First, switch to KCC network
      await switchToKCC();

      // Then request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Update chain ID after connection
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(currentChainId);
      }
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      if ((error as { code?: number }).code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Sign message with wallet
  const signMessage = async (message: string): Promise<string> => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    if (!account) {
      throw new Error('No account connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      }) as string;
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setError(null);
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    updateWalletState();

    const handleAccountsChanged = (accounts: unknown) => {
      const accountArray = accounts as string[];
      if (accountArray.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accountArray[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      const chainId = newChainId as string;
      setChainId(chainId);
      if (chainId !== KCC_MAINNET.chainId) {
        setError('Please switch to KCC Mainnet to use this application');
      } else {
        setError(null);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const value: WalletContextType = {
    isConnected,
    account,
    chainId,
    kcsBalance,
    connectWallet,
    disconnectWallet,
    switchToKCC,
    signMessage,
    isConnecting,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
