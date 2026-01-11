import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Droplets, Wallet, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  useUSDCBalance,
  useHasClaimedAirdrop,
  useUSDCAirdrop,
  formatUSDCDisplay,
} from '@/hooks/useContracts';

interface FaucetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FaucetModal({ open, onOpenChange }: FaucetModalProps) {
  const { address, isConnected } = useAccount();
  const [showSuccess, setShowSuccess] = useState(false);

  // Contract reads
  const { data: balance, refetch: refetchBalance } = useUSDCBalance(address);
  const { data: hasClaimed, refetch: refetchHasClaimed } = useHasClaimedAirdrop(address);

  // Contract write
  const {
    claimAirdrop,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } = useUSDCAirdrop();

  // Handle successful claim
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      refetchBalance();
      refetchHasClaimed();

      // Hide success after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, refetchBalance, refetchHasClaimed]);

  const handleClaim = () => {
    if (!isPending && !isConfirming) {
      claimAirdrop();
    }
  };

  const isLoading = isPending || isConfirming;
  const formattedBalance = balance ? formatUSDCDisplay(balance) : '$0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#1F1F1F] rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            Test USDC Faucet
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Claim test USDC tokens to try out the platform on Arbitrum Sepolia testnet.
          </DialogDescription>
        </DialogHeader>

        <div className=" space-y-6">
          {/* Balance Card */}
          <div className="bg-[#4988C4]/10 backdrop-blur-md rounded-2xl p-5 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm mb-1">Your USDC Balance</p>
                <p className="text-3xl font-bold text-white">{formattedBalance}</p>
              </div>
              <div className="p-3 rounded-xl">
                <Wallet className="h-8 w-8 text-[#4988C4]" />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {showSuccess && (
            <div className="flex items-center gap-3 bg-[#4988C4]/20 text-[#4988C4] rounded-xl p-4">
              <p className="text-sm font-medium">Successfully claimed 1,000 USDC!</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/20 text-red-400 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {error.message?.includes('Already claimed')
                  ? 'You have already claimed the airdrop.'
                  : 'Failed to claim. Please try again.'}
              </p>
            </div>
          )}

          {/* Claim Button */}
          {!isConnected ? (
            <div className="text-center py-4">
              <p className="text-white/50 text-sm">Connect your wallet to claim test tokens.</p>
            </div>
          ) : hasClaimed ? (
            <div className="flex items-center justify-center gap-3 bg-[#1A1A1A] rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium">You've already claimed your airdrop</p>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full py-4 bg-[#4988C4] text-black font-semibold rounded-xl hover:bg-[#1C4D8D] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Claiming...'}
                </>
              ) : (
                <>
                  Claim 1.000 Test USDC
                </>
              )}
            </button>
          )}

          {/* Info */}
          <div className="text-center">
            <p className="text-white/40 text-xs">
              These are test tokens on Arbitrum Sepolia with no real value.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
