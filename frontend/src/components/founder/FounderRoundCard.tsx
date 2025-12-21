import { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useRoundInfo, useRoundConfig, useFounderWithdraw, formatUSDCDisplay, USDC_DECIMALS } from '@/hooks/useContracts';
import type { Round } from '@/hooks/usePonderData';
import {
  Users,
  Clock,
  TrendingUp,
  Wallet,
  DollarSign,
  ArrowDownToLine,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FounderRoundCardProps {
  round: Round;
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

function getRoundStateLabel(state: number): { label: string; color: string } {
  switch (state) {
    case 0:
      return { label: 'Fundraising', color: 'bg-[#A2D5C6] text-black' };
    case 1:
      return { label: 'Completed', color: 'bg-blue-500 text-white' };
    case 2:
      return { label: 'Cancelled', color: 'bg-red-500 text-white' };
    default:
      return { label: 'Unknown', color: 'bg-gray-500 text-white' };
  }
}

export default function FounderRoundCard({ round }: FounderRoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  // Get real-time round info from contract
  const { data: roundInfo } = useRoundInfo(round.id as `0x${string}`);
  const { data: roundConfig } = useRoundConfig(round.id as `0x${string}`);

  // Withdraw hook
  const {
    founderWithdraw,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
    isSuccess: isWithdrawSuccess,
    error: withdrawError,
  } = useFounderWithdraw(round.id as `0x${string}`);

  const progress = calculateProgress(round.totalRaised, round.targetRaise);
  const stateInfo = getRoundStateLabel(round.state);

  // Calculate available to withdraw (total raised - total withdrawn)
  const availableToWithdraw = BigInt(round.totalRaised) - BigInt(round.totalWithdrawn);

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    const amountWei = parseUnits(withdrawAmount, USDC_DECIMALS);
    founderWithdraw(amountWei);
  };

  const handleMaxWithdraw = () => {
    const maxAmount = Number(formatUnits(availableToWithdraw, USDC_DECIMALS));
    setWithdrawAmount(maxAmount.toString());
  };

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[#A2D5C6]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {round.companyName || `Round ${round.id.slice(0, 8)}...`}
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
            <Users className="h-4 w-4" />
            <span className="text-xs">Investors</span>
          </div>
          <p className="text-lg font-bold text-white">{round.investorCount}</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">APY</span>
          </div>
          <p className="text-lg font-bold text-[#A2D5C6]">6%</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-white/60 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Withdrawn</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${(Number(round.totalWithdrawn) / 1e6).toLocaleString()}
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
          {/* Available to Withdraw */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Available to Withdraw</span>
              <span className="text-lg font-bold text-[#A2D5C6]">
                {formatUSDC(availableToWithdraw.toString())}
              </span>
            </div>
            {round.state === 0 && (
              <p className="text-xs text-white/40">
                Withdrawals are limited to 25% per month while fundraising is active.
              </p>
            )}
          </div>

          {/* Withdraw Form */}
          {round.state === 0 && availableToWithdraw > BigInt(0) && (
            <div className="space-y-3">
              {!showWithdrawForm ? (
                <button
                  onClick={() => setShowWithdrawForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#A2D5C6]/20 text-[#A2D5C6] py-3 rounded-xl font-semibold hover:bg-[#A2D5C6]/30 transition-colors"
                >
                  <ArrowDownToLine className="h-5 w-5" />
                  Withdraw Funds
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount in USDC"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    />
                    <button
                      onClick={handleMaxWithdraw}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#A2D5C6] hover:text-[#CFFFE2]"
                    >
                      MAX
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowWithdrawForm(false);
                        setWithdrawAmount('');
                      }}
                      className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || isWithdrawPending || isWithdrawConfirming}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#A2D5C6] text-black py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50"
                    >
                      {isWithdrawPending || isWithdrawConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isWithdrawPending ? 'Confirm...' : 'Withdrawing...'}
                        </>
                      ) : isWithdrawSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Success!
                        </>
                      ) : (
                        'Withdraw'
                      )}
                    </button>
                  </div>

                  {withdrawError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {withdrawError.message?.slice(0, 60) || 'Transaction failed'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* View on Explorer */}
          <a
            href={`https://sepolia.mantlescan.xyz/address/${round.id}`}
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
