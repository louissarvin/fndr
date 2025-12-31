import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Round, Investment, Trade, SellOrder } from '@/hooks/usePonderData';

// Aggregated investment data for AI analysis
export interface AggregatedInvestmentData {
  roundId: string;
  totalUsdcAmount: bigint;
  totalTokensReceived: bigint;
  investmentCount: number;
}

// Order analysis data for marketplace
export interface OrderAnalysisData {
  order: SellOrder;
  round: Round | null;
  companyName: string;
}

// Price suggestion data for sell modal
export interface PriceSuggestionData {
  tokenContract: string;
  round: Round | null;
  companyName: string;
  tokenBalance: number;
  existingOrders: SellOrder[];
}

// Portfolio data structure for AI analysis
export interface PortfolioData {
  walletAddress: string;
  investments: Investment[];
  aggregatedInvestments: AggregatedInvestmentData[];
  trades: Trade[];
  rounds: Round[];
  balancesByToken: Record<string, bigint>;
  totalInvested: number;
  totalFromTrades: number;
  totalYield: number;
}

interface AIContextType {
  isOpen: boolean;
  focusedRound: Round | null;
  portfolioData: PortfolioData | null;
  comparisonRounds: Round[] | null;
  orderData: OrderAnalysisData | null;
  priceSuggestionData: PriceSuggestionData | null;
  openChat: () => void;
  closeChat: () => void;
  openWithRound: (round: Round) => void;
  openWithPortfolio: (data: PortfolioData) => void;
  openWithComparison: (rounds: Round[]) => void;
  openWithOrder: (data: OrderAnalysisData) => void;
  openWithPriceSuggestion: (data: PriceSuggestionData) => void;
  clearFocus: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedRound, setFocusedRound] = useState<Round | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [comparisonRounds, setComparisonRounds] = useState<Round[] | null>(null);
  const [orderData, setOrderData] = useState<OrderAnalysisData | null>(null);
  const [priceSuggestionData, setPriceSuggestionData] = useState<PriceSuggestionData | null>(null);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWithRound = useCallback((round: Round) => {
    setFocusedRound(round);
    setPortfolioData(null);
    setComparisonRounds(null);
    setOrderData(null);
    setPriceSuggestionData(null);
    setIsOpen(true);
  }, []);

  const openWithPortfolio = useCallback((data: PortfolioData) => {
    setPortfolioData(data);
    setFocusedRound(null);
    setComparisonRounds(null);
    setOrderData(null);
    setPriceSuggestionData(null);
    setIsOpen(true);
  }, []);

  const openWithComparison = useCallback((rounds: Round[]) => {
    setComparisonRounds(rounds);
    setFocusedRound(null);
    setPortfolioData(null);
    setOrderData(null);
    setPriceSuggestionData(null);
    setIsOpen(true);
  }, []);

  const openWithOrder = useCallback((data: OrderAnalysisData) => {
    setOrderData(data);
    setFocusedRound(null);
    setPortfolioData(null);
    setComparisonRounds(null);
    setPriceSuggestionData(null);
    setIsOpen(true);
  }, []);

  const openWithPriceSuggestion = useCallback((data: PriceSuggestionData) => {
    setPriceSuggestionData(data);
    setFocusedRound(null);
    setPortfolioData(null);
    setComparisonRounds(null);
    setOrderData(null);
    setIsOpen(true);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedRound(null);
    setPortfolioData(null);
    setComparisonRounds(null);
    setOrderData(null);
    setPriceSuggestionData(null);
  }, []);

  return (
    <AIContext.Provider value={{
      isOpen,
      focusedRound,
      portfolioData,
      comparisonRounds,
      orderData,
      priceSuggestionData,
      openChat,
      closeChat,
      openWithRound,
      openWithPortfolio,
      openWithComparison,
      openWithOrder,
      openWithPriceSuggestion,
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
