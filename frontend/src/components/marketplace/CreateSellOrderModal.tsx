import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { X, Clock, AlertCircle, Tag, ChevronDown } from 'lucide-react';
import {
  MOCK_MARKET_TOKENS,
  formatCurrency,
  formatNumber,
  type MarketToken
} from '@/lib/web3-config';

interface CreateSellOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock user holdings
const USER_HOLDINGS = [
  { token: MOCK_MARKET_TOKENS[0], balance: 15000, purchaseDate: '2024-01-15' },
  { token: MOCK_MARKET_TOKENS[1], balance: 8500, purchaseDate: '2024-02-01' },
];

const DURATION_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
  { label: '30 days', hours: 720 },
];

export default function CreateSellOrderModal({ open, onOpenChange }: CreateSellOrderModalProps) {
  const [selectedToken, setSelectedToken] = useState<MarketToken | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [pricePerToken, setPricePerToken] = useState('');
  const [duration, setDuration] = useState(168); // 7 days default
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate values
  const amount = parseFloat(sellAmount) || 0;
  const price = parseFloat(pricePerToken) || 0;
  const totalValue = amount * price;
  const selectedHolding = USER_HOLDINGS.find(h => h.token.id === selectedToken?.id);
  const maxAmount = selectedHolding?.balance || 0;
  const isValidAmount = amount > 0 && amount <= maxAmount;
  const isValidPrice = price > 0;

  // Handle open state
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setSelectedToken(null);
      setSellAmount('');
      setPricePerToken('');
      setDuration(168);
    }
  }, [open]);

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

        tl.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        tl.to(containerRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.2');
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

    tl.to(containerRef.current, { scale: 0.95, opacity: 0, y: 20, duration: 0.25 });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
  };

  const handleCreateOrder = () => {
    // TODO: Implement actual create order logic
    console.log('Creating sell order:', {
      token: selectedToken?.symbol,
      amount,
      pricePerToken: price,
      duration,
      totalValue
    });
    handleClose();
  };

  const handleSelectToken = (token: MarketToken) => {
    setSelectedToken(token);
    setShowTokenDropdown(false);
    // Set suggested price based on last trade price
    setPricePerToken(token.lastTradePrice.toFixed(2));
  };

  if (!shouldRender) return null;

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

            <div ref={contentRef} className="p-6 space-y-6">
              {/* Header */}
              <div>
                <DialogPrimitive.Title className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Tag className="h-6 w-6 text-[#A2D5C6]" />
                  List for Sale
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-white/50">
                  Create a sell order for your equity tokens
                </DialogPrimitive.Description>
              </div>

              {/* Token Selector */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Select Token</label>
                <div className="relative">
                  <button
                    onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-[#A2D5C6]/40 transition-colors"
                  >
                    {selectedToken ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedToken.image}
                          alt={selectedToken.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{selectedToken.symbol}</p>
                          <p className="text-xs text-white/50">{selectedToken.campaign.name}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/40">Choose a token...</span>
                    )}
                    <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showTokenDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-xl overflow-hidden z-10">
                      {USER_HOLDINGS.map((holding) => (
                        <button
                          key={holding.token.id}
                          onClick={() => handleSelectToken(holding.token)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#A2D5C6]/10 transition-colors"
                        >
                          <img
                            src={holding.token.image}
                            alt={holding.token.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-white">{holding.token.symbol}</p>
                            <p className="text-xs text-white/50">{holding.token.campaign.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#A2D5C6]">{formatNumber(holding.balance)}</p>
                            <p className="text-xs text-white/40">available</p>
                          </div>
                        </button>
                      ))}

                      {USER_HOLDINGS.length === 0 && (
                        <p className="px-4 py-6 text-center text-white/40">No tokens available to sell</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70">Amount to Sell</label>
                  {selectedHolding && (
                    <span className="text-xs text-white/40">
                      Balance: {formatNumber(selectedHolding.balance)}
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
                    className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors disabled:opacity-50"
                  />
                  {selectedHolding && (
                    <button
                      onClick={() => setSellAmount(selectedHolding.balance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A2D5C6] hover:text-[#CFFFE2] font-medium"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70">Price per Token</label>
                  {selectedToken && (
                    <span className="text-xs text-white/40">
                      Last trade: ${selectedToken.lastTradePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                  <input
                    type="number"
                    value={pricePerToken}
                    onChange={(e) => setPricePerToken(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    disabled={!selectedToken}
                    className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-2">
                <label className="text-sm text-white/70 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Order Duration
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.hours}
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
                    <span className="text-white">{formatNumber(amount)} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Price per token</span>
                    <span className="text-white">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="font-semibold text-white">Total Value</span>
                    <span className="font-bold text-[#A2D5C6] text-lg">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              )}

              {/* Warning */}
              {amount > maxAmount && selectedToken && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Amount exceeds your balance</span>
                </div>
              )}

              {/* Create Order Button */}
              <button
                onClick={handleCreateOrder}
                disabled={!selectedToken || !isValidAmount || !isValidPrice}
                className="w-full py-4 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Tag className="h-5 w-5" />
                Create Sell Order
              </button>

              {/* Info */}
              <p className="text-xs text-white/40 text-center">
                Your tokens will be held in escrow until the order is filled or cancelled.
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
