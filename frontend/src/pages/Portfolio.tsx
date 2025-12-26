import { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import Layout from '@/components/layout/Layout';
import { useInvestorInvestments, useRound, useRounds, type Investment } from '@/hooks/usePonderData';
import { useRoundMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import { useMultiRoundInvestorYield, useMultiRoundYieldInfo, useClaimYield, USDC_DECIMALS as CONTRACT_USDC_DECIMALS } from '@/hooks/useContracts';
import { useAI } from '@/components/ai/AIContext';
import AIChat from '@/components/ai/AIChat';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  ChevronRight,
  WifiOff,
  Loader2,
  ExternalLink,
  Rocket,
  RefreshCw,
  Bot
} from 'lucide-react';

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

function formatTokenAmount(value: string): string {
  // Token amounts are stored as whole numbers (not scaled to 18 decimals)
  // The contract calculates: tokensToMint = usdcAmount / sharePrice (no decimal scaling)
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Investment card for indexed data
function InvestmentCard({ investment }: { investment: Investment }) {
  const { data: round } = useRound(investment.roundId);
  const { data: metadata, isLoading: isLoadingMetadata } = useRoundMetadata(round?.metadataURI);

  // Get image: IPFS logo > fallback placeholder
  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;

  // Get company name: metadata > indexed > shortened address
  const companyName = metadata?.name || round?.companyName || `Round ${shortenAddress(investment.roundId)}`;

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5 hover:bg-[#A2D5C6]/15 transition-colors">
      <div className="flex items-start gap-4">
        {/* Round Image/Logo */}
        <div className="w-16 h-16 rounded-xl bg-[#A2D5C6]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {isLoadingMetadata ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#A2D5C6]/40" />
          ) : logoUrl ? (
            <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-[#A2D5C6]">
              {companyName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Investment Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg">
              {companyName}
            </h3>
          </div>
          <p className="text-sm text-white/50 mb-3 truncate">
            Round: {shortenAddress(investment.roundId)}
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Invested</p>
              <p className="font-semibold text-white">{formatUSDC(investment.usdcAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Tokens Received</p>
              <p className="font-semibold text-white">{formatTokenAmount(investment.tokensReceived)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">APY</p>
              <p className="font-semibold text-[#A2D5C6]">6%</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <a
          href={`https://sepolia.mantlescan.xyz/tx/${investment.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-[#A2D5C6]/20 transition-all"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      </div>

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Clock className="h-4 w-4" />
          <span>
            Invested on {new Date(Number(investment.timestamp) * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        <span className="text-xs bg-[#A2D5C6]/20 text-[#A2D5C6] px-2 py-1 rounded-full">
          {round?.state === 0 ? 'Active' : round?.state === 1 ? 'Completed' : 'Pending'}
        </span>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const [claimingRound, setClaimingRound] = useState<string | null>(null);
  const { openWithPortfolio } = useAI();

  // Fetch indexed investments for connected wallet
  const { data: investments, isLoading, error } = useInvestorInvestments(address);

  // Fetch all rounds for portfolio analysis context
  const { data: allRounds } = useRounds();

  // Get unique round addresses from investments
  const uniqueRoundAddresses = useMemo(() => {
    if (!investments) return [];
    const addresses = [...new Set(investments.map(inv => inv.roundId))];
    return addresses as `0x${string}`[];
  }, [investments]);

  // Get rounds that match user's investments
  const investedRounds = useMemo(() => {
    if (!allRounds || !investments) return [];
    return allRounds.filter(round =>
      investments.some(inv => inv.roundId.toLowerCase() === round.id.toLowerCase())
    );
  }, [allRounds, investments]);

  // Fetch real-time yield data from all rounds
  const {
    yieldByRound,
    isLoading: isLoadingYield,
    refetch: refetchYield
  } = useMultiRoundInvestorYield(uniqueRoundAddresses, address);

  // Fetch yield info from vault
  const {
    totalClaimableYield,
    totalAccruingYield,
    isLoading: isLoadingVaultInfo,
    refetch: refetchVaultInfo
  } = useMultiRoundYieldInfo(uniqueRoundAddresses, address);

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const totalInvested = investments?.reduce(
    (acc, inv) => acc + Number(formatUnits(BigInt(inv.usdcAmount), USDC_DECIMALS)),
    0
  ) || 0;

  // Format claimable yield (from contract)
  const formattedClaimableYield = useMemo(() => {
    const amount = Number(formatUnits(totalClaimableYield, USDC_DECIMALS));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [totalClaimableYield]);

  // Format accruing yield (estimated from vault growth)
  const formattedAccruingYield = useMemo(() => {
    const amount = Number(formatUnits(totalAccruingYield, USDC_DECIMALS));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [totalAccruingYield]);

  // Find round with claimable yield
  const roundWithYield = useMemo(() => {
    return yieldByRound.find(r => r && r.yieldBalance > BigInt(0));
  }, [yieldByRound]);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      const titleWords = titleRef.current?.querySelectorAll('.title-word') || [];

      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 20, opacity: 0 });
      gsap.set(statsRef.current, { y: 30, opacity: 0 });
      gsap.set(contentRef.current, { y: 40, opacity: 0 });

      tl.to(titleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });

      tl.to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
      }, '-=0.4');

      tl.to(statsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
      }, '-=0.3');

      tl.to(contentRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
      }, '-=0.2');
    });

    return () => ctx.revert();
  }, []);

  // Claim yield hook - we'll claim from rounds one at a time
  const { claimYield, isPending: isClaimPending, isSuccess: isClaimSuccess } = useClaimYield(
    claimingRound as `0x${string}` | undefined
  );

  // Handle claim success - refetch yield data
  useEffect(() => {
    if (isClaimSuccess) {
      setClaimingRound(null);
      refetchYield();
    }
  }, [isClaimSuccess, refetchYield]);

  const handleClaimYield = () => {
    if (!roundWithYield) return;
    setClaimingRound(roundWithYield.roundAddress);
    claimYield();
  };

  // Handle AI portfolio analysis
  const handleAnalyzePortfolio = () => {
    if (!investments || !address || investments.length === 0) return;

    const totalYieldNum = Number(formatUnits(totalClaimableYield, USDC_DECIMALS));

    openWithPortfolio({
      walletAddress: address,
      investments,
      rounds: investedRounds,
      totalInvested,
      totalYield: totalYieldNum,
    });
  };

  return (
    <Layout>
      <div className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 ref={titleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-4">
              {'Your Portfolio'.split(' ').map((word, i) => (
                <span key={i} className="inline-block title-word">{word}</span>
              ))}
            </h1>
            <p ref={subtitleRef} className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto">
              Track your investments and claim your guaranteed 6% APY yield.
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex justify-center mb-8">
            {!isConnected ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Wallet className="h-4 w-4" />
                Connect wallet to view your portfolio
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your investments...
              </div>
            ) : error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Failed to connect to indexer
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Invested */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-2">Total Invested</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalInvested)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Across {investments?.length || 0} rounds
              </p>
            </div>

            {/* APY Rate */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-2">APY Rate</p>
              <p className="text-2xl font-bold text-white">6%</p>
              <p className="text-xs text-white/40 mt-1">Guaranteed yield</p>
            </div>

            {/* Your Tokens */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-2">Your Tokens</p>
              <p className="text-2xl font-bold text-white">
                {investments?.reduce((acc, inv) => acc + Number(inv.tokensReceived), 0).toLocaleString() || 0}
              </p>
              <Link
                to="/marketplace"
                className="text-xs text-white/40 hover:text-[#CFFFE2] transition-colors mt-1 flex items-center gap-1"
              >
                Sell on Marketplace
              </Link>
            </div>

            {/* Pending Yield - with claim action */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/50 text-sm">Pending Yield</p>
                <button
                  onClick={() => { refetchYield(); refetchVaultInfo(); }}
                  disabled={isLoadingYield || isLoadingVaultInfo}
                  className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3 w-3 ${(isLoadingYield || isLoadingVaultInfo) ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-2xl font-bold text-[#A2D5C6]">
                {isLoadingYield ? '...' : formattedClaimableYield}
              </p>
              <p className="text-xs text-white/40 mt-1 mb-2">
                +{isLoadingVaultInfo ? '...' : formattedAccruingYield} accruing
              </p>
              <button
                onClick={handleClaimYield}
                disabled={isClaimPending || !isConnected || totalClaimableYield === BigInt(0)}
                className="w-full py-2 px-3 bg-[#A2D5C6] text-black text-sm font-semibold rounded-sm hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaimPending ? 'Claiming...' : totalClaimableYield > BigInt(0) ? 'Claim' : 'No yield'}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div ref={contentRef}>
            {/* Investment Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Your Investments</h2>
                <div className="flex items-center gap-3">
                  {investments && investments.length > 0 && (
                    <button
                      onClick={handleAnalyzePortfolio}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors text-sm"
                    >
                      <Bot className="h-4 w-4" />
                      Analyze Portfolio
                    </button>
                  )}
                  <Link
                    to="/browse"
                    className="text-sm text-[#A2D5C6] hover:text-[#CFFFE2] transition-colors flex items-center gap-1"
                  >
                    Browse More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-[#A2D5C6] mb-4" />
                  <p className="text-white/60">Loading your investments...</p>
                </div>
              )}

              {/* Content */}
              {!isLoading && (
                <>
                  {!isConnected ? (
                    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                      <Wallet className="h-12 w-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/50 mb-4">Connect your wallet to view investments.</p>
                    </div>
                  ) : !investments || investments.length === 0 ? (
                    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 bg-[#A2D5C6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Rocket className="h-8 w-8 text-[#A2D5C6]/40" />
                      </div>
                      <p className="text-white/50 mb-4">You haven't made any investments yet.</p>
                      <Link
                        to="/browse"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors"
                      >
                        Browse Startups
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    investments.map((investment) => (
                      <InvestmentCard key={investment.id} investment={investment} />
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AIChat />
    </Layout>
  );
}
