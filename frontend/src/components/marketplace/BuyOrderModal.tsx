import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { X, BadgeCheck, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatTimeRemaining,
  calculatePlatformFee,
  type SellOrder
} from '@/lib/web3-config';

interface BuyOrderModalProps {
  order: SellOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BuyOrderModal({ order, open, onOpenChange }: BuyOrderModalProps) {
  const [buyAmount, setBuyAmount] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate values
  const amount = parseFloat(buyAmount) || 0;
  const subtotal = amount * (order?.pricePerToken || 0);
  const platformFee = calculatePlatformFee(subtotal);
  const total = subtotal + platformFee;
  const maxAmount = order?.amount || 0;
  const isValidAmount = amount > 0 && amount <= maxAmount;

  // Handle open state
  useEffect(() => {
    if (open && order) {
      setShouldRender(true);
      setBuyAmount('');
    }
  }, [open, order]);

  // Entrance animations
  useEffect(() => {
    if (!open || !shouldRender) return;

    let ctx: gsap.Context | null = null;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(containerRef.current, { scale: 0.9, opacity: 0, y: 30 });
        gsap.set(headerRef.current, { y: 20, opacity: 0 });
        gsap.set(detailsRef.current, { y: 20, opacity: 0 });
        gsap.set(inputRef.current, { y: 20, opacity: 0 });
        gsap.set(summaryRef.current, { y: 20, opacity: 0 });
        gsap.set(buttonRef.current, { y: 20, opacity: 0 });

        tl.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        tl.to(containerRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.2');
        tl.to(headerRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2');
        tl.to(detailsRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.3');
        tl.to(inputRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.3');
        tl.to(summaryRef.current, { y: 0, opacity: 1, duration: 0.4 }, '-=0.3');
        tl.to(buttonRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.3');
      });
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      ctx?.revert();
    };
  }, [open, shouldRender]);

  // Close animation
  const handleClose = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        setIsAnimating(false);
        setShouldRender(false);
        onOpenChange(false);
      }
    });

    tl.to([buttonRef.current, summaryRef.current, inputRef.current, detailsRef.current, headerRef.current], {
      y: 10,
      opacity: 0,
      duration: 0.15,
      stagger: 0.02
    });

    tl.to(containerRef.current, { scale: 0.95, opacity: 0, y: 20, duration: 0.25 }, '-=0.1');
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
  };

  const handleBuy = () => {
    // TODO: Implement actual buy logic
    console.log('Buying:', amount, 'tokens for', total);
    handleClose();
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = Math.floor(maxAmount * (percentage / 100));
    setBuyAmount(quickAmount.toString());
  };

  if (!shouldRender || !order) return null;

  return (
    <DialogPrimitive.Root open={true} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        <DialogPrimitive.Content
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] p-4"
        >
          <div ref={containerRef} className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border border-[#A2D5C6]/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div ref={headerRef}>
                <DialogPrimitive.Title className="text-2xl font-bold text-white mb-2">
                  Buy Tokens
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-white/50">
                  Purchase {order.token.symbol} from {order.seller.name}
                </DialogPrimitive.Description>
              </div>

              {/* Order Details */}
              <div ref={detailsRef} className="bg-[#A2D5C6]/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={order.token.image}
                    alt={order.token.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{order.token.symbol}</h3>
                    <p className="text-sm text-white/50">{order.token.campaign.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#A2D5C6]">${order.pricePerToken.toFixed(2)}</p>
                    <p className="text-xs text-white/40">per token</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <img
                      src={order.seller.avatar}
                      alt={order.seller.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-white/70">{order.seller.name}</span>
                    {order.seller.verified && <BadgeCheck className="h-4 w-4 text-[#A2D5C6]" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {formatTimeRemaining(order.expiresAt)}</span>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div ref={inputRef} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70">Amount to Buy</label>
                  <span className="text-xs text-white/40">
                    Available: {formatNumber(order.amount)} tokens
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    placeholder="0"
                    max={order.amount}
                    className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors"
                  />
                  <button
                    onClick={() => setBuyAmount(order.amount.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A2D5C6] hover:text-[#CFFFE2] font-medium"
                  >
                    MAX
                  </button>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleQuickAmount(pct)}
                      className="flex-1 py-2 bg-[#A2D5C6]/10 text-[#A2D5C6] text-sm font-medium rounded-lg hover:bg-[#A2D5C6]/20 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div ref={summaryRef} className="bg-[#0A0A0A] rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Platform Fee (0.25%)</span>
                  <span className="text-white">{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-[#A2D5C6] text-lg">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Warning */}
              {amount > maxAmount && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Amount exceeds available tokens</span>
                </div>
              )}

              {/* Buy Button */}
              <button
                ref={buttonRef}
                onClick={handleBuy}
                disabled={!isValidAmount}
                className="w-full py-4 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Confirm Purchase
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
