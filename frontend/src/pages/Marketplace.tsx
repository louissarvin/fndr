import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Layout from '@/components/layout/Layout';
import {
  MOCK_MARKET_TOKENS,
  MOCK_SELL_ORDERS,
  formatCurrency,
  formatNumber,
  formatTimeRemaining,
  calculatePlatformFee,
  type MarketToken,
  type SellOrder
} from '@/lib/web3-config';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BadgeCheck,
  ArrowUpRight,
  Tag,
  Layers
} from 'lucide-react';
import BuyOrderModal from '@/components/marketplace/BuyOrderModal';
import CreateSellOrderModal from '@/components/marketplace/CreateSellOrderModal';

export default function Marketplace() {
  const [selectedToken, setSelectedToken] = useState<MarketToken | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SellOrder | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tokensRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);

  // Filter orders by selected token
  const filteredOrders = selectedToken
    ? MOCK_SELL_ORDERS.filter(order => order.token.id === selectedToken.id)
    : MOCK_SELL_ORDERS;

  // Calculate market stats
  const totalVolume = MOCK_MARKET_TOKENS.reduce((acc, t) => acc + t.volume24h, 0);
  const totalListings = MOCK_SELL_ORDERS.filter(o => o.isActive).length;

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      const titleWords = titleRef.current?.querySelectorAll('.title-word') || [];

      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 20, opacity: 0 });
      gsap.set(statsRef.current, { y: 30, opacity: 0 });
      gsap.set(tokensRef.current, { y: 30, opacity: 0 });
      gsap.set(ordersRef.current, { y: 40, opacity: 0 });

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

      tl.to(tokensRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
      }, '-=0.2');

      tl.to(ordersRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
      }, '-=0.2');
    });

    return () => ctx.revert();
  }, []);

  const handleBuyClick = (order: SellOrder) => {
    setSelectedOrder(order);
    setIsBuyModalOpen(true);
  };

  const handleSellClick = () => {
    setIsSellModalOpen(true);
  };

  return (
    <Layout>
      <div className="py-12 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 ref={titleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-4">
              {'Secondary Market'.split(' ').map((word, i) => (
                <span key={i} className="inline-block title-word">{word}</span>
              ))}
            </h1>
            <p ref={subtitleRef} className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto">
              Trade startup equity tokens with other verified investors.
            </p>
          </div>

          {/* Market Stats */}
          <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">24h Volume</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalVolume)}</p>
            </div>
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">Active Listings</p>
              <p className="text-2xl font-bold text-white">{totalListings}</p>
            </div>
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">Tokens Listed</p>
              <p className="text-2xl font-bold text-white">{MOCK_MARKET_TOKENS.length}</p>
            </div>
          </div>

          {/* Token Selector - Horizontal Scroll */}
          <div ref={tokensRef} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Tokens</h2>
              <button
                onClick={handleSellClick}
                className="px-5 py-2.5 bg-[#A2D5C6] text-black font-semibold rounded-2xl hover:bg-[#CFFFE2] transition-colors flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                List for Sale
              </button>
            </div>

            {/* Horizontal Scrollable Container */}
            <div className="relative">
              {/* "All" button */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedToken(null)}
                  className={`flex-shrink-0 bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl px-4 py-3 text-left transition-all duration-300 border-2 ${
                    selectedToken === null
                      ? 'border-[#A2D5C6] bg-[#A2D5C6]/20'
                      : 'border-transparent hover:border-[#A2D5C6]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#A2D5C6]/20 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-[#A2D5C6]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">All Tokens</p>
                      <p className="text-xs text-white/50">{MOCK_SELL_ORDERS.filter(o => o.isActive).length} orders</p>
                    </div>
                  </div>
                </button>

                {MOCK_MARKET_TOKENS.map((token) => {
                  const isSelected = selectedToken?.id === token.id;
                  const orderCount = MOCK_SELL_ORDERS.filter(o => o.token.id === token.id && o.isActive).length;

                  return (
                    <button
                      key={token.id}
                      onClick={() => setSelectedToken(isSelected ? null : token)}
                      className={`flex-shrink-0 bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl px-4 py-3 text-left transition-all duration-300 border-2 min-w-[200px] ${
                        isSelected
                          ? 'border-[#A2D5C6] bg-[#A2D5C6]/20'
                          : 'border-transparent hover:border-[#A2D5C6]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={token.image}
                          alt={token.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">{token.symbol}</p>
                            <div className={`flex items-center gap-0.5 text-xs ${
                              token.priceChange24h >= 0 ? 'text-[#A2D5C6]' : 'text-red-400'
                            }`}>
                              {token.priceChange24h >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span>{token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <span>${token.lastTradePrice.toFixed(2)}</span>
                            <span>•</span>
                            <span>{orderCount} orders</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fade edges for scroll indication */}
              <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#000000] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Order Book */}
          <div ref={ordersRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#A2D5C6]" />
                {selectedToken ? `${selectedToken.symbol} Orders` : 'All Orders'}
              </h2>
              {selectedToken && (
                <button
                  onClick={() => setSelectedToken(null)}
                  className="text-sm text-[#A2D5C6] hover:text-[#CFFFE2] transition-colors"
                >
                  View All
                </button>
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                <p className="text-white/50">No active orders for this token.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5 hover:bg-[#A2D5C6]/15 transition-colors"
                  >
                    {/* Token Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={order.token.image}
                        alt={order.token.name}
                        className="w-10 h-10 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{order.token.symbol}</h3>
                        <p className="text-sm text-white/50">{order.token.campaign.name}</p>
                      </div>
                      <span className="text-xs bg-[#A2D5C6]/20 text-[#A2D5C6] px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(order.expiresAt)}
                      </span>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={order.seller.avatar}
                        alt={order.seller.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-white/70">{order.seller.name}</span>
                      {order.seller.verified && (
                        <BadgeCheck className="h-4 w-4 text-[#A2D5C6]" />
                      )}
                      <span className="text-xs text-white/40 font-mono">{order.seller.address}</span>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-3 gap-4 mb-4 items-start">
                      <div>
                        <p className="text-xs text-white/40 mb-1">Amount</p>
                        <p className="font-semibold text-white">
                          {formatNumber(order.amount)}
                          {order.amount !== order.originalAmount && (
                            <span className="text-xs text-white/40 font-normal ml-1">of {formatNumber(order.originalAmount)}</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Price/Token</p>
                        <p className="font-semibold text-white">${order.pricePerToken.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-1">Total Value</p>
                        <p className="font-semibold text-[#A2D5C6]">{formatCurrency(order.amount * order.pricePerToken)}</p>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button
                      onClick={() => handleBuyClick(order)}
                      className="w-full py-3 bg-[#A2D5C6] text-black font-semibold rounded-2xl hover:bg-[#CFFFE2] transition-colors flex items-center justify-center gap-2"
                    >
                      Buy Tokens
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <BuyOrderModal
        order={selectedOrder}
        open={isBuyModalOpen}
        onOpenChange={setIsBuyModalOpen}
      />

      {/* Sell Modal */}
      <CreateSellOrderModal
        open={isSellModalOpen}
        onOpenChange={setIsSellModalOpen}
      />
    </Layout>
  );
}
