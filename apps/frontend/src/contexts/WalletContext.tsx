import { createContext } from 'react';
import { WalletContextType } from './WalletContext.types';

export const WalletContext = createContext<WalletContextType | undefined>(undefined);
