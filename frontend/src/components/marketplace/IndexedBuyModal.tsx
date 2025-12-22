import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { type SellOrder, useRound } from '@/hooks/usePonderData';
import { useRoundMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import {
  useBuyTokens,
  useUSDCBalance,
  useUSDCApprove,
  useUSDCAllowance,
  formatUSDCDisplay,
  USDC_DECIMALS,
} from '@/hooks/useContracts';
import { CONTRACTS } from '@/lib/contracts';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  ArrowRight,
} from 'lucide-react';

interface IndexedBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SellOrder | null;
}

function formatTokenAmount(value: string): string {
  // Token amounts are stored as whole numbers (not scaled to 18 decimals)
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}

function formatUSDC(value: string | bigint): string {
  const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
  const num = Number(formatUnits(bigIntValue, USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

export default function IndexedBuyModal({ isOpen, onClose, order }: IndexedBuyModalProps) {
  const { address } = useAccount();

  // Form state
  const [buyAmount, setBuyAmount] = useState('');
  const [step, setStep] = useState<'form' | 'approve' | 'buy' | 'success'>('form');

  // Fetch round and IPFS metadata for the token
  const { data: round } = useRound(order?.tokenContract);
  const { data: metadata, isLoading: isLoadingMetadata } = useRoundMetadata(round?.metadataURI);

  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const companyName = metadata?.name || round?.companyName || (order ? `Round ${order.tokenContract.slice(0, 8)}...` : 'Unknown');

  // Contract hooks
  const { data: usdcBalance } = useUSDCBalance(address);
  const { data: allowance } = useUSDCAllowance(
    address,
    CONTRACTS.StartupSecondaryMarket as `0x${string}`
  );

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useUSDCApprove();

  const {
    buyTokens,
    isPending: isBuyPending,
    isConfirming: isBuyConfirming,
    isSuccess: isBuySuccess,
    error: buyError,
  } = useBuyTokens();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setBuyAmount('');
    }
  }, [isOpen]);

  // Move to buy step after approval
  useEffect(() => {
    if (isApproveSuccess && step === 'approve') {
      setStep('buy');
      handleBuy();
    }
  }, [isApproveSuccess, step]);

  // Move to success step after purchase
  useEffect(() => {
    if (isBuySuccess && step === 'buy') {
      setStep('success');
    }
  }, [isBuySuccess, step]);

  if (!order) return null;

  // Calculate values
  // Note: Token amounts are whole numbers (not scaled to 18 decimals)
  const amount = buyAmount ? BigInt(Math.floor(Number(buyAmount))) : BigInt(0);
  const maxAmount = BigInt(order.amount);
  const pricePerToken = BigInt(order.pricePerToken);
  const totalCost = amount * pricePerToken; // amount is whole number, price is USDC with 6 decimals
  const platformFee = (totalCost * BigInt(25)) / BigInt(10000); // 0.25%
  const totalWithFee = totalCost + platformFee;

  const hasEnoughAllowance = allowance && allowance >= totalWithFee;
  const hasEnoughBalance = usdcBalance && usdcBalance >= totalWithFee;
  const isValidAmount = amount > 0 && amount <= maxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidAmount || !hasEnoughBalance) return;

    if (hasEnoughAllowance) {
      setStep('buy');
      handleBuy();
    } else {
      setStep('approve');
      handleApprove();
    }
  };

  const handleApprove = () => {
    approve(CONTRACTS.StartupSecondaryMarket as `0x${string}`, totalWithFee);
  };

  const handleBuy = () => {
    buyTokens(BigInt(order.orderId), amount);
  };

  const handleMaxAmount = () => {
    setBuyAmount(maxAmount.toString());
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (maxAmount * BigInt(percentage)) / BigInt(100);
    setBuyAmount(quickAmount.toString());
  };

  if (!isOpen) return null;

  const isProcessing = isApprovePending || isApproveConfirming || isBuyPending || isBuyConfirming;

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
              <h2 className="text-xl font-bold text-white">{companyName}</h2>
              <p className="text-sm text-white/60">Order #{order.orderId}</p>
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
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Order Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-[#A2D5C6]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60">Seller</p>
                    <p className="text-white font-medium">{shortenAddress(order.seller)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(order.expiryTime)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Available</p>
                    <p className="font-semibold text-white">{formatTokenAmount(order.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Price/Token</p>
                    <p className="font-semibold text-[#A2D5C6]">{formatUSDC(order.pricePerToken)}</p>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Amount to Buy</label>
                  <span className="text-xs text-white/40">
                    Max: {formatTokenAmount(order.amount)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
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

                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleQuickAmount(pct)}
                      className="flex-1 py-2 bg-[#A2D5C6]/10 text-[#A2D5C6] text-sm font-medium rounded-lg hover:bg-[#A2D5C6]/20 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              {amount > 0 && (
                <div className="bg-[#0A0A0A] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white">{formatUSDC(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Platform Fee (0.25%)</span>
                    <span className="text-white">{formatUSDC(platformFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="font-semibold text-white">Total</span>
                    <span className="font-bold text-[#A2D5C6] text-lg">{formatUSDC(totalWithFee)}</span>
                  </div>
                </div>
              )}

              {/* Balance Info */}
              <div className="text-xs text-white/40">
                Your USDC Balance: {usdcBalance ? formatUSDCDisplay(usdcBalance) : '$0.00'}
              </div>

              {/* Validation Messages */}
              {!hasEnoughBalance && amount > 0 && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Insufficient USDC balance
                </div>
              )}
              {amount > maxAmount && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Amount exceeds available tokens
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValidAmount || !hasEnoughBalance}
                className="w-full bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {hasEnoughAllowance ? 'Buy Tokens' : 'Approve & Buy'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {step === 'approve' && (
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
          )}

          {step === 'buy' && (
            <div className="text-center py-8">
              {isBuyPending || isBuyConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isBuyPending ? 'Confirm in Wallet' : 'Processing Purchase...'}
                  </h3>
                  <p className="text-white/60">
                    {isBuyPending
                      ? 'Please confirm the transaction in your wallet'
                      : 'Your purchase is being processed...'}
                  </p>
                </>
              ) : buyError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Purchase Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {buyError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={handleBuy}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : null}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-[#A2D5C6] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Purchase Successful!</h3>
              <p className="text-white/60 mb-2">
                You have successfully purchased {companyName} tokens.
              </p>
              <p className="text-sm text-[#A2D5C6] mb-6">
                {buyAmount} tokens for {formatUSDC(totalWithFee)}
              </p>
              <button
                onClick={onClose}
                className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
