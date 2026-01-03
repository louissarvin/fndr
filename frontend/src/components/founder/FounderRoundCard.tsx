import { useState } from 'react';
import { formatUnits } from 'viem';
import { useRoundInfo, useRoundConfig, useRoundData, useFounderWithdraw, useCompleteRound, USDC_DECIMALS, SECONDS_PER_MONTH } from '@/hooks/useContracts';
import type { Round } from '@/hooks/usePonderData';
import { useRoundMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import {
  Users,
  TrendingUp,
  DollarSign,
  ArrowDownToLine,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Rocket,
  Clock,
} from 'lucide-react';

interface FounderRoundCardProps {
  round: Round;
}

const MAX_WITHDRAWAL_RATE = 200; // 2% in basis points
const PLATFORM_SUCCESS_FEE = 50; // 0.5% platform fee in basis points
const BASIS_POINTS = 10000;

function formatUSDCValue(value: bigint): string {
  const num = Number(formatUnits(value, USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatUSDC(value: string): string {
  const num = Number(formatUnits(BigInt(value), USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateProgress(raised: string, target: string): number {
  const raisedNum = Number(raised);
  const targetNum = Number(target);
  if (targetNum === 0) return 0;
  return Math.min(Math.round((raisedNum / targetNum) * 100), 100);
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '';

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

function getRoundStateLabel(state: number, progress: number): { label: string; color: string } {
  // If 100% funded but state is still 0, show "Ready to Complete"
  if (state === 0 && progress >= 100) {
    return { label: 'Ready to Complete', color: 'bg-[#A2D5C6] text-black' };
  }

  switch (state) {
    case 0:
      return { label: 'Fundraising', color: 'bg-[#A2D5C6] text-black' };
    case 1:
      return { label: 'Completed', color: 'bg-[#A2D5C6] text-black' };
    case 2:
      return { label: 'Fully Deployed', color: 'bg-[#A2D5C6] text-black' };
    default:
      return { label: 'Unknown', color: 'bg-[#A2D5C6] text-black' };
  }
}

export default function FounderRoundCard({ round }: FounderRoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch IPFS metadata
  const { data: metadata, isLoading: isLoadingMetadata } = useRoundMetadata(round.metadataURI);

  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const companyName = metadata?.name || round.companyName || `Round ${round.id.slice(0, 8)}...`;

  // Get real-time round info from contract
  const { data: roundInfo } = useRoundInfo(round.id as `0x${string}`);
  const { data: roundConfig } = useRoundConfig(round.id as `0x${string}`);
  const { data: roundData } = useRoundData(round.id as `0x${string}`);

  // Withdraw hook
  const {
    founderWithdraw,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
    isSuccess: isWithdrawSuccess,
    error: withdrawError,
  } = useFounderWithdraw(round.id as `0x${string}`);

  // Complete round hook
  const {
    completeRound,
    isPending: isCompletePending,
    isConfirming: isCompleteConfirming,
    isSuccess: isCompleteSuccess,
    error: completeError,
  } = useCompleteRound(round.id as `0x${string}`);

  const progress = calculateProgress(round.totalRaised, round.targetRaise);
  const stateInfo = getRoundStateLabel(round.state, progress);

  // Use real-time contract data if available, fallback to indexed data
  // roundData returns: [state, founder, equityToken, totalRaised, totalWithdrawn, lastWithdrawal, tokensIssued, completionTime]
  const totalRaised = roundData ? BigInt(roundData[3]) : BigInt(round.totalRaised);
  const totalWithdrawn = roundData ? BigInt(roundData[4]) : BigInt(round.totalWithdrawn);

  // Calculate vault balance accounting for platform fee (0.5%)
  // Net raised = totalRaised * (1 - 0.5%) = totalRaised * 9950 / 10000
  const netRaised = (totalRaised * BigInt(BASIS_POINTS - PLATFORM_SUCCESS_FEE)) / BigInt(BASIS_POINTS);
  const vaultBalance = netRaised - totalWithdrawn;

  // Calculate 2% max monthly withdrawal based on net vault balance
  const maxMonthlyWithdrawal = (vaultBalance * BigInt(MAX_WITHDRAWAL_RATE)) / BigInt(BASIS_POINTS);

  // Get lastWithdrawal (index 5) and completionTime (index 7) from contract data
  const lastWithdrawalTime = roundData ? Number(roundData[5]) : 0;
  const completionTime = roundData ? Number(roundData[7]) : 0;

  // Use lastWithdrawal if a withdrawal was made, otherwise use completionTime
  // This ensures the founder waits the cooldown period even for the first withdrawal
  const cooldownStartTime = lastWithdrawalTime > 0 ? lastWithdrawalTime : completionTime;

  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceCooldownStart = currentTime - cooldownStartTime;
  const timeUntilNextWithdrawal = SECONDS_PER_MONTH - timeSinceCooldownStart;
  // Can withdraw if cooldown passed. If data not loaded yet (cooldownStartTime === 0 but roundData exists), don't allow
  const canWithdrawNow = roundData ? timeUntilNextWithdrawal <= 0 : false;

  // Round is completed and can withdraw (also check time restriction)
  const canWithdraw = round.state === 1 && maxMonthlyWithdrawal > BigInt(0) && canWithdrawNow;

  // Round is completed but needs to wait for cooldown
  const isWithdrawalLocked = round.state === 1 && maxMonthlyWithdrawal > BigInt(0) && !canWithdrawNow;

  // Round needs to be completed first (100% funded but state is still 0)
  const needsCompletion = round.state === 0 && progress >= 100;

  const handleWithdrawMax = () => {
    if (maxMonthlyWithdrawal <= BigInt(0)) return;
    founderWithdraw(maxMonthlyWithdrawal);
  };

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#A2D5C6]/20 flex items-center justify-center overflow-hidden">
              {isLoadingMetadata ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#A2D5C6]/50" />
              ) : logoUrl ? (
                <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-[#A2D5C6]">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {companyName}
              </h3>
              <p className="text-sm text-white/60">
                Created {new Date(Number(round.createdAt) * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${stateInfo.color}`}>
            {stateInfo.label}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-white">
              {formatUSDC(round.totalRaised)}
            </span>
            <span className="text-white/60">
              of {formatUSDC(round.targetRaise)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A2D5C6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-white/40 text-right">
            {progress}% funded
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <span className="text-xs">Investors</span>
          </div>
          <p className="text-lg font-bold text-white">{round.investorCount}</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <span className="text-xs">APY</span>
          </div>
          <p className="text-lg font-bold text-[#A2D5C6]">6%</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <span className="text-xs">Withdrawn</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${(Number(totalWithdrawn) / 1e6).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-center gap-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      >
        <span className="text-sm">
          {isExpanded ? 'Hide Actions' : 'Manage Round'}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className="p-5 bg-black/20 border-t border-white/10 space-y-4">
          {/* Info: Round needs completion */}
          {needsCompletion && !isCompleteSuccess && (
            <div className="bg-[#A2D5C6]/10 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#A2D5C6]">Round Ready to Complete</p>
                  <p className="text-xs text-white/60 mt-1">
                    Your round is 100% funded! Click the button below to complete the round on-chain.
                    Once completed, you can withdraw up to 2% of funds per month.
                  </p>
                </div>
              </div>
              <button
                onClick={completeRound}
                disabled={isCompletePending || isCompleteConfirming}
                className="w-full flex items-center justify-center gap-2 bg-[#A2D5C6] text-black py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50"
              >
                {isCompletePending || isCompleteConfirming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isCompletePending ? 'Confirm in Wallet...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Complete Round
                  </>
                )}
              </button>
              {completeError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{completeError.message?.slice(0, 80) || 'Transaction failed'}</span>
                </div>
              )}
            </div>
          )}

          {/* Success state: waiting for indexer to update */}
          {isCompleteSuccess && needsCompletion && (
            <div className="bg-[#A2D5C6]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-[#A2D5C6]" />
                <div>
                  <p className="text-sm font-semibold text-[#A2D5C6]">Round Completed!</p>
                  <p className="text-xs text-white/60 mt-1">
                    Transaction confirmed. Waiting for data to sync...
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/60 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Withdrawal options will appear shortly</span>
              </div>
            </div>
          )}

          {/* Withdrawal Info */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Available Balance</span>
              <span className="text-lg font-bold text-white">
                {formatUSDCValue(vaultBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Max Withdrawal (2%/month)</span>
              <span className="text-lg font-bold text-[#A2D5C6]">
                {formatUSDCValue(maxMonthlyWithdrawal)}
              </span>
            </div>

            {round.state === 0 && !needsCompletion && (
              <p className="text-xs text-white/40 pt-2 border-t border-white/10">
                Withdrawals are only available after the round is completed.
              </p>
            )}
            {round.state === 1 && (
              <p className="text-xs text-white/40 pt-2 border-t border-white/10">
                Available balance = Total raised minus 0.5% platform fee. You can withdraw up to 2% per month.
              </p>
            )}
          </div>

          {/* Withdraw Button - Only show when round is COMPLETED and cooldown passed */}
          {canWithdraw && (
            <div className="space-y-3">
              <button
                onClick={handleWithdrawMax}
                disabled={isWithdrawPending || isWithdrawConfirming}
                className="w-full flex items-center justify-center gap-2 bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50"
              >
                {isWithdrawPending || isWithdrawConfirming ? (
                  <>
                    {isWithdrawPending ? 'Confirm in Wallet...' : 'Processing...'}
                  </>
                ) : isWithdrawSuccess ? (
                  <>
                    Withdrawal Successful!
                  </>
                ) : (
                  <>
                    Withdraw {formatUSDCValue(maxMonthlyWithdrawal)} (2%)
                  </>
                )}
              </button>

              {withdrawError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{withdrawError.message?.slice(0, 80) || 'Transaction failed'}</span>
                </div>
              )}
            </div>
          )}

          {/* Withdrawal locked - show countdown */}
          {isWithdrawalLocked && (
            <div className="space-y-3">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-white/10 text-white/50 py-4 rounded-xl font-semibold cursor-not-allowed"
              >
                Withdrawal Locked
              </button>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-sm text-white/60">
                  Next withdrawal available in{' '}
                  <span className="font-semibold text-[#A2D5C6]">
                    {formatTimeRemaining(timeUntilNextWithdrawal)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Show message if round is still fundraising */}
          {round.state === 0 && !needsCompletion && (
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-sm text-white/50">
                Withdrawals will be available once the round is completed.
              </p>
            </div>
          )}

          {/* View on Explorer */}
          <a
            href={`https://sepolia-blockscout.lisk.com/address/${round.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 border border-white/20 text-white/60 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </a>

          {/* Round Details */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <h4 className="text-sm font-semibold text-white/80">Round Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Contract</span>
                <span className="text-white/60 font-mono">
                  {round.id.slice(0, 6)}...{round.id.slice(-4)}
                </span>
              </div>
              {round.equityPercentage && (
                <div className="flex justify-between">
                  <span className="text-white/40">Equity</span>
                  <span className="text-white/60">
                    {Number(round.equityPercentage) / 100}%
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">Tokens Issued</span>
                <span className="text-white/60">
                  {Number(round.tokensIssued).toLocaleString()}
                </span>
              </div>
              {round.equityToken && (
                <div className="flex justify-between">
                  <span className="text-white/40">Token</span>
                  <span className="text-white/60 font-mono">
                    {round.equityToken.slice(0, 6)}...{round.equityToken.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
