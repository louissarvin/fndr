import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Round } from '@/hooks/usePonderData';

interface AIContextType {
  isOpen: boolean;
  focusedRound: Round | null;
  openChat: () => void;
  closeChat: () => void;
  openWithRound: (round: Round) => void;
  clearFocus: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedRound, setFocusedRound] = useState<Round | null>(null);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openWithRound = useCallback((round: Round) => {
    setFocusedRound(round);
    setIsOpen(true);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedRound(null);
  }, []);

  return (
    <AIContext.Provider value={{ isOpen, focusedRound, openChat, closeChat, openWithRound, clearFocus }}>
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
