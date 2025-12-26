import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Round, Investment } from '@/hooks/usePonderData';

// Portfolio data structure for AI analysis
export interface PortfolioData {
  walletAddress: string;
  investments: Investment[];
  rounds: Round[];
  totalInvested: number;
  totalYield: number;
}

interface AIContextType {
  isOpen: boolean;
  focusedRound: Round | null;
  portfolioData: PortfolioData | null;
  openChat: () => void;
  closeChat: () => void;
  openWithRound: (round: Round) => void;
  openWithPortfolio: (data: PortfolioData) => void;
  clearFocus: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedRound, setFocusedRound] = useState<Round | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWithRound = useCallback((round: Round) => {
    setFocusedRound(round);
    setPortfolioData(null);
    setIsOpen(true);
  }, []);

  const openWithPortfolio = useCallback((data: PortfolioData) => {
    setPortfolioData(data);
    setFocusedRound(null);
    setIsOpen(true);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedRound(null);
    setPortfolioData(null);
  }, []);

  return (
    <AIContext.Provider value={{
      isOpen,
      focusedRound,
      portfolioData,
      openChat,
      closeChat,
      openWithRound,
      openWithPortfolio,
      clearFocus
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
