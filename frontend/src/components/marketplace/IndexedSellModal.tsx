import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useInvestorInvestments, useRound } from '@/hooks/usePonderData';
import {
  useCreateSellOrder,
  useEquityTokenBalance,
  useEquityTokenApprove,
  useUSDCAllowance,
  USDC_DECIMALS,
} from '@/hooks/useContracts';
import { CONTRACTS } from '@/lib/contracts';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Tag,
  Clock,
  ChevronDown,
  Coins,
  DollarSign,
} from 'lucide-react';

interface IndexedSellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenHolding {
  roundId: string;
  tokenAddress: string;
  companyName: string | null;
  balance: bigint;
}

const DURATION_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
  { label: '30 days', hours: 720 },
];

export default function IndexedSellModal({ isOpen, onClose }: IndexedSellModalProps) {
  const { address } = useAccount();

  // Form state
  const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [pricePerToken, setPricePerToken] = useState('');
  const [duration, setDuration] = useState(168); // 7 days default
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [step, setStep] = useState<'form' | 'approve' | 'create' | 'success'>('form');
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);

  // Get investor's investments from Ponder
  const { data: investments } = useInvestorInvestments(address?.toLowerCase());

  // Get token balance for selected token
  const { data: tokenBalance } = useEquityTokenBalance(
    selectedToken?.tokenAddress as `0x${string}`,
    address
  );

  // Contract hooks
  const {
    approve: approveToken,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useEquityTokenApprove(selectedToken?.tokenAddress as `0x${string}`);

  const {
    createSellOrder,
    isPending: isCreatePending,
    isConfirming: isCreateConfirming,
    isSuccess: isCreateSuccess,
    error: createError,
  } = useCreateSellOrder();

  // Build token holdings from investments
  useEffect(() => {
    if (!investments) return;

    // Group by round and get unique token addresses
    const roundIds = [...new Set(investments.map(inv => inv.roundId))];

    // For now, we'll create holdings based on investments
    // In production, you'd query token balances directly
    const holdings: TokenHolding[] = roundIds.map(roundId => {
      const roundInvestments = investments.filter(inv => inv.roundId === roundId);
      const totalTokens = roundInvestments.reduce(
        (acc, inv) => acc + BigInt(inv.tokensReceived),
        BigInt(0)
      );

      return {
        roundId,
        tokenAddress: roundId, // In the contract, round address is the token issuer
        companyName: null, // Will be fetched separately
        balance: totalTokens,
      };
    });

    setTokenHoldings(holdings);
  }, [investments]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setSelectedToken(null);
      setSellAmount('');
      setPricePerToken('');
      setDuration(168);
      setShowTokenDropdown(false);
    }
  }, [isOpen]);

  // Move to create step after approval
  useEffect(() => {
    if (isApproveSuccess && step === 'approve') {
      setStep('create');
      handleCreate();
    }
  }, [isApproveSuccess, step]);

  // Move to success step after creation
  useEffect(() => {
    if (isCreateSuccess && step === 'create') {
      setStep('success');
    }
  }, [isCreateSuccess, step]);

  // Calculate values
  const amount = sellAmount ? parseUnits(sellAmount, 18) : BigInt(0);
  const price = pricePerToken ? parseUnits(pricePerToken, USDC_DECIMALS) : BigInt(0);
  const maxAmount = tokenBalance || selectedToken?.balance || BigInt(0);
  const totalValue = (amount * price) / BigInt(10 ** 18);
  const isValidAmount = amount > 0 && amount <= maxAmount;
  const isValidPrice = price > BigInt(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedToken || !isValidAmount || !isValidPrice) return;

    // Always need to approve tokens first for secondary market
    setStep('approve');
    handleApprove();
  };

  const handleApprove = () => {
    if (!selectedToken) return;
    approveToken(CONTRACTS.StartupSecondaryMarket as `0x${string}`, amount);
  };

  const handleCreate = () => {
    if (!selectedToken) return;
    createSellOrder(
      selectedToken.tokenAddress as `0x${string}`,
      amount,
      price,
      BigInt(duration)
    );
  };

  const handleSelectToken = (holding: TokenHolding) => {
    setSelectedToken(holding);
    setShowTokenDropdown(false);
  };

  const handleMaxAmount = () => {
    setSellAmount(formatUnits(maxAmount, 18));
  };

  if (!isOpen) return null;

  const isProcessing = isApprovePending || isApproveConfirming || isCreatePending || isCreateConfirming;

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
              <Tag className="h-5 w-5 text-[#A2D5C6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">List for Sale</h2>
              <p className="text-sm text-white/60">Create a sell order</p>
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
              {/* Token Selector */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Select Token
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    {selectedToken ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
                          <Coins className="h-4 w-4 text-[#A2D5C6]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {selectedToken.companyName || `Round ${selectedToken.roundId.slice(0, 8)}...`}
                          </p>
                          <p className="text-xs text-white/50">
                            Balance: {Number(formatUnits(tokenBalance || selectedToken.balance, 18)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/40">Choose a token...</span>
                    )}
                    <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showTokenDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                      {tokenHoldings.length === 0 ? (
                        <p className="px-4 py-6 text-center text-white/40">
                          No tokens available to sell
                        </p>
                      ) : (
                        tokenHoldings.map((holding) => (
                          <button
                            key={holding.roundId}
                            type="button"
                            onClick={() => handleSelectToken(holding)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#A2D5C6]/10 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
                              <Coins className="h-4 w-4 text-[#A2D5C6]" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-white">
                                {holding.companyName || `Round ${holding.roundId.slice(0, 8)}...`}
                              </p>
                              <p className="text-xs text-white/50">
                                {holding.roundId.slice(0, 10)}...{holding.roundId.slice(-8)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#A2D5C6]">
                                {Number(formatUnits(holding.balance, 18)).toLocaleString()}
                              </p>
                              <p className="text-xs text-white/40">tokens</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Amount to Sell</label>
                  {selectedToken && (
                    <span className="text-xs text-white/40">
                      Balance: {Number(formatUnits(maxAmount, 18)).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0"
                    disabled={!selectedToken}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 disabled:opacity-50"
                    step="any"
                  />
                  {selectedToken && (
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#A2D5C6] hover:text-[#CFFFE2]"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Price per Token (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={pricePerToken}
                    onChange={(e) => setPricePerToken(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    disabled={!selectedToken}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-lg placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Duration
                </label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setDuration(opt.hours)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        duration === opt.hours
                          ? 'bg-[#A2D5C6] text-black'
                          : 'bg-[#A2D5C6]/10 text-[#A2D5C6] hover:bg-[#A2D5C6]/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              {selectedToken && amount > 0 && price > 0 && (
                <div className="bg-[#A2D5C6]/10 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-white mb-2">Order Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Selling</span>
                    <span className="text-white">{sellAmount} tokens</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Price per token</span>
                    <span className="text-white">${pricePerToken}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="font-semibold text-white">Total Value</span>
                    <span className="font-bold text-[#A2D5C6] text-lg">
                      ${Number(formatUnits(totalValue, USDC_DECIMALS)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {amount > maxAmount && selectedToken && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Amount exceeds your balance
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedToken || !isValidAmount || !isValidPrice}
                className="w-full bg-[#A2D5C6] text-black py-4 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Tag className="h-5 w-5" />
                Create Sell Order
              </button>

              {/* Info */}
              <p className="text-xs text-white/40 text-center">
                Your tokens will be held in escrow until the order is filled or cancelled.
              </p>
            </form>
          )}

          {step === 'approve' && (
            <div className="text-center py-8">
              {isApprovePending || isApproveConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isApprovePending ? 'Confirm in Wallet' : 'Approving Tokens...'}
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

          {step === 'create' && (
            <div className="text-center py-8">
              {isCreatePending || isCreateConfirming ? (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-[#A2D5C6] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isCreatePending ? 'Confirm in Wallet' : 'Creating Order...'}
                  </h3>
                  <p className="text-white/60">
                    {isCreatePending
                      ? 'Please confirm the transaction in your wallet'
                      : 'Your sell order is being created...'}
                  </p>
                </>
              ) : createError ? (
                <>
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Order Creation Failed</h3>
                  <p className="text-red-400 text-sm mb-4">
                    {createError.message?.slice(0, 100) || 'Transaction failed'}
                  </p>
                  <button
                    onClick={handleCreate}
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
              <h3 className="text-xl font-semibold text-white mb-2">Order Created!</h3>
              <p className="text-white/60 mb-2">
                Your sell order has been successfully created.
              </p>
              <p className="text-sm text-[#A2D5C6] mb-6">
                {sellAmount} tokens @ ${pricePerToken} each
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
