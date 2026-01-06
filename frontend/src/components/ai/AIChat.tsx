import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, User, FileText } from 'lucide-react';
import type { Round, Investment, Trade, SellOrder } from '@/hooks/usePonderData';
import { formatUnits } from 'viem';
import ReactMarkdown from 'react-markdown';
import { useAI, type PortfolioData, type AggregatedInvestmentData, type OrderAnalysisData, type PriceSuggestionData } from './AIContext';
import { calculateCredibilityScore, getScoreExplanation } from '@/lib/credibilityScore';
import { useAccount } from 'wagmi';
import { useRoundMetadata } from '@/hooks/useIPFS';

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

// Format price without trailing zeros (e.g., $3 instead of $3.0000)
function formatPrice(value: number): string {
  // If it's a whole number, show no decimals
  if (Number.isInteger(value)) {
    return value.toString();
  }
  // Otherwise show up to 4 decimal places, removing trailing zeros
  return parseFloat(value.toFixed(4)).toString();
}

function getTimeRemaining(expiryTimestamp: string): string {
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(expiryTimestamp);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
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
  "Assess my risk profile",
  "What are the market insights?",
  "When should I buy or sell?",
];

// Helper to fetch portfolio data from Ponder
async function fetchPortfolioData(address: string): Promise<{ investments: Investment[], trades: Trade[] }> {
  const PONDER_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:42069';

  const investmentsQuery = `
    query GetInvestorInvestments($investor: String!) {
      investments(where: { investor: $investor }, orderBy: "timestamp", orderDirection: "desc") {
        items {
          id
          roundId
          investor
          usdcAmount
          tokensReceived
          totalRaisedAtTime
          timestamp
          transactionHash
        }
      }
    }
  `;

  const tradesQuery = `
    query GetBuyerTrades($buyer: String!) {
      trades(where: { buyer: $buyer }, orderBy: "timestamp", orderDirection: "desc") {
        items {
          id
          orderId
          buyer
          seller
          tokenContract
          amount
          pricePerToken
          totalPrice
          platformFee
          timestamp
          transactionHash
        }
      }
    }
  `;

  const [investmentsRes, tradesRes] = await Promise.all([
    fetch(`${PONDER_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: investmentsQuery, variables: { investor: address.toLowerCase() } }),
    }),
    fetch(`${PONDER_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: tradesQuery, variables: { buyer: address.toLowerCase() } }),
    }),
  ]);

  const investmentsData = await investmentsRes.json();
  const tradesData = await tradesRes.json();

  return {
    investments: investmentsData.data?.investments?.items || [],
    trades: tradesData.data?.trades?.items || [],
  };
}

