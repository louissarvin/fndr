import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useRound, type Round } from '@/hooks/usePonderData';
import {
  useInvest,
  useUSDCBalance,
  useUSDCApprove,
  useUSDCAllowance,
  useRoundConfig,
  formatUSDCDisplay,
  USDC_DECIMALS,
} from '@/hooks/useContracts';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Coins,
  TrendingUp,
  ArrowRight,
  Info,
} from 'lucide-react';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: string;
}

export default function InvestModal({ isOpen, onClose, roundId }: InvestModalProps) {
  const { address } = useAccount();

  // Form state
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'approve' | 'invest' | 'success'>('form');

  // Get round details
  const { data: round, isLoading: isLoadingRound } = useRound(roundId);
  const { data: roundConfig } = useRoundConfig(roundId as `0x${string}`);

  // Contract hooks
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: allowance } = useUSDCAllowance(address, roundId as `0x${string}`);

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useUSDCApprove();

  const {
    invest,
    isPending: isInvestPending,
    isConfirming: isInvestConfirming,
    isSuccess: isInvestSuccess,
    error: investError,
  } = useInvest(roundId as `0x${string}`);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setAmount('');
    }
  }, [isOpen]);

  // Move to invest step after approval
  useEffect(() => {
    if (isApproveSuccess && step === 'approve') {
      setStep('invest');
      handleInvest();
    }
  }, [isApproveSuccess, step]);

  // Move to success step after investment
  useEffect(() => {
    if (isInvestSuccess && step === 'invest') {
      setStep('success');
    }
  }, [isInvestSuccess, step]);

  const amountWei = amount ? parseUnits(amount, USDC_DECIMALS) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= amountWei;
  const hasEnoughBalance = usdcBalance && usdcBalance >= amountWei;

  // Calculate tokens to receive based on share price
  const sharePrice = roundConfig?.[2] || BigInt(1e6); // Default to 1 USDC
  const tokensToReceive = amountWei > 0 && sharePrice > 0
    ? (amountWei * BigInt(1e18)) / sharePrice
    : BigInt(0);

  // Calculate remaining capacity
  const remainingCapacity = round
    ? BigInt(round.targetRaise) - BigInt(round.totalRaised)
    : BigInt(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amountWei <= 0) {
      return;
    }

    if (hasEnoughAllowance) {
      setStep('invest');
      handleInvest();
    } else {
      setStep('approve');
      handleApprove();
    }
  };

  const handleApprove = () => {
    approve(roundId as `0x${string}`, amountWei);
  };

  const handleInvest = () => {
    invest(amountWei);
  };

  const handleMaxAmount = () => {
    if (!usdcBalance) return;
    const maxAmount = remainingCapacity < usdcBalance ? remainingCapacity : usdcBalance;
    setAmount(formatUnits(maxAmount, USDC_DECIMALS));
  };

  if (!isOpen) return null;

  const isProcessing = isApprovePending || isApproveConfirming || isInvestPending || isInvestConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
              <Coins className="h-5 w-5 text-[#A2D5C6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invest in Round</h2>
              <p className="text-sm text-white/60">
                {round?.companyName || `Round ${roundId.slice(0, 8)}...`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoadingRound ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#A2D5C6]" />
            </div>
          ) : step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Round Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Target Raise</span>
                  <span className="text-white font-medium">
                    {round && formatUSDCDisplay(BigInt(round.targetRaise))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Already Raised</span>
                  <span className="text-white font-medium">
                    {round && formatUSDCDisplay(BigInt(round.totalRaised))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Remaining Capacity</span>
                  <span className="text-[#A2D5C6] font-medium">
                    {formatUSDCDisplay(remainingCapacity)}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A2D5C6] rounded-full"
                    style={{
                      width: `${round ? Math.min((Number(round.totalRaised) / Number(round.targetRaise)) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Investment Amount (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-20 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                    required
                    min="1"
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#A2D5C6] hover:text-[#CFFFE2] bg-[#A2D5C6]/10 px-2 py-1 rounded"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Balance: {usdcBalance ? formatUSDCDisplay(usdcBalance) : '$0.00'}
                </p>
              </div>

              {/* Tokens to Receive */}
              {amount && tokensToReceive > 0 && (
                <div className="bg-[#A2D5C6]/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-[#A2D5C6]" />
                      <span className="text-sm text-white/80">You will receive</span>
                    </div>
                    <span className="text-lg font-bold text-[#A2D5C6]">
                      {Number(formatUnits(tokensToReceive, 18)).toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              )}

              {/* APY Info */}
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <TrendingUp className="h-5 w-5 text-[#A2D5C6] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Earn 6% APY</p>
                  <p className="text-xs text-white/60">
                    Your investment earns yield while funds are in the shared vault. You can claim
                    yields anytime from your investor dashboard.
                  </p>
                </div>
              </div>

              {/* Validation Messages */}
              {!hasEnoughBalance && amount && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Insufficient USDC balance
                </div>
              )}
              {amountWei > remainingCapacity && amount && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Info className="h-4 w-4" />
                  Amount exceeds remaining capacity
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!amount || !hasEnoughBalance || amountWei > remainingCapacity || amountWei <= 0}
                className="w-full bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {hasEnoughAllowance ? 'Invest Now' : 'Approve & Invest'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          ) : step === 'approve' ? (
            <div className="text-center py-8">
              {isApprovePending || isApproveConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isApprovePending ? 'Confirm in Wallet' : 'Approving USDC...'}
                  </h3>
                  <p className="text-white/60">
                    {isApprovePending
                      ? 'Please confirm the approval transaction in your wallet'
                      : 'Waiting for transaction confirmation...'}
                  </p>
                </>
              ) : approveError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Approval Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {approveError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={handleApprove}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : null}
            </div>
          ) : step === 'invest' ? (
            <div className="text-center py-8">
              {isInvestPending || isInvestConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isInvestPending ? 'Confirm in Wallet' : 'Processing Investment...'}
                  </h3>
                  <p className="text-white/60">
                    {isInvestPending
                      ? 'Please confirm the investment transaction in your wallet'
                      : 'Your investment is being processed...'}
                  </p>
                </>
              ) : investError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Investment Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {investError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={handleInvest}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : null}
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-[#A2D5C6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Investment Successful!</h3>
              <p className="text-white/60 mb-2">
                You have successfully invested {formatUSDCDisplay(amountWei)} in this round.
              </p>
              <p className="text-sm text-[#A2D5C6] mb-6">
                You received {Number(formatUnits(tokensToReceive, 18)).toLocaleString()} equity tokens
              </p>
              <button
                onClick={onClose}
                className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
              >
                Done
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
