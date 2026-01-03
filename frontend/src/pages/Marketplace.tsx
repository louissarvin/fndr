import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import Layout from '@/components/layout/Layout';
import { useActiveSellOrders, useRecentTrades, usePlatformStats, useRoundByEquityToken, useRounds, type SellOrder } from '@/hooks/usePonderData';
import { useRoundMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import {
  TrendingUp,
  Clock,
  ArrowUpRight,
  Tag,
  Loader2,
  Wallet,
  ExternalLink,
  Bot,
  WifiOff,
} from 'lucide-react';
import IndexedBuyModal from '@/components/marketplace/IndexedBuyModal';
import IndexedSellModal from '@/components/marketplace/IndexedSellModal';
import MyOrders from '@/components/marketplace/MyOrders';
import AIChat from '@/components/ai/AIChat';
import { useAI, type OrderAnalysisData } from '@/components/ai/AIContext';

const USDC_DECIMALS = 6;

function formatUSDC(value: string): string {
  const num = Number(formatUnits(BigInt(value), USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatTokenAmount(value: string): string {
  // Token amounts are stored as whole numbers (not scaled to 18 decimals)
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
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

// Component to display token logo from IPFS
function TokenLogo({ tokenContract }: { tokenContract: string }) {
  const { data: round, isLoading: isRoundLoading } = useRoundByEquityToken(tokenContract);
  const { data: metadata, isLoading: isMetadataLoading } = useRoundMetadata(round?.metadataURI);

  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const companyName = metadata?.name || round?.companyName || '';
  const isLoading = isRoundLoading || isMetadataLoading;

  return (
    <div className="w-10 h-10 rounded-2xl bg-[#A2D5C6]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#A2D5C6]/50" />
      ) : logoUrl ? (
        <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-[#A2D5C6]">
          {companyName ? companyName.charAt(0).toUpperCase() : <Tag className="h-5 w-5" />}
        </span>
      )}
    </div>
  );
}

// Component to display token info with name from IPFS
function TokenInfo({ tokenContract, orderId }: { tokenContract: string; orderId: string }) {
  const { data: round } = useRoundByEquityToken(tokenContract);
  const { data: metadata } = useRoundMetadata(round?.metadataURI);

  const companyName = metadata?.name || round?.companyName || `Order #${orderId}`;

  return (
    <div className="flex-1 min-w-0">
      <p className="font-bold text-white truncate">{companyName}</p>
      <p className="text-sm text-white/50 truncate">{shortenAddress(tokenContract)}</p>
    </div>
  );
}

// Order card component with AI analysis
function OrderCard({
  order,
  onBuy,
  onAnalyze,
}: {
  order: SellOrder;
  onBuy: (order: SellOrder) => void;
  onAnalyze: (order: SellOrder, companyName: string) => void;
}) {
  const { data: round } = useRoundByEquityToken(order.tokenContract);
  const { data: metadata } = useRoundMetadata(round?.metadataURI);

  const companyName = metadata?.name || round?.companyName || `Order #${order.orderId}`;

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5 transition-colors">
      {/* Token Contract with IPFS Logo */}
      <div className="flex items-center gap-3 mb-4">
        <TokenLogo tokenContract={order.tokenContract} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{companyName}</p>
          <p className="text-sm text-white/50 truncate">{shortenAddress(order.tokenContract)}</p>
        </div>
        <span className="text-xs bg-[#A2D5C6]/20 text-[#A2D5C6] px-2 py-1 rounded-full flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {getTimeRemaining(order.expiryTime)}
        </span>
      </div>

      {/* Seller Info */}
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-4 w-4 text-[#A2D5C6]" />
        <span className="text-sm text-white/70">{shortenAddress(order.seller)}</span>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-white/40 mb-1">Amount</p>
          <p className="font-semibold text-white">{formatTokenAmount(order.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Price/Token</p>
          <p className="font-semibold text-white">{formatUSDC(order.pricePerToken)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">Total Value</p>
          <p className="font-semibold text-[#A2D5C6]">
            {formatUSDC((BigInt(order.amount) * BigInt(order.pricePerToken)).toString())}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onBuy(order)}
          className="flex-1 py-3 bg-[#A2D5C6] text-black font-semibold rounded-2xl hover:bg-[#CFFFE2] transition-colors flex items-center justify-center gap-2"
        >
          Buy Tokens
        </button>
        <button
          onClick={() => onAnalyze(order, companyName)}
          className="flex-shrink-0 p-3 border border-[#A2D5C6]/30 text-[#A2D5C6] rounded-2xl hover:bg-[#A2D5C6]/10 transition-colors flex items-center justify-center"
          title="Analyze with AI"
        >
          <Bot className="h-4 w-4" />
        </button>
        <a
          href={`https://sepolia-blockscout.lisk.com/tx/${order.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-3 border border-white/20 text-white/60 rounded-2xl hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { isConnected } = useAccount();
  const [selectedOrder, setSelectedOrder] = useState<SellOrder | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'my-orders'>('orders');

  // Fetch indexed data
  const { data: orders, isLoading, error } = useActiveSellOrders();
  const { data: recentTrades } = useRecentTrades(10);
  const { data: platformStats } = usePlatformStats();
  const { data: allRounds } = useRounds();

  // AI context
  const { openWithOrder } = useAI();

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      const titleWords = titleRef.current?.querySelectorAll('.title-word') || [];

      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 20, opacity: 0 });
      gsap.set(statsRef.current, { y: 30, opacity: 0 });
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

  // Handle AI order analysis
  const handleAnalyzeOrder = (order: SellOrder, companyName: string) => {
    const round = allRounds?.find(r => r.equityToken?.toLowerCase() === order.tokenContract.toLowerCase()) || null;
    const orderAnalysisData: OrderAnalysisData = {
      order,
      round,
      companyName,
    };
    openWithOrder(orderAnalysisData);
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

          {/* Connection Status */}
          <div className="flex justify-center mb-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading orders...
              </div>
            ) : error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Failed to connect to indexer
              </div>
            )}
          </div>

          {/* Market Stats */}
          <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-white">{platformStats?.totalTrades || 0}</p>
            </div>
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">Active Listings</p>
              <p className="text-2xl font-bold text-white">{orders?.length || 0}</p>
            </div>
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-5">
              <p className="text-white/50 text-sm mb-1">Trade Volume</p>
              <p className="text-2xl font-bold text-white">
                {platformStats?.totalTradeVolume ? formatUSDC(platformStats.totalTradeVolume) : '$0.00'}
              </p>
            </div>
          </div>

          {/* Order Book */}
          <div ref={ordersRef}>
            {/* Header with tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#A2D5C6] text-black'
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  All Orders
                </button>
                {isConnected && (
                  <button
                    onClick={() => setActiveTab('my-orders')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'my-orders'
                        ? 'bg-[#A2D5C6] text-black'
                        : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    My Orders
                  </button>
                )}
              </div>
              {isConnected && (
                <button
                  onClick={() => setIsSellModalOpen(true)}
                  className="px-5 py-2.5 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors flex items-center gap-2"
                >
                  List for Sale
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-[#A2D5C6] mb-4" />
                <p className="text-white/60">Loading orders...</p>
              </div>
            )}

            {/* Content */}
            {!isLoading && (
              <>
                {/* My Orders Tab */}
                {activeTab === 'my-orders' && isConnected && (
                  <MyOrders />
                )}

                {/* All Orders Tab */}
                {activeTab === 'orders' && (
                  <>
                    {!orders || orders.length === 0 ? (
                      <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-12 text-center">
                        <p className="text-white/50 mb-2">No active sell orders yet.</p>
                        <p className="text-white/30 text-sm">Create a sell order to list your equity tokens.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orders.map((order: SellOrder) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onBuy={handleBuyClick}
                            onAnalyze={handleAnalyzeOrder}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Recent Trades Section */}
                {activeTab === 'orders' && recentTrades && recentTrades.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      Recent Trades
                    </h3>
                    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-xs text-white/50 font-medium p-4">Buyer</th>
                            <th className="text-left text-xs text-white/50 font-medium p-4">Seller</th>
                            <th className="text-right text-xs text-white/50 font-medium p-4">Amount</th>
                            <th className="text-right text-xs text-white/50 font-medium p-4">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTrades.slice(0, 5).map((trade) => (
                            <tr key={trade.id} className="border-b border-white/5 last:border-0">
                              <td className="p-4 text-sm text-white">{shortenAddress(trade.buyer)}</td>
                              <td className="p-4 text-sm text-white/70">{shortenAddress(trade.seller)}</td>
                              <td className="p-4 text-sm text-white text-right">{formatTokenAmount(trade.amount)}</td>
                              <td className="p-4 text-sm text-[#A2D5C6] text-right">{formatUSDC(trade.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <IndexedBuyModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        order={selectedOrder}
      />

      {/* Sell Modal */}
      <IndexedSellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
      />

      {/* AI Chat */}
      <AIChat rounds={allRounds || []} />
    </Layout>
  );
}
