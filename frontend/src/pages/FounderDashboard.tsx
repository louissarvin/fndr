import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAccount } from 'wagmi';
import Layout from '@/components/layout/Layout';
import CreateRoundModal from '@/components/founder/CreateRoundModal';
import FounderRoundCard from '@/components/founder/FounderRoundCard';
import { useFounderRounds } from '@/hooks/usePonderData';
import { useUserRole, useIsVerifiedUser, useGetRoundByFounder } from '@/hooks/useContracts';
import { UserRole } from '@/lib/contracts';
import {
  Plus,
  Loader2,
  AlertCircle,
  Wallet,
  Building2,
  TrendingUp,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function FounderDashboard() {
  const { address, isConnected } = useAccount();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if user is a verified founder
  const { data: userRole, isLoading: isLoadingRole } = useUserRole(address);
  const { data: isVerified, isLoading: isLoadingVerified } = useIsVerifiedUser(address);
  const isFounder = Number(userRole) === UserRole.Founder;

  // Get founder's round from contract
  const { data: roundAddress, isLoading: isLoadingRound } = useGetRoundByFounder(address);

  // Get founder's rounds from Ponder (indexed data)
  const {
    data: indexedRounds,
    isLoading: isLoadingIndexed,
    error: indexedError
  } = useFounderRounds(address?.toLowerCase());

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

  const hasExistingRound = roundAddress && roundAddress !== '0x0000000000000000000000000000000000000000';
  const isLoading = isLoadingRole || isLoadingVerified || isLoadingRound || isLoadingIndexed;

  // Calculate stats from indexed rounds
  const stats = {
    totalRounds: indexedRounds?.length || 0,
    totalRaised: indexedRounds?.reduce((acc, r) => acc + BigInt(r.totalRaised), BigInt(0)) || BigInt(0),
    totalInvestors: indexedRounds?.reduce((acc, r) => acc + r.investorCount, 0) || 0,
    activeRounds: indexedRounds?.filter(r => r.state === 0).length || 0,
  };

  return (
    <Layout>
      <div className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 ref={titleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-4">
              {'Founder Dashboard'.split(' ').map((word, i) => (
                <span key={i} className="inline-block title-word">{word}</span>
              ))}
            </h1>
            <p ref={subtitleRef} className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto">
              Manage your fundraising rounds and track investor activity.
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex justify-center mb-8">
            {!isConnected ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Wallet className="h-4 w-4" />
                Connect wallet to access dashboard
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading dashboard...
              </div>
            ) : indexedError ? (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Failed to connect to indexer
              </div>
            ) : null}
          </div>

          {/* Stats Cards - Always show structure */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Rounds</p>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalRounds}</p>
            </div>

            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Raised</p>
              </div>
              <p className="text-2xl font-bold text-white">
                ${(Number(stats.totalRaised) / 1e6).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#A2D5C6]" />
                <p className="text-white/50 text-sm">Total Investors</p>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalInvestors}</p>
            </div>

            <div className="bg-[#A2D5C6]/20 backdrop-blur-md rounded-2xl p-5 border border-[#A2D5C6]/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <p className="text-white/50 text-sm">Active Rounds</p>
              </div>
              <p className="text-2xl font-bold text-[#A2D5C6]">{stats.activeRounds}</p>
            </div>
          </div>

          {/* Main Content */}
          <div ref={contentRef}>
            {/* Not Connected State */}
            {!isConnected && (
              <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                <Wallet className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-white/60 max-w-md mx-auto">
                  Please connect your wallet to access the founder dashboard and manage your fundraising rounds.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isConnected && isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-[#A2D5C6] mb-4" />
                <p className="text-white/60">Loading your rounds...</p>
              </div>
            )}

            {/* Not Verified Founder State */}
            {isConnected && !isLoading && (!isFounder || !isVerified) && (
              <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                <AlertCircle className="h-16 w-16 text-yellow-500/60 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Founder Verification Required
                </h3>
                <p className="text-white/60 max-w-md mx-auto mb-6">
                  {!isVerified
                    ? 'Please verify your identity with ZKPassport to access founder features.'
                    : 'Please register as a founder to create fundraising rounds.'}
                </p>
                <p className="text-sm text-white/40">
                  Go to the navigation menu and click "Identity" to complete verification.
                </p>
              </div>
            )}

            {/* Verified Founder Dashboard */}
            {isConnected && !isLoading && isFounder && isVerified && (
              <>
                {/* Action Bar */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Your Rounds</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={hasExistingRound}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                      hasExistingRound
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-[#A2D5C6] text-black hover:bg-[#CFFFE2]'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    Create Round
                  </button>
                </div>

                {hasExistingRound && (
                  <p className="text-sm text-white/40 mb-6 -mt-2">
                    You already have an active round. Complete or cancel it before creating a new one.
                  </p>
                )}

                {/* Rounds Grid */}
                {indexedError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400">Failed to load rounds from indexer</p>
                  </div>
                ) : indexedRounds && indexedRounds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {indexedRounds.map((round) => (
                      <FounderRoundCard key={round.id} round={round} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-[#A2D5C6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-10 w-10 text-[#A2D5C6]/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Rounds Yet
                    </h3>
                    <p className="text-white/60 max-w-md mx-auto mb-6">
                      You haven't created any fundraising rounds yet. Create your first round to start raising capital.
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      Create Your First Round
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Round Modal */}
      <CreateRoundModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Layout>
  );
}
