import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { MOCK_PORTFOLIO, MOCK_CAMPAIGNS, formatCurrency } from '@/lib/web3-config';
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  DollarSign,
  Clock,
  ChevronRight,
  Coins,
  BadgeCheck
} from 'lucide-react';

const PortfolioOrb = lazy(() => import('@/components/3d/PortfolioOrb'));

// Calculate totals
const totalInvested = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.invested, 0);
const totalValue = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.currentValue, 0);
const totalYield = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.yieldEarned, 0);
const returnPercent = ((totalValue - totalInvested) / totalInvested) * 100;

// Helper to get campaign details
const getCampaignDetails = (campaignId: string) => {
  return MOCK_CAMPAIGNS.find(c => c.id === campaignId);
};

export default function Portfolio() {
  const [claimingAll, setClaimingAll] = useState(false);

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Invested */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Invested</p>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalInvested)}</p>
              <p className="text-xs text-white/40 mt-1">Across {MOCK_PORTFOLIO.length} startups</p>
            </div>

            {/* Portfolio Value */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Portfolio Value</p>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-[#A2D5C6] mt-1">+{returnPercent.toFixed(1)}% return</p>
            </div>

            {/* Total Yield */}
            <div className="bg-[#A2D5C6]/20 backdrop-blur-md rounded-2xl p-5 border border-[#A2D5C6]/30">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Yield Earned</p>
              </div>
              <p className="text-2xl font-bold text-[#A2D5C6]">{formatCurrency(totalYield)}</p>
              <p className="text-xs text-white/40 mt-1">6% APY guaranteed</p>
            </div>

            {/* Claimable */}
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Claimable Now</p>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalYield * 0.3)}</p>
              <button
                onClick={handleClaimAll}
                disabled={claimingAll}
                className="mt-2 w-full py-2 bg-[#A2D5C6] text-black text-sm font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {claimingAll ? 'Claiming...' : 'Claim'}
              </button>
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

              {MOCK_PORTFOLIO.map((item) => {
                const campaign = getCampaignDetails(item.campaignId);
                const itemReturn = ((item.currentValue - item.invested) / item.invested) * 100;

                return (
                  <div
                    key={item.id}
                    className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5 hover:bg-[#A2D5C6]/15 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Campaign Image */}
                      <img
                        src={campaign?.image || ''}
                        alt={item.campaignName}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />

                      {/* Campaign Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">{item.campaignName}</h3>
                          {campaign?.founder.verified && (
                            <BadgeCheck className="h-4 w-4 text-[#A2D5C6]" />
                          )}
                        </div>
                        <p className="text-sm text-white/50 mb-3">{campaign?.tagline}</p>

                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Invested</p>
                            <p className="font-semibold text-white">{formatCurrency(item.invested)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Current Value</p>
                            <p className="font-semibold text-white">{formatCurrency(item.currentValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Yield Earned</p>
                            <p className="font-semibold text-[#A2D5C6]">{formatCurrency(item.yieldEarned)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-0.5">Return</p>
                            <p className="font-semibold text-[#A2D5C6]">+{itemReturn.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        to={`/campaign/${item.campaignId}`}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-[#A2D5C6]/20 transition-all"
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>

                    {/* Purchase Date */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <Clock className="h-4 w-4" />
                        <span>Invested on {new Date(item.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="text-xs bg-[#A2D5C6]/20 text-[#A2D5C6] px-2 py-1 rounded-full capitalize">
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {MOCK_PORTFOLIO.length === 0 && (
                <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                  <p className="text-white/50 mb-4">You haven't made any investments yet.</p>
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors"
                  >
                    Browse Startups
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
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
                    disabled={claimingAll}
                    className="w-full py-3 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Claim All Yield
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
