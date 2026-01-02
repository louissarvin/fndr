import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { useRound } from '@/hooks/usePonderData';
import { useRoundMetadata, useFounderProfileMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import {
  useInvest,
  useUSDCBalance,
  useUSDCApprove,
  useUSDCAllowance,
  useRoundConfig,
  useFounderProfileURI,
  formatUSDCDisplay,
  USDC_DECIMALS,
} from '@/hooks/useContracts';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  Wallet,
  User,
  BadgeCheck,
  Linkedin,
  Twitter,
} from 'lucide-react';
import PitchDeckViewer from '@/components/campaigns/PitchDeckViewer';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: string;
}

// Fallback images when no IPFS image is available
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
];

function getFallbackImage(id: string): string {
  const index = parseInt(id.slice(-4), 16) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function InvestModal({ isOpen, onClose, roundId }: InvestModalProps) {
  const { address } = useAccount();

  // Form state
  const [investAmount, setInvestAmount] = useState('');
  const [step, setStep] = useState<'form' | 'approve' | 'invest' | 'success'>('form');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const apyBadgeRef = useRef<HTMLSpanElement>(null);
  const founderRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const progressSectionRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const investSectionRef = useRef<HTMLDivElement>(null);
  const quickButtonsRef = useRef<HTMLDivElement>(null);

  // Get round details
  const { data: round, isLoading: isLoadingRound } = useRound(roundId);
  const { data: roundConfig } = useRoundConfig(roundId as `0x${string}`);

  // Fetch IPFS metadata
  const { data: metadata } = useRoundMetadata(round?.metadataURI);

  // Founder profile
  const { data: founderProfileURI } = useFounderProfileURI(round?.founder as `0x${string}` | undefined);
  const { data: founderProfile } = useFounderProfileMetadata(founderProfileURI);
  const founderImageUrl = founderProfile?.profileImage ? ipfsToHttp(founderProfile.profileImage) : null;

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

  // Get image: IPFS logo > fallback
  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const image = logoUrl || getFallbackImage(roundId);

  // Get company name: metadata > indexed > shortened address
  const companyName = metadata?.name || round?.companyName || `Round ${shortenAddress(roundId)}`;

  const progress = round
    ? Math.min(Math.round((Number(round.totalRaised) / Number(round.targetRaise)) * 100), 100)
    : 0;

  // Handle open state changes
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setStep('form');
      setInvestAmount('');
    }
  }, [isOpen]);

  // Entrance animations
  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    let ctx: gsap.Context | null = null;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(containerRef.current, { scale: 0.9, opacity: 0, y: 30 });
        gsap.set(imageRef.current, { scale: 1.1 });
        gsap.set([badgesRef.current, apyBadgeRef.current], { y: -20, opacity: 0 });
        gsap.set(founderRef.current, { x: -20, opacity: 0 });
        gsap.set(titleRef.current, { y: 30, opacity: 0 });
        gsap.set(taglineRef.current, { y: 20, opacity: 0 });
        gsap.set(progressSectionRef.current, { y: 30, opacity: 0 });
        gsap.set(progressBarRef.current, { scaleX: 0, transformOrigin: 'left' });
        gsap.set(investSectionRef.current, { y: 30, opacity: 0 });
        gsap.set(quickButtonsRef.current?.children || [], { y: 20, opacity: 0 });

        tl.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        tl.to(containerRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.2');
        tl.to(imageRef.current, { scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.2');
        tl.to([badgesRef.current, apyBadgeRef.current], { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(1.5)' }, '-=0.6');
        tl.to(founderRef.current, { x: 0, opacity: 1, duration: 0.4 }, '-=0.3');
        tl.to(titleRef.current, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.3)' }, '-=0.2');
        tl.to(taglineRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.3');
        tl.to(progressSectionRef.current, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');
        tl.to(progressBarRef.current, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, '-=0.3');
        tl.to(investSectionRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.4');
        tl.to(quickButtonsRef.current?.children || [], { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(1.5)' }, '-=0.2');
      });
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      ctx?.revert();
    };
  }, [isOpen, shouldRender]);

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

  const amountWei = investAmount ? parseUnits(investAmount, USDC_DECIMALS) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= amountWei;
  const hasEnoughBalance = usdcBalance && usdcBalance >= amountWei;

  const sharePrice = roundConfig?.[2] || BigInt(1e6);
  // Match contract logic: tokensToMint = usdcAmount / sharePrice (no decimal scaling)
  const tokensToReceive = amountWei > 0 && sharePrice > 0
    ? amountWei / sharePrice
    : BigInt(0);

  const remainingCapacity = round
    ? BigInt(round.targetRaise) - BigInt(round.totalRaised)
    : BigInt(0);

  const handleClose = () => {
    if (isAnimating || isApprovePending || isApproveConfirming || isInvestPending || isInvestConfirming) return;
    setIsAnimating(true);

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        setIsAnimating(false);
        setShouldRender(false);
        onClose();
      }
    });

    tl.to(quickButtonsRef.current?.children || [], { y: 10, opacity: 0, duration: 0.15, stagger: 0.02 });
    tl.to(investSectionRef.current, { y: 15, opacity: 0, duration: 0.15 }, '-=0.1');
    tl.to(progressSectionRef.current, { y: 15, opacity: 0, duration: 0.15 }, '-=0.1');
    tl.to([taglineRef.current, titleRef.current], { y: 10, opacity: 0, duration: 0.15, stagger: 0.02 }, '-=0.1');
    tl.to(founderRef.current, { x: -10, opacity: 0, duration: 0.15 }, '-=0.1');
    tl.to([badgesRef.current, apyBadgeRef.current], { y: -10, opacity: 0, duration: 0.15 }, '-=0.1');
    tl.to(containerRef.current, { scale: 0.95, opacity: 0, y: 20, duration: 0.25, ease: 'power2.in' }, '-=0.1');
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
  };

  const handleSubmit = () => {
    if (!investAmount || amountWei <= 0) return;

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

  if (!shouldRender) return null;

  const isProcessing = isApprovePending || isApproveConfirming || isInvestPending || isInvestConfirming;

  return (
    <DialogPrimitive.Root open={true} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogPrimitive.Portal forceMount>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          ref={overlayRef}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Content */}
        <DialogPrimitive.Content
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4"
        >
          {/* Glassmorphism Container */}
          <div ref={containerRef} className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border border-[#A2D5C6]/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-200 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero Image */}
            <div ref={imageRef} className="relative h-48 md:h-56 overflow-hidden">
              <img
                src={image}
                alt={companyName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />

              {/* Badges */}
              <div ref={badgesRef} className="absolute top-5 left-4 flex gap-2">
                <span className="bg-[#CFFFE2] backdrop-blur-sm text-black text-xs font-medium px-3 py-1 rounded-full">
                  {round?.state === 0 ? 'Fundraising' : round?.state === 1 ? 'Completed' : 'Cancelled'}
                </span>
                {round?.equityPercentage && (
                  <span className="bg-[#CFFFE2] text-black text-xs font-bold px-3 py-1 rounded-full">
                    {Number(round.equityPercentage) / 100}% Equity
                  </span>
                )}
              </div>
              <span ref={apyBadgeRef} className="absolute top-5 right-16 bg-[#CFFFE2] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                6% APY
              </span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isLoadingRound ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#A2D5C6]" />
                </div>
              ) : step === 'form' ? (
                <>
                  {/* Founder Profile Card */}
                  <div ref={founderRef} className="bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {founderImageUrl ? (
                        <img
                          src={founderImageUrl}
                          alt={founderProfile?.name || 'Founder'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#A2D5C6]/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#A2D5C6]/30 flex items-center justify-center border-2 border-[#A2D5C6]/30">
                          {founderProfile ? (
                            <User className="h-5 w-5 text-[#A2D5C6]" />
                          ) : (
                            <Wallet className="h-5 w-5 text-[#A2D5C6]" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {founderProfile ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-white truncate">{founderProfile.name}</h4>
                              <BadgeCheck className="h-4 w-4 text-[#A2D5C6] flex-shrink-0" />
                            </div>
                            <p className="text-sm text-[#A2D5C6] truncate">{founderProfile.title}</p>
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">{founderProfile.bio}</p>
                            {(founderProfile.linkedin || founderProfile.twitter) && (
                              <div className="flex items-center gap-3 mt-2">
                                {founderProfile.linkedin && (
                                  <a
                                    href={founderProfile.linkedin.startsWith('http') ? founderProfile.linkedin : `https://${founderProfile.linkedin}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/40 hover:text-[#A2D5C6] transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Linkedin className="h-4 w-4" />
                                  </a>
                                )}
                                {founderProfile.twitter && (
                                  <a
                                    href={founderProfile.twitter.startsWith('http') ? founderProfile.twitter : `https://twitter.com/${founderProfile.twitter.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/40 hover:text-[#A2D5C6] transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Twitter className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-white/70 font-mono">{round?.founder ? shortenAddress(round.founder) : 'Unknown'}</p>
                            <p className="text-xs text-white/40 mt-0.5">Founder</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="space-y-3">
                    <DialogPrimitive.Title ref={titleRef} className="text-2xl md:text-3xl font-bold text-white">
                      {companyName}
                    </DialogPrimitive.Title>
                    {metadata?.description && (
                      <p className="text-sm text-white/60 line-clamp-3">{metadata.description}</p>
                    )}
                    <DialogPrimitive.Description ref={taglineRef} className="text-[#A2D5C6] font-medium">
                      Invest and earn 6% APY while supporting this startup
                    </DialogPrimitive.Description>

                    {/* Pitch Deck */}
                    {metadata?.pitchDeck && (
                      <div className="pt-1">
                        <PitchDeckViewer pitchDeckHash={metadata.pitchDeck} companyName={companyName} />
                      </div>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div ref={progressSectionRef} className="bg-[#A2D5C6]/10 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {round && formatUSDCDisplay(BigInt(round.totalRaised))}
                        </p>
                        <p className="text-sm text-white/50">
                          raised of {round && formatUSDCDisplay(BigInt(round.targetRaise))}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-[#A2D5C6]">{progress}%</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        ref={progressBarRef}
                        className="h-full bg-gradient-to-r from-[#A2D5C6] to-[#CFFFE2] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between pt-2">
                      <div className="flex items-center gap-2 text-white/60">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{round?.investorCount || 0} investors</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Remaining: {formatUSDCDisplay(remainingCapacity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investment Section */}
                  <div className="space-y-4">
                    <div ref={investSectionRef} className="flex gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                        <input
                          type="number"
                          value={investAmount}
                          onChange={(e) => setInvestAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-2xl pl-8 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={!investAmount || !hasEnoughBalance || amountWei > remainingCapacity || amountWei <= 0}
                        className="px-8 py-3 bg-[#A2D5C6] text-black font-semibold rounded-2xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {hasEnoughAllowance ? 'Invest Now' : 'Approve & Invest'}
                      </button>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div ref={quickButtonsRef} className="flex gap-2">
                      {[100, 500, 1000, 5000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setInvestAmount(amount.toString())}
                          className="flex-1 py-3 bg-[#A2D5C6]/10 text-[#A2D5C6] text-sm font-medium rounded-2xl hover:bg-[#A2D5C6]/20 transition-colors"
                        >
                          ${amount.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Balance & Token Info */}
                    <div className="flex justify-between text-sm text-white/50">
                      <span>Balance: {usdcBalance ? formatUSDCDisplay(usdcBalance) : '$0.00'}</span>
                      {investAmount && tokensToReceive > 0 && (
                        <span className="text-[#A2D5C6]">
                          Receive: {Number(tokensToReceive).toLocaleString()} tokens
                        </span>
                      )}
                    </div>

                    {/* Validation Messages */}
                    {!hasEnoughBalance && investAmount && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Insufficient USDC balance
                      </div>
                    )}
                    {amountWei > remainingCapacity && investAmount && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Amount exceeds remaining capacity
                      </div>
                    )}
                  </div>
                </>
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
                  <h3 className="text-xl font-semibold text-white mb-2">Investment Successful!</h3>
                  <p className="text-white/60 mb-2">
                    You have successfully invested {formatUSDCDisplay(amountWei)} in this round.
                  </p>
                  <p className="text-sm text-[#A2D5C6] mb-6">
                    You received {Number(tokensToReceive).toLocaleString()} equity tokens
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-[#A2D5C6] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#CFFFE2] transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