export default function AIChat({ rounds = [] }: AIChatProps) {
  const { isOpen, focusedRound, portfolioData, comparisonRounds, orderData, priceSuggestionData, closeChat, openChat, clearFocus } = useAI();
  const { address, isConnected } = useAccount();
  const [fetchedPortfolioData, setFetchedPortfolioData] = useState<PortfolioData | null>(null);
  const [isFetchingPortfolio, setIsFetchingPortfolio] = useState(false);
  const [isAnalyzingPitchDeck, setIsAnalyzingPitchDeck] = useState(false);

  // Get focused round metadata for pitch deck analysis
  const { data: focusedRoundMetadata } = useRoundMetadata(focusedRound?.metadataURI);
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
  const [lastComparisonKey, setLastComparisonKey] = useState<string | null>(null);
  const [lastAnalyzedOrderId, setLastAnalyzedOrderId] = useState<string | null>(null);
  const [lastPriceSuggestionToken, setLastPriceSuggestionToken] = useState<string | null>(null);
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
    const {
      walletAddress,
      aggregatedInvestments,
      trades,
      rounds,
      balancesByToken,
      totalInvested,
      totalFromTrades,
      totalYield
    } = data;

    // Calculate portfolio metrics from aggregated investments
    const positions = aggregatedInvestments.map(inv => {
      const round = rounds.find(r => r.id.toLowerCase() === inv.roundId.toLowerCase());
      const investedAmount = Number(inv.totalUsdcAmount) / 1e6;
      const tokensReceived = Number(inv.totalTokensReceived);
      const percentOfPortfolio = totalInvested > 0 ? (investedAmount / totalInvested * 100) : 0;
      const credibility = round ? calculateCredibilityScore(round) : null;

      // Get actual balance from on-chain data
      const equityToken = round?.equityToken?.toLowerCase();
      const currentBalance = equityToken && balancesByToken[equityToken]
        ? Number(balancesByToken[equityToken])
        : tokensReceived;
      const tokensSold = tokensReceived - currentBalance;

      return {
        roundId: inv.roundId,
        round,
        investedAmount,
        tokensReceived,
        currentBalance,
        tokensSold,
        percentOfPortfolio,
        credibility,
        investmentCount: inv.investmentCount,
      };
    });

    // Calculate secondary market purchases
    const purchasePositions = trades.map(trade => {
      const round = rounds.find(r => r.equityToken?.toLowerCase() === trade.tokenContract.toLowerCase());
      const paidAmount = Number(formatUnits(BigInt(trade.totalPrice), USDC_DECIMALS));
      const tokensPurchased = Number(trade.amount);
      const pricePerToken = Number(formatUnits(BigInt(trade.pricePerToken), USDC_DECIMALS));

      // Get actual balance
      const currentBalance = balancesByToken[trade.tokenContract.toLowerCase()]
        ? Number(balancesByToken[trade.tokenContract.toLowerCase()])
        : tokensPurchased;

      return {
        trade,
        round,
        paidAmount,
        tokensPurchased,
        currentBalance,
        pricePerToken,
      };
    });

    // Calculate diversification metrics
    const numInvestments = positions.length;
    const numPurchases = purchasePositions.length;
    const totalPositions = numInvestments + numPurchases;

    const largestPosition = positions.length > 0
      ? Math.max(...positions.map(p => p.percentOfPortfolio), 0)
      : 0;
    const avgCredibility = positions.filter(p => p.credibility).length > 0
      ? positions.filter(p => p.credibility).reduce((acc, p) => acc + (p.credibility?.score || 0), 0) / positions.filter(p => p.credibility).length
      : 0;

    // Count risk distribution
    const highRiskCount = positions.filter(p => p.credibility && p.credibility.score < 4).length;
    const mediumRiskCount = positions.filter(p => p.credibility && p.credibility.score >= 4 && p.credibility.score < 6).length;
    const lowRiskCount = positions.filter(p => p.credibility && p.credibility.score >= 6).length;

    // Calculate total tokens sold
    const totalTokensSold = positions.reduce((acc, p) => acc + p.tokensSold, 0);
    const hasTradeActivity = totalTokensSold > 0 || trades.length > 0;

    // Format primary investment positions
    const positionsText = positions.map((p, i) => {
      const roundState = p.round?.state === 0 ? 'Fundraising' : p.round?.state === 1 ? 'Completed' : 'Unknown';
      const roundProgress = p.round ? (Number(p.round.totalRaised) / Number(p.round.targetRaise) * 100).toFixed(1) : 'N/A';
      const soldInfo = p.tokensSold > 0 ? ` (${p.tokensSold.toLocaleString()} sold on secondary market)` : '';

      return `
Investment ${i + 1}: ${p.round?.companyName || 'Unknown Round'}
- Total Invested: $${p.investedAmount.toLocaleString()} (${p.percentOfPortfolio.toFixed(1)}% of portfolio)
- Tokens Received: ${p.tokensReceived.toLocaleString()}
- Current Balance: ${p.currentBalance.toLocaleString()}${soldInfo}
- Round State: ${roundState}
- Round Progress: ${roundProgress}% funded
- Credibility Score: ${p.credibility ? `${p.credibility.score.toFixed(1)}/10 (${p.credibility.label})` : 'N/A'}
- Investment Count: ${p.investmentCount} investment(s) in this round`;
    }).join('\n');

    // Format secondary market purchases
    const purchasesText = purchasePositions.length > 0
      ? purchasePositions.map((p, i) => {
          return `
Purchase ${i + 1}: ${p.round?.companyName || 'Unknown Token'}
- Paid: $${p.paidAmount.toLocaleString()}
- Tokens Purchased: ${p.tokensPurchased.toLocaleString()}
- Price Per Token: $${p.pricePerToken.toLocaleString()}
- Current Balance: ${p.currentBalance.toLocaleString()}`;
        }).join('\n')
      : 'No secondary market purchases.';

    // Calculate monthly yield (only on primary investments)
    const primaryInvested = totalInvested - totalFromTrades;
    const monthlyYield = primaryInvested * 0.06 / 12;

    return `
PORTFOLIO ANALYSIS REQUEST:

Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}

**PORTFOLIO SUMMARY**
- Total Capital Deployed: $${totalInvested.toLocaleString()}
  - Primary Investments: $${primaryInvested.toLocaleString()}
  - Secondary Market Purchases: $${totalFromTrades.toLocaleString()}
- Number of Primary Investments: ${numInvestments}
- Number of Secondary Purchases: ${numPurchases}
- Pending Yield: $${totalYield.toFixed(2)}
- Estimated Monthly Yield: $${monthlyYield.toFixed(2)} (6% APY on primary investments)

**TRADING ACTIVITY**
- Tokens Sold on Secondary Market: ${totalTokensSold.toLocaleString()}
- Trading Status: ${hasTradeActivity ? 'Active trader' : 'No trading activity'}

**DIVERSIFICATION METRICS**
- Largest Position: ${largestPosition.toFixed(1)}% of portfolio
- Average Credibility Score: ${avgCredibility.toFixed(1)}/10
- Risk Distribution: ${lowRiskCount} low-risk, ${mediumRiskCount} medium-risk, ${highRiskCount} high-risk

**PRIMARY INVESTMENTS (Direct from Fundraising Rounds)**
${positionsText || 'No primary investments.'}

**SECONDARY MARKET PURCHASES**
${purchasesText}

Please provide a comprehensive portfolio analysis including:
1. Diversification assessment across primary and secondary holdings
2. Risk exposure analysis
3. Trading activity evaluation (buying/selling patterns)
4. Yield optimization suggestions (note: only primary investments earn 6% APY)
5. Secondary market strategy recommendations
6. Actionable recommendations to improve portfolio health`;
  }, []);

  // Format risk profile assessment context
  const formatRiskProfileContext = useCallback((data: PortfolioData, allRounds: Round[]): string => {
    const {
      aggregatedInvestments,
      trades,
      rounds,
      balancesByToken,
      totalInvested,
      totalFromTrades,
    } = data;

    // Calculate risk metrics
    const positions = aggregatedInvestments.map(inv => {
      const round = rounds.find(r => r.id.toLowerCase() === inv.roundId.toLowerCase());
      const investedAmount = Number(inv.totalUsdcAmount) / 1e6;
      const credibility = round ? calculateCredibilityScore(round) : null;
      const equityToken = round?.equityToken?.toLowerCase();
      const currentBalance = equityToken && balancesByToken[equityToken]
        ? Number(balancesByToken[equityToken])
        : Number(inv.totalTokensReceived);
      const tokensSold = Number(inv.totalTokensReceived) - currentBalance;

      return { round, investedAmount, credibility, tokensSold };
    });

    // Risk behavior indicators
    const highRiskPositions = positions.filter(p => p.credibility && p.credibility.score < 4);
    const mediumRiskPositions = positions.filter(p => p.credibility && p.credibility.score >= 4 && p.credibility.score < 6);
    const lowRiskPositions = positions.filter(p => p.credibility && p.credibility.score >= 6);

    const highRiskAmount = highRiskPositions.reduce((acc, p) => acc + p.investedAmount, 0);
    const mediumRiskAmount = mediumRiskPositions.reduce((acc, p) => acc + p.investedAmount, 0);
    const lowRiskAmount = lowRiskPositions.reduce((acc, p) => acc + p.investedAmount, 0);

    const hasTraded = trades.length > 0 || positions.some(p => p.tokensSold > 0);
    const diversificationScore = positions.length > 0 ? Math.min(10, positions.length * 2) : 0;
    const avgCredibility = positions.filter(p => p.credibility).length > 0
      ? positions.filter(p => p.credibility).reduce((acc, p) => acc + (p.credibility?.score || 0), 0) / positions.filter(p => p.credibility).length
      : 0;

    // Determine risk profile
    let riskProfile = 'Unknown';
    let profileDetails = '';
    const highRiskPercentage = totalInvested > 0 ? (highRiskAmount / totalInvested * 100) : 0;
    const lowRiskPercentage = totalInvested > 0 ? (lowRiskAmount / totalInvested * 100) : 0;

    if (highRiskPercentage > 50) {
      riskProfile = 'Aggressive';
      profileDetails = 'Over 50% in high-risk investments';
    } else if (lowRiskPercentage > 60) {
      riskProfile = 'Conservative';
      profileDetails = 'Over 60% in low-risk investments';
    } else {
      riskProfile = 'Moderate';
      profileDetails = 'Balanced mix of risk levels';
    }

    return `
RISK PROFILE ASSESSMENT REQUEST:

**CURRENT PORTFOLIO RISK ANALYSIS**

Investment Behavior:
- Total Capital Deployed: $${totalInvested.toLocaleString()}
- Primary Investments: $${(totalInvested - totalFromTrades).toLocaleString()}
- Secondary Market Purchases: $${totalFromTrades.toLocaleString()}
- Number of Positions: ${positions.length}
- Trading Activity: ${hasTraded ? 'Active trader' : 'Buy and hold'}

Risk Distribution:
- High-Risk Investments: $${highRiskAmount.toLocaleString()} (${highRiskPercentage.toFixed(1)}%)
- Medium-Risk Investments: $${mediumRiskAmount.toLocaleString()} (${(mediumRiskAmount / totalInvested * 100).toFixed(1)}%)
- Low-Risk Investments: $${lowRiskAmount.toLocaleString()} (${lowRiskPercentage.toFixed(1)}%)

Risk Metrics:
- Diversification Score: ${diversificationScore}/10
- Average Credibility Score: ${avgCredibility.toFixed(1)}/10
- Estimated Risk Profile: ${riskProfile} (${profileDetails})

**AVAILABLE INVESTMENT OPPORTUNITIES**
Active Rounds on Platform: ${allRounds.filter(r => r.state === 0).length}
Completed Rounds (Secondary Market): ${allRounds.filter(r => r.state === 1).length}

Please provide a comprehensive risk profile assessment including:
1. Detailed risk profile classification (Conservative, Moderate, Aggressive)
2. Analysis of current portfolio risk exposure
3. Behavioral patterns (trading frequency, position sizing)
4. Recommendations based on risk tolerance
5. Suggested portfolio rebalancing if needed
6. Warning signs or areas of concern`;
  }, []);

  // Format market insights context
  const formatMarketInsightsContext = useCallback((allRounds: Round[]): string => {
    const activeRounds = allRounds.filter(r => r.state === 0);
    const completedRounds = allRounds.filter(r => r.state === 1);
    const cancelledRounds = allRounds.filter(r => r.state === 2);

    // Calculate market metrics
    const totalTargetRaise = allRounds.reduce((acc, r) => acc + Number(r.targetRaise), 0) / 1e6;
    const totalRaised = allRounds.reduce((acc, r) => acc + Number(r.totalRaised), 0) / 1e6;
    const totalInvestors = allRounds.reduce((acc, r) => acc + r.investorCount, 0);

    // Active round metrics
    const activeTargetRaise = activeRounds.reduce((acc, r) => acc + Number(r.targetRaise), 0) / 1e6;
    const activeRaised = activeRounds.reduce((acc, r) => acc + Number(r.totalRaised), 0) / 1e6;
    const avgActiveProgress = activeRounds.length > 0
      ? activeRounds.reduce((acc, r) => acc + (Number(r.totalRaised) / Number(r.targetRaise) * 100), 0) / activeRounds.length
      : 0;

    // Calculate average valuations
    const valuations = allRounds.map(r => {
      const target = Number(r.targetRaise) / 1e6;
      const equity = Number(r.equityPercentage) / 10000;
      return equity > 0 ? target / equity * 100 : 0;
    }).filter(v => v > 0);
    const avgValuation = valuations.length > 0 ? valuations.reduce((a, b) => a + b, 0) / valuations.length : 0;

    // Top performing rounds
    const topRoundsByProgress = [...activeRounds]
      .sort((a, b) => (Number(b.totalRaised) / Number(b.targetRaise)) - (Number(a.totalRaised) / Number(a.targetRaise)))
      .slice(0, 3);

    // Best credibility scores
    const roundsWithCredibility = allRounds.map(r => ({
      round: r,
      credibility: calculateCredibilityScore(r)
    })).sort((a, b) => b.credibility.score - a.credibility.score);
    const topByCredibility = roundsWithCredibility.slice(0, 3);

    const topProgressText = topRoundsByProgress.map(r => {
      const progress = (Number(r.totalRaised) / Number(r.targetRaise) * 100).toFixed(1);
      return `- ${r.companyName || 'Unknown'}: ${progress}% funded (${r.investorCount} investors)`;
    }).join('\n');

    const topCredibilityText = topByCredibility.map(({ round, credibility }) => {
      return `- ${round.companyName || 'Unknown'}: ${credibility.score.toFixed(1)}/10 (${credibility.label})`;
    }).join('\n');

    return `
MARKET INSIGHTS REQUEST:

**PLATFORM OVERVIEW**
- Total Rounds: ${allRounds.length}
- Active Fundraising: ${activeRounds.length}
- Completed: ${completedRounds.length}
- Cancelled: ${cancelledRounds.length}

**FUNDING METRICS**
- Total Target Raise (All Rounds): $${totalTargetRaise.toLocaleString()}K
- Total Raised (All Rounds): $${totalRaised.toLocaleString()}K
- Total Investors: ${totalInvestors}
- Average Valuation: $${avgValuation.toFixed(0)}K

**ACTIVE MARKET**
- Active Target Raise: $${activeTargetRaise.toLocaleString()}K
- Active Amount Raised: $${activeRaised.toLocaleString()}K
- Average Funding Progress: ${avgActiveProgress.toFixed(1)}%

**TOP PERFORMING ROUNDS (By Funding Progress)**
${topProgressText || 'No active rounds'}

**HIGHEST CREDIBILITY ROUNDS**
${topCredibilityText || 'No rounds available'}

Please provide comprehensive market insights including:
1. Overall market health assessment
2. Trends in fundraising activity
3. Investment opportunities to watch
4. Risk considerations for the current market
5. Comparison to typical early-stage startup metrics
6. Actionable recommendations for investors`;
  }, []);

  // Format entry/exit suggestions context
  const formatEntryExitContext = useCallback((data: PortfolioData | null, allRounds: Round[]): string => {
    const activeRounds = allRounds.filter(r => r.state === 0);
    const completedRounds = allRounds.filter(r => r.state === 1);

    // Analyze entry opportunities
    const entryOpportunities = activeRounds.map(round => {
      const progress = Number(round.totalRaised) / Number(round.targetRaise) * 100;
      const credibility = calculateCredibilityScore(round);
      const impliedValuation = (Number(round.targetRaise) / 1e6) / (Number(round.equityPercentage) / 10000) * 100;

      return {
        round,
        progress,
        credibility,
        impliedValuation,
        urgency: progress > 80 ? 'High' : progress > 50 ? 'Medium' : 'Low',
      };
    }).sort((a, b) => b.credibility.score - a.credibility.score);

    const entryText = entryOpportunities.slice(0, 5).map(opp => {
      return `
${opp.round.companyName || 'Unknown'}:
- Progress: ${opp.progress.toFixed(1)}% funded
- Credibility: ${opp.credibility.score.toFixed(1)}/10 (${opp.credibility.label})
- Valuation: $${opp.impliedValuation.toFixed(0)}K
- Entry Urgency: ${opp.urgency}`;
    }).join('\n');

    // Portfolio context for exit analysis
    let exitText = 'No portfolio data available for exit analysis.';
    if (data) {
      const positions = data.aggregatedInvestments.map(inv => {
        const round = data.rounds.find(r => r.id.toLowerCase() === inv.roundId.toLowerCase());
        const investedAmount = Number(inv.totalUsdcAmount) / 1e6;
        const tokensReceived = Number(inv.totalTokensReceived);
        const equityToken = round?.equityToken?.toLowerCase();
        const currentBalance = equityToken && data.balancesByToken[equityToken]
          ? Number(data.balancesByToken[equityToken])
          : tokensReceived;

        return {
          round,
          investedAmount,
          tokensReceived,
          currentBalance,
          roundComplete: round?.state === 1,
        };
      });

      const exitablePositions = positions.filter(p => p.roundComplete && p.currentBalance > 0);

      if (exitablePositions.length > 0) {
        exitText = exitablePositions.map(pos => {
          const credibility = pos.round ? calculateCredibilityScore(pos.round) : null;
          return `
${pos.round?.companyName || 'Unknown'}:
- Invested: $${pos.investedAmount.toLocaleString()}
- Current Balance: ${pos.currentBalance.toLocaleString()} tokens
- Round State: Completed (available on secondary market)
- Credibility: ${credibility ? `${credibility.score.toFixed(1)}/10` : 'N/A'}`;
        }).join('\n');
      } else {
        exitText = 'No completed positions available for secondary market exit.';
      }
    }

    return `
ENTRY/EXIT ANALYSIS REQUEST:

**ENTRY OPPORTUNITIES (Active Rounds)**
${entryText || 'No active rounds available.'}

**SECONDARY MARKET CONTEXT**
- Rounds Available on Secondary Market: ${completedRounds.length}
${completedRounds.slice(0, 3).map(r => {
  const credibility = calculateCredibilityScore(r);
  return `- ${r.companyName || 'Unknown'}: ${credibility.score.toFixed(1)}/10 credibility, ${r.investorCount} investors`;
}).join('\n')}

**EXIT ANALYSIS (Your Holdings)**
${exitText}

Please provide entry/exit recommendations including:
1. Best entry points based on timing, valuation, and credibility
2. Rounds nearing completion (high urgency to invest)
3. Exit strategy for completed round positions
4. Secondary market opportunities
5. Risk-adjusted recommendations
6. Timing considerations and warning signs`;
  }, []);

  // Format comparison context for multiple rounds
  const formatComparisonContext = useCallback((roundsToCompare: Round[]): string => {
    const roundsData = roundsToCompare.map(round => {
      const progress = Number(round.totalRaised) / Number(round.targetRaise) * 100;
      const credibility = calculateCredibilityScore(round);
      const impliedValuation = (Number(round.targetRaise) / 1e6) / (Number(round.equityPercentage) / 10000) * 100;
      const stateInfo = getStateContext(round.state);

      return {
        round,
        progress,
        credibility,
        impliedValuation,
        stateInfo,
      };
    });

    const comparisonTable = roundsData.map((data, i) => {
      const { round, progress, credibility, impliedValuation, stateInfo } = data;
      return `
**Round ${i + 1}: ${round.companyName || 'Unknown'}**
- Address: ${round.id.slice(0, 10)}...
- State: ${stateInfo.label}
- Target Raise: ${formatUSDC(round.targetRaise)}
- Amount Raised: ${formatUSDC(round.totalRaised)} (${progress.toFixed(1)}% funded)
- Investor Count: ${round.investorCount}
- Equity Offered: ${Number(round.equityPercentage) / 100}%
- Implied Valuation: $${impliedValuation.toFixed(0)}K
- Credibility Score: ${credibility.score.toFixed(1)}/10 (${credibility.label})
  - Traction: ${credibility.breakdown.traction}/10
  - Social Proof: ${credibility.breakdown.socialProof}/10
  - Deal Quality: ${credibility.breakdown.dealQuality}/10
- Created: ${new Date(Number(round.createdAt) * 1000).toLocaleDateString()}`;
    }).join('\n');

    // Calculate comparison metrics
    const avgCredibility = roundsData.reduce((acc, d) => acc + d.credibility.score, 0) / roundsData.length;
    const bestCredibility = roundsData.reduce((best, d) => d.credibility.score > best.credibility.score ? d : best);
    const lowestValuation = roundsData.reduce((lowest, d) => d.impliedValuation < lowest.impliedValuation ? d : lowest);
    const mostFunded = roundsData.reduce((most, d) => d.progress > most.progress ? d : most);

    return `
ROUND COMPARISON REQUEST:

Comparing ${roundsToCompare.length} rounds side-by-side:

${comparisonTable}

**QUICK COMPARISON SUMMARY**
- Highest Credibility: ${bestCredibility.round.companyName} (${bestCredibility.credibility.score.toFixed(1)}/10)
- Lowest Valuation: ${lowestValuation.round.companyName} ($${lowestValuation.impliedValuation.toFixed(0)}K)
- Most Progress: ${mostFunded.round.companyName} (${mostFunded.progress.toFixed(1)}% funded)
- Average Credibility: ${avgCredibility.toFixed(1)}/10

Please provide a comprehensive comparison analysis including:
1. Side-by-side comparison of key metrics
2. Risk assessment for each round
3. Value proposition analysis (valuation vs equity offered)
4. Investment timing considerations (based on round state and progress)
5. Clear recommendation on which round(s) offer the best opportunity and why
6. Any red flags or concerns to be aware of`;
  }, []);

  // Format order analysis context for marketplace
  const formatOrderContext = useCallback((data: OrderAnalysisData): string => {
    const { order, round, companyName } = data;
    const pricePerToken = Number(formatUnits(BigInt(order.pricePerToken), USDC_DECIMALS));
    const totalValue = Number(order.amount) * pricePerToken;
    const timeRemaining = getTimeRemaining(order.expiryTime);

    // Calculate round metrics if available
    let roundContext = 'Round information not available.';
    let dealAssessment = '';

    if (round) {
      const credibility = calculateCredibilityScore(round);
      const impliedValuation = (Number(round.targetRaise) / 1e6) / (Number(round.equityPercentage) / 10000) * 100;
      const originalPricePerToken = Number(round.targetRaise) / Number(round.tokensIssued);
      const priceChange = ((pricePerToken - originalPricePerToken) / originalPricePerToken) * 100;

      roundContext = `
**UNDERLYING STARTUP**
- Company: ${round.companyName || 'Unknown'}
- Round State: ${round.state === 0 ? 'Fundraising' : round.state === 1 ? 'Completed' : 'Cancelled'}
- Total Raised: ${formatUSDC(round.totalRaised)}
- Target Raise: ${formatUSDC(round.targetRaise)}
- Investors: ${round.investorCount}
- Equity Offered: ${Number(round.equityPercentage) / 100}%
- Implied Valuation: $${impliedValuation.toFixed(0)}K
- Credibility Score: ${credibility.score.toFixed(1)}/10 (${credibility.label})`;

      dealAssessment = `
**DEAL ASSESSMENT**
- Original Token Price (from round): $${formatPrice(originalPricePerToken)}
- Current Ask Price: $${formatPrice(pricePerToken)}
- Price Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
- ${priceChange > 0 ? 'PREMIUM: Seller is asking more than original investment price' : priceChange < 0 ? 'DISCOUNT: Seller is asking less than original investment price' : 'FAIR: Price matches original investment'}`;
    }

    return `
SELL ORDER ANALYSIS REQUEST:

**ORDER DETAILS**
- Seller: ${order.seller.slice(0, 6)}...${order.seller.slice(-4)}
- Token Contract: ${order.tokenContract.slice(0, 10)}...
- Company: ${companyName}
- Amount Available: ${Number(order.amount).toLocaleString()} tokens
- Price Per Token: $${formatPrice(pricePerToken)}
- Total Value: $${totalValue.toLocaleString()}
- Time Remaining: ${timeRemaining}
- Order Created: ${new Date(Number(order.createdAt) * 1000).toLocaleDateString()}

${roundContext}
${dealAssessment}

Please provide a comprehensive analysis of this sell order including:
1. Is this a good deal? (Compare to original investment price if available)
2. Risk assessment of the underlying startup
3. Fair value analysis - is the price justified?
4. Timing considerations (order expiry, round state)
5. Buy recommendation (Strong Buy, Buy, Hold, or Avoid)
6. Any red flags or concerns`;
  }, []);

  // Format price suggestion context for sell modal
  const formatPriceSuggestionContext = useCallback((data: PriceSuggestionData): string => {
    const { tokenContract, round, companyName, tokenBalance, existingOrders } = data;

    // Analyze existing orders for this token
    const tokenOrders = existingOrders.filter(o => o.tokenContract.toLowerCase() === tokenContract.toLowerCase());
    const orderPrices = tokenOrders.map(o => Number(formatUnits(BigInt(o.pricePerToken), USDC_DECIMALS)));
    const avgPrice = orderPrices.length > 0 ? orderPrices.reduce((a, b) => a + b, 0) / orderPrices.length : 0;
    const minPrice = orderPrices.length > 0 ? Math.min(...orderPrices) : 0;
    const maxPrice = orderPrices.length > 0 ? Math.max(...orderPrices) : 0;

    let roundContext = 'Round information not available.';
    let originalPrice = 0;

    if (round) {
      const credibility = calculateCredibilityScore(round);
      const impliedValuation = (Number(round.targetRaise) / 1e6) / (Number(round.equityPercentage) / 10000) * 100;
      originalPrice = Number(round.targetRaise) / Number(round.tokensIssued);

      roundContext = `
**UNDERLYING STARTUP**
- Company: ${round.companyName || 'Unknown'}
- Round State: ${round.state === 0 ? 'Fundraising' : round.state === 1 ? 'Completed' : 'Cancelled'}
- Total Raised: ${formatUSDC(round.totalRaised)}
- Target Raise: ${formatUSDC(round.targetRaise)}
- Tokens Issued: ${Number(round.tokensIssued).toLocaleString()}
- Implied Valuation: $${impliedValuation.toFixed(0)}K
- Credibility Score: ${credibility.score.toFixed(1)}/10 (${credibility.label})
- Original Token Price: $${formatPrice(originalPrice)}`;
    }

    const marketContext = tokenOrders.length > 0 ? `
**CURRENT MARKET (${tokenOrders.length} active orders)**
- Lowest Ask: $${formatPrice(minPrice)}
- Highest Ask: $${formatPrice(maxPrice)}
- Average Ask: $${formatPrice(avgPrice)}
- Total Tokens Listed: ${tokenOrders.reduce((acc, o) => acc + Number(o.amount), 0).toLocaleString()}` : `
**CURRENT MARKET**
No existing orders for this token. You'll be setting the market price.`;

    return `
PRICE SUGGESTION REQUEST:

**YOUR LISTING**
- Token Contract: ${tokenContract.slice(0, 10)}...
- Company: ${companyName}
- Your Token Balance: ${tokenBalance.toLocaleString()} tokens

${roundContext}
${marketContext}

Please provide pricing recommendations including:
1. Suggested price range (minimum, recommended, maximum)
2. Rationale based on original investment price and current market
3. Competitive pricing strategy (undercut market vs premium)
4. Volume considerations (sell all at once vs partial)
5. Timing advice (is now a good time to sell?)
6. Risk of not selling (holding vs liquidating)`;
  }, []);

  // Analyze pitch deck
  const analyzePitchDeck = async () => {
    if (!focusedRound || !focusedRoundMetadata?.pitchDeck || isAnalyzingPitchDeck || isLoading) return;

    const pitchDeckHash = focusedRoundMetadata.pitchDeck;
    const companyName = focusedRound.companyName || 'Unknown';

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Analyze the pitch deck for ${companyName}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsAnalyzingPitchDeck(true);

    try {
      // Format round context for additional info
      const roundContext = formatSingleRoundContext(focusedRound);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/ai/analyze-pitchdeck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pitchDeckHash,
          roundContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorContent = data.error || "I couldn't analyze the pitch deck. Please try again.";
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
        content: data.response || "I couldn't generate an analysis.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Pitch deck analysis error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble analyzing the pitch deck. Please make sure the backend is running and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzingPitchDeck(false);
    }
  };

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

  // Auto-trigger analysis when comparing rounds
  useEffect(() => {
    if (comparisonRounds && comparisonRounds.length > 0 && isOpen && !isLoading) {
      const comparisonKey = comparisonRounds.map(r => r.id).sort().join('-');
      if (comparisonKey !== lastComparisonKey) {
        setLastComparisonKey(comparisonKey);
        const names = comparisonRounds.map(r => r.companyName || 'Unknown').join(' vs ');
        sendMessageWithContext(`Compare these rounds: ${names}`, formatComparisonContext(comparisonRounds));
      }
    }
  }, [comparisonRounds, isOpen, lastComparisonKey, isLoading, formatComparisonContext]);

  // Auto-trigger analysis when order is focused (marketplace)
  useEffect(() => {
    if (orderData && isOpen && orderData.order.id !== lastAnalyzedOrderId && !isLoading) {
      setLastAnalyzedOrderId(orderData.order.id);
      sendMessageWithContext(`Analyze this sell order for ${orderData.companyName}`, formatOrderContext(orderData));
    }
  }, [orderData, isOpen, lastAnalyzedOrderId, isLoading, formatOrderContext]);

  // Auto-trigger analysis when price suggestion is requested
  useEffect(() => {
    if (priceSuggestionData && isOpen && priceSuggestionData.tokenContract !== lastPriceSuggestionToken && !isLoading) {
      setLastPriceSuggestionToken(priceSuggestionData.tokenContract);
      sendMessageWithContext(`Suggest a price for selling ${priceSuggestionData.companyName} tokens`, formatPriceSuggestionContext(priceSuggestionData));
    }
  }, [priceSuggestionData, isOpen, lastPriceSuggestionToken, isLoading, formatPriceSuggestionContext]);

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

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/ai/chat`, {
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

  // Build portfolio data from investments and trades
  const buildPortfolioData = useCallback((
    walletAddress: string,
    investments: Investment[],
    trades: Trade[],
    allRounds: Round[]
  ): PortfolioData => {
    // Aggregate investments by round
    const aggregatedMap = new Map<string, AggregatedInvestmentData>();
    investments.forEach(inv => {
      const roundId = inv.roundId.toLowerCase();
      const existing = aggregatedMap.get(roundId);
      if (existing) {
        existing.totalUsdcAmount = existing.totalUsdcAmount + BigInt(inv.usdcAmount);
        existing.totalTokensReceived = existing.totalTokensReceived + BigInt(inv.tokensReceived);
        existing.investmentCount += 1;
      } else {
        aggregatedMap.set(roundId, {
          roundId: inv.roundId,
          totalUsdcAmount: BigInt(inv.usdcAmount),
          totalTokensReceived: BigInt(inv.tokensReceived),
          investmentCount: 1,
        });
      }
    });
    const aggregatedInvestments = Array.from(aggregatedMap.values());

    // Calculate totals
    const totalInvested = investments.reduce((acc, inv) => acc + Number(inv.usdcAmount) / 1e6, 0);
    const totalFromTrades = trades.reduce((acc, t) => acc + Number(formatUnits(BigInt(t.totalPrice), USDC_DECIMALS)), 0);

    // Get relevant rounds
    const investedRoundIds = new Set(investments.map(i => i.roundId.toLowerCase()));
    const tradeTokens = new Set(trades.map(t => t.tokenContract.toLowerCase()));
    const relevantRounds = allRounds.filter(r =>
      investedRoundIds.has(r.id.toLowerCase()) ||
      (r.equityToken && tradeTokens.has(r.equityToken.toLowerCase()))
    );

    return {
      walletAddress,
      investments,
      aggregatedInvestments,
      trades,
      rounds: relevantRounds,
      balancesByToken: {}, // Will be populated with on-chain data in real portfolio
      totalInvested: totalInvested + totalFromTrades,
      totalFromTrades,
      totalYield: totalInvested * 0.06 / 12, // Estimated monthly yield
    };
  }, []);

  // Simple send message using the context-aware function
  const sendMessage = async (content: string) => {
    const lowerContent = content.toLowerCase();

    // Detect special query types and provide appropriate context
    const isRiskQuery = lowerContent.includes('risk profile') || lowerContent.includes('risk assessment') || lowerContent.includes('my risk');
    const isMarketQuery = lowerContent.includes('market insight') || lowerContent.includes('market overview') || lowerContent.includes('market health');
    const isEntryExitQuery = lowerContent.includes('buy or sell') || lowerContent.includes('entry') || lowerContent.includes('exit') || lowerContent.includes('when should i');

    // Get effective portfolio data (from context or fetch if needed)
    let effectivePortfolioData = portfolioData || fetchedPortfolioData;

    // For risk queries, try to fetch portfolio data if not available
    if ((isRiskQuery || isEntryExitQuery) && !effectivePortfolioData && isConnected && address) {
      try {
        setIsFetchingPortfolio(true);
        const { investments, trades } = await fetchPortfolioData(address);

        if (investments.length > 0 || trades.length > 0) {
          effectivePortfolioData = buildPortfolioData(address, investments, trades, rounds);
          setFetchedPortfolioData(effectivePortfolioData);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
      } finally {
        setIsFetchingPortfolio(false);
      }
    }

    // Handle case where risk query is made but no wallet is connected
    if (isRiskQuery && !isConnected) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "To assess your risk profile, I need to analyze your portfolio. Please connect your wallet first, and I'll be able to evaluate your investment positions, risk distribution, and provide personalized recommendations.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

    // Handle case where no portfolio data found
    if (isRiskQuery && isConnected && !effectivePortfolioData) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I couldn't find any investment positions in your portfolio. To assess your risk profile, you'll need to have at least one investment. Browse the available rounds and make your first investment, then come back for a comprehensive risk assessment!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

    // Include appropriate context based on query type or current focus
    if (isRiskQuery && effectivePortfolioData) {
      sendMessageWithContext(content, formatRiskProfileContext(effectivePortfolioData, rounds));
    } else if (isMarketQuery) {
      sendMessageWithContext(content, formatMarketInsightsContext(rounds));
    } else if (isEntryExitQuery) {
      sendMessageWithContext(content, formatEntryExitContext(effectivePortfolioData, rounds));
    } else if (orderData) {
      sendMessageWithContext(content, formatOrderContext(orderData));
    } else if (priceSuggestionData) {
      sendMessageWithContext(content, formatPriceSuggestionContext(priceSuggestionData));
    } else if (focusedRound) {
      sendMessageWithContext(content, formatSingleRoundContext(focusedRound));
    } else if (effectivePortfolioData) {
      sendMessageWithContext(content, formatPortfolioContext(effectivePortfolioData));
    } else if (comparisonRounds && comparisonRounds.length > 0) {
      sendMessageWithContext(content, formatComparisonContext(comparisonRounds));
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
  const effectivePortfolio = portfolioData || fetchedPortfolioData;
  const contextLabel = isFetchingPortfolio
    ? 'Loading your portfolio...'
    : orderData
    ? `Analyzing order: ${orderData.companyName}`
    : priceSuggestionData
    ? `Pricing: ${priceSuggestionData.companyName}`
    : effectivePortfolio
    ? 'Analyzing your portfolio'
    : focusedRound
    ? `Analyzing: ${focusedRound.companyName || `Round ${focusedRound.id.slice(0, 8)}...`}`
    : comparisonRounds && comparisonRounds.length > 0
    ? `Comparing ${comparisonRounds.length} rounds`
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

          {/* Pitch Deck Analysis Button (show when focused round has pitch deck) */}
          {focusedRound && focusedRoundMetadata?.pitchDeck && (
            <div className="px-4 pb-2">
              <button
                onClick={analyzePitchDeck}
                disabled={isAnalyzingPitchDeck || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#A2D5C6]/10 hover:bg-[#A2D5C6]/20 text-[#A2D5C6] px-4 py-2.5 rounded-xl transition-colors border border-[#A2D5C6]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzingPitchDeck ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Analyzing Pitch Deck...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Analyze Pitch Deck with AI</span>
                  </>
                )}
              </button>
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
