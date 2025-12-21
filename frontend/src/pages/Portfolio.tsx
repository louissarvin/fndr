import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import Layout from '@/components/layout/Layout';
import { useInvestorInvestments, useRound, usePlatformStats, type Investment } from '@/hooks/usePonderData';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  DollarSign,
  Clock,
  ChevronRight,
  Coins,
  Wifi,
  WifiOff,
  Loader2,
  ExternalLink,
  Rocket
} from 'lucide-react';

const PortfolioOrb = lazy(() => import('@/components/3d/PortfolioOrb'));

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
  const num = Number(formatUnits(BigInt(value), 18));
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
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

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5 hover:bg-[#A2D5C6]/15 transition-colors">
      <div className="flex items-start gap-4">
        {/* Round Icon */}
        <div className="w-16 h-16 rounded-xl bg-[#A2D5C6]/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="h-8 w-8 text-[#A2D5C6]" />
        </div>

        {/* Investment Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg">
              {round?.companyName || `Round ${shortenAddress(investment.roundId)}`}
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
  const [claimingAll, setClaimingAll] = useState(false);

  // Fetch indexed investments for connected wallet
  const { data: investments, isLoading, error } = useInvestorInvestments(address);
  const { data: platformStats } = usePlatformStats();

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

  const handleClaimAll = () => {
    setClaimingAll(true);
    // TODO: Implement real yield claiming
    setTimeout(() => setClaimingAll(false), 2000);
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
            ) : error ? (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Failed to connect to indexer
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#A2D5C6] text-sm">
                <Wifi className="h-4 w-4" />
                Connected as {shortenAddress(address || '')}
                {investments && investments.length > 0 && (
                  <span className="bg-[#A2D5C6]/20 px-2 py-0.5 rounded-full text-xs">
                    {investments.length} investments
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Invested</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalInvested)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Across {investments?.length || 0} rounds
              </p>
            </div>

            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Platform Rounds</p>
              </div>
              <p className="text-2xl font-bold text-white">{platformStats?.totalRounds || 0}</p>
              <p className="text-xs text-white/40 mt-1">Active rounds</p>
            </div>

            <div className="bg-[#A2D5C6]/20 backdrop-blur-md rounded-2xl p-5 border border-[#A2D5C6]/30">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Platform Raised</p>
              </div>
              <p className="text-2xl font-bold text-[#A2D5C6]">
                {platformStats?.totalRaised ? formatUSDC(platformStats.totalRaised) : '$0'}
              </p>
              <p className="text-xs text-white/40 mt-1">All time</p>
            </div>

            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">APY Rate</p>
              </div>
              <p className="text-2xl font-bold text-white">6%</p>
              <p className="text-xs text-white/40 mt-1">Guaranteed yield</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div ref={contentRef} className="grid lg:grid-cols-3 gap-6">
            {/* Investment Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Your Investments</h2>
                <Link
                  to="/browse"
                  className="text-sm text-[#A2D5C6] hover:text-[#CFFFE2] transition-colors flex items-center gap-1"
                >
                  Browse More <ChevronRight className="h-4 w-4" />
                </Link>
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

            {/* Portfolio Visualization */}
            <div className="space-y-4">
              <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
                <h2 className="text-xl font-bold text-white mb-4">Portfolio Breakdown</h2>
                <Suspense
                  fallback={
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-[#A2D5C6]/30 animate-pulse" />
                    </div>
                  }
                >
                  <PortfolioOrb />
                </Suspense>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleClaimAll}
                    disabled={claimingAll || !isConnected || !investments?.length}
                    className="w-full py-3 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    {claimingAll ? 'Claiming...' : 'Claim All Yield'}
                  </button>
                  <Link
                    to="/marketplace"
                    className="block w-full py-3 bg-transparent text-[#A2D5C6] font-semibold rounded-xl border border-[#A2D5C6] hover:bg-[#A2D5C6]/10 hover:border-[#CFFFE2] hover:text-[#CFFFE2] transition-all text-center"
                  >
                    Sell on Marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
