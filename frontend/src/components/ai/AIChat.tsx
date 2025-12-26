import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, User } from 'lucide-react';
import type { Round } from '@/hooks/usePonderData';
import { formatUnits } from 'viem';
import ReactMarkdown from 'react-markdown';
import { useAI, type PortfolioData } from './AIContext';
import { calculateCredibilityScore, getScoreExplanation } from '@/lib/credibilityScore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  rounds?: Round[];
}

const USDC_DECIMALS = 6;

function formatUSDC(value: string): string {
  const num = Number(formatUnits(BigInt(value), USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatRoundsContext(rounds: Round[]): string {
  if (!rounds || rounds.length === 0) return 'No rounds available.';

  return rounds.map(round => {
    const progress = Number(round.totalRaised) / Number(round.targetRaise) * 100;
    return `
- ${round.companyName || 'Unknown'} (${round.id.slice(0, 10)}...):
  * Target: ${formatUSDC(round.targetRaise)}
  * Raised: ${formatUSDC(round.totalRaised)} (${progress.toFixed(1)}%)
  * Investors: ${round.investorCount}
  * Equity: ${Number(round.equityPercentage) / 100}%
  * State: ${round.state === 0 ? 'Fundraising' : round.state === 1 ? 'Completed' : 'Cancelled'}
  * Founder: ${round.founder.slice(0, 10)}...`;
  }).join('\n');
}

const SUGGESTED_QUESTIONS = [
  "Which startup should I invest in?",
  "What are the risks of investing?",
  "Explain how the yield works",
  "Compare the available rounds",
];

export default function AIChat({ rounds = [] }: AIChatProps) {
  const { isOpen, focusedRound, portfolioData, closeChat, openChat, clearFocus } = useAI();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI investment advisor for FNDR. I can help you analyze startups, understand risks, and make informed investment decisions. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzedRoundId, setLastAnalyzedRoundId] = useState<string | null>(null);
  const [lastAnalyzedPortfolio, setLastAnalyzedPortfolio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Get state label with context
  const getStateContext = (state: number): { label: string; context: string } => {
    switch (state) {
      case 0:
        return {
          label: 'Fundraising (Active)',
          context: 'Direct investment is available. Analyze as an active investment opportunity.',
        };
      case 1:
        return {
          label: 'Completed (Fully Funded)',
          context: 'Primary fundraising is closed. However, equity tokens can be traded on the secondary market. Analyze from a secondary market perspective.',
        };
      case 2:
        return {
          label: 'Cancelled',
          context: 'This round was cancelled and is not available for investment.',
        };
      default:
        return {
          label: 'Unknown',
          context: 'State unknown.',
        };
    }
  };

  // Format single round for detailed analysis
  const formatSingleRoundContext = useCallback((round: Round): string => {
    const progress = Number(round.totalRaised) / Number(round.targetRaise) * 100;
    const credibility = calculateCredibilityScore(round);
    const explanation = getScoreExplanation(credibility);
    const impliedValuation = (Number(round.targetRaise) / 1e6) / (Number(round.equityPercentage) / 10000) * 100;
    const stateInfo = getStateContext(round.state);

    return `
FOCUSED ROUND ANALYSIS REQUEST:

Company: ${round.companyName || 'Unknown'}
Round Address: ${round.id}

**ROUND STATE: ${stateInfo.label}**
${stateInfo.context}

Key Metrics:
- Target Raise: ${formatUSDC(round.targetRaise)}
- Amount Raised: ${formatUSDC(round.totalRaised)} (${progress.toFixed(1)}% funded)
- Investor Count: ${round.investorCount}
- Equity Offered: ${Number(round.equityPercentage) / 100}%
- Implied Valuation: $${impliedValuation.toFixed(0)}K
- Founder: ${round.founder}
- Created: ${new Date(Number(round.createdAt) * 1000).toLocaleDateString()}

Pre-computed Credibility Score: ${credibility.score.toFixed(1)}/10 (${credibility.label})
Score Breakdown:
- Traction: ${credibility.breakdown.traction}/10
- Social Proof: ${credibility.breakdown.socialProof}/10
- Deal Quality: ${credibility.breakdown.dealQuality}/10
Quick Assessment: ${explanation}

Please provide a comprehensive analysis of this round, considering its current state.`;
  }, []);

  // Format portfolio for AI analysis
  const formatPortfolioContext = useCallback((data: PortfolioData): string => {
    const { walletAddress, investments, rounds, totalInvested, totalYield } = data;

    // Calculate portfolio metrics
    const positions = investments.map(inv => {
      const round = rounds.find(r => r.id.toLowerCase() === inv.roundId.toLowerCase());
      const investedAmount = Number(formatUnits(BigInt(inv.usdcAmount), USDC_DECIMALS));
      const percentOfPortfolio = totalInvested > 0 ? (investedAmount / totalInvested * 100) : 0;
      const credibility = round ? calculateCredibilityScore(round) : null;

      return {
        investment: inv,
        round,
        investedAmount,
        percentOfPortfolio,
        credibility,
      };
    });

    // Calculate diversification metrics
    const numPositions = positions.length;
    const largestPosition = Math.max(...positions.map(p => p.percentOfPortfolio));
    const avgCredibility = positions.filter(p => p.credibility).reduce((acc, p) => acc + (p.credibility?.score || 0), 0) / numPositions;

    // Count risk distribution
    const highRiskCount = positions.filter(p => p.credibility && p.credibility.score < 4).length;
    const mediumRiskCount = positions.filter(p => p.credibility && p.credibility.score >= 4 && p.credibility.score < 6).length;
    const lowRiskCount = positions.filter(p => p.credibility && p.credibility.score >= 6).length;

    // Format positions
    const positionsText = positions.map((p, i) => {
      const roundState = p.round?.state === 0 ? 'Fundraising' : p.round?.state === 1 ? 'Completed' : 'Unknown';
      const roundProgress = p.round ? (Number(p.round.totalRaised) / Number(p.round.targetRaise) * 100).toFixed(1) : 'N/A';

      return `
Position ${i + 1}: ${p.round?.companyName || 'Unknown Round'}
- Invested: $${p.investedAmount.toLocaleString()} (${p.percentOfPortfolio.toFixed(1)}% of portfolio)
- Tokens Held: ${Number(p.investment.tokensReceived).toLocaleString()}
- Round State: ${roundState}
- Round Progress: ${roundProgress}% funded
- Credibility Score: ${p.credibility ? `${p.credibility.score.toFixed(1)}/10 (${p.credibility.label})` : 'N/A'}`;
    }).join('\n');

    // Calculate monthly yield
    const monthlyYield = totalInvested * 0.06 / 12;

    return `
PORTFOLIO ANALYSIS REQUEST:

Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}

**PORTFOLIO SUMMARY**
- Total Invested: $${totalInvested.toLocaleString()}
- Number of Positions: ${numPositions}
- Pending Yield: $${totalYield.toFixed(2)}
- Estimated Monthly Yield: $${monthlyYield.toFixed(2)} (6% APY)

**DIVERSIFICATION METRICS**
- Largest Position: ${largestPosition.toFixed(1)}% of portfolio
- Average Credibility Score: ${avgCredibility.toFixed(1)}/10
- Risk Distribution: ${lowRiskCount} low-risk, ${mediumRiskCount} medium-risk, ${highRiskCount} high-risk

**INDIVIDUAL POSITIONS**
${positionsText}

Please provide a comprehensive portfolio analysis including:
1. Diversification assessment
2. Risk exposure analysis
3. Concentration risk evaluation
4. Yield optimization suggestions
5. Actionable recommendations to improve portfolio health`;
  }, []);

  // Auto-trigger analysis when a round is focused
  useEffect(() => {
    if (focusedRound && isOpen && focusedRound.id !== lastAnalyzedRoundId && !isLoading) {
      setLastAnalyzedRoundId(focusedRound.id);
      const companyName = focusedRound.companyName || `Round ${focusedRound.id.slice(0, 10)}...`;
      sendMessageWithContext(`Analyze the ${companyName} round in detail`, formatSingleRoundContext(focusedRound));
    }
  }, [focusedRound, isOpen, lastAnalyzedRoundId, isLoading, formatSingleRoundContext]);

  // Auto-trigger analysis when portfolio is focused
  useEffect(() => {
    if (portfolioData && isOpen && portfolioData.walletAddress !== lastAnalyzedPortfolio && !isLoading) {
      setLastAnalyzedPortfolio(portfolioData.walletAddress);
      sendMessageWithContext('Analyze my investment portfolio', formatPortfolioContext(portfolioData));
    }
  }, [portfolioData, isOpen, lastAnalyzedPortfolio, isLoading, formatPortfolioContext]);

  // Send message with optional focused round context
  const sendMessageWithContext = async (content: string, focusedContext?: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context - use focused context if available, otherwise all rounds
      const roundsContext = focusedContext || formatRoundsContext(rounds);

      const response = await fetch('http://localhost:42069/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          roundsContext,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorContent = data.error || "I'm sorry, I couldn't process that request. Please try again.";
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure the backend is running and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple send message using the context-aware function
  const sendMessage = async (content: string) => {
    // If there's a focused round, include its context
    if (focusedRound) {
      sendMessageWithContext(content, formatSingleRoundContext(focusedRound));
    } else if (portfolioData) {
      sendMessageWithContext(content, formatPortfolioContext(portfolioData));
    } else {
      sendMessageWithContext(content);
    }
  };

  // Handle closing chat and clearing focus
  const handleClose = () => {
    closeChat();
    clearFocus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  // Get context label for display
  const contextLabel = portfolioData
    ? 'Analyzing your portfolio'
    : focusedRound
    ? `Analyzing: ${focusedRound.companyName || `Round ${focusedRound.id.slice(0, 8)}...`}`
    : null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={openChat}
        className={`fixed bottom-6 right-6 z-50 bg-[#A2D5C6] text-black p-4 rounded-full shadow-lg hover:bg-[#CFFFE2] transition-all duration-300 hover:scale-110 ${
          isOpen ? 'hidden' : 'flex'
        } items-center gap-2`}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#A2D5C6]/10 px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-white">AI Investment Advisor</h3>
                {contextLabel && (
                  <p className="text-xs text-[#A2D5C6]">{contextLabel}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-[#A2D5C6]'
                      : 'bg-white/10'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-black" />
                  ) : (
                    <Bot className="h-4 w-4 text-[#A2D5C6]" />
                  )}
                </div>
                <div
                  className={`max-w-[300px] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#A2D5C6] text-black'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-[#A2D5C6] prose-headings:text-white prose-headings:text-sm prose-headings:font-semibold prose-headings:my-2">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-[#A2D5C6]" />
                </div>
                <div className="bg-white/10 px-4 py-3 rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-[#A2D5C6]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (show only at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-white/40 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-full transition-colors border border-white/10"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any startup..."
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-[#A2D5C6] text-black p-3 rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
