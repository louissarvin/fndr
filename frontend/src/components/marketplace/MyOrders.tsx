import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useCancelSellOrder, USDC_DECIMALS } from '@/hooks/useContracts';
import { useSellerSellOrders, useRoundByEquityToken, type SellOrder } from '@/hooks/usePonderData';
import { useRoundMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import {
  Tag,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

function formatTokenAmount(value: bigint): string {
  // Token amounts are stored as whole numbers (not scaled to 18 decimals)
  const num = Number(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}

function formatUSDC(value: bigint): string {
  const num = Number(formatUnits(value, USDC_DECIMALS));
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

// Component to display token logo from IPFS
function TokenLogo({ tokenContract }: { tokenContract: string }) {
  const { data: round, isLoading: isRoundLoading } = useRoundByEquityToken(tokenContract);
  const { data: metadata, isLoading: isMetadataLoading } = useRoundMetadata(round?.metadataURI);

  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const companyName = metadata?.name || round?.companyName || '';
  const isLoading = isRoundLoading || isMetadataLoading;

  return (
    <div className="w-10 h-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
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

// Get company name from IPFS metadata
function useCompanyName(tokenContract: string) {
  const { data: round } = useRoundByEquityToken(tokenContract);
  const { data: metadata } = useRoundMetadata(round?.metadataURI);
  return metadata?.name || round?.companyName || null;
}

export default function MyOrders() {
  const { address, isConnected } = useAccount();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Get seller's orders from Ponder indexer
  const { data: orders, isLoading, refetch } = useSellerSellOrders(address?.toLowerCase());

  // Cancel order hook
  const {
    cancelSellOrder,
    isPending: isCancelPending,
    isConfirming: isCancelConfirming,
    isSuccess: isCancelSuccess,
    error: cancelError,
  } = useCancelSellOrder();

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    cancelSellOrder(BigInt(orderId));
  };

  // Reset after success
  if (isCancelSuccess && cancellingOrderId !== null) {
    setTimeout(() => {
      setCancellingOrderId(null);
      refetch();
    }, 2000);
  }

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#A2D5C6] mx-auto mb-2" />
        <p className="text-white/60 text-sm">Loading your orders...</p>
      </div>
    );
  }

  // Filter to only show active orders
  const activeOrders = orders?.filter(order => order.active) || [];

  if (activeOrders.length === 0) {
    return (
      <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8 text-center">
        <Tag className="h-12 w-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60 mb-1">No active sell orders</p>
        <p className="text-white/40 text-sm">Create a sell order to list your tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onCancel={() => handleCancelOrder(order.orderId)}
          isCancelling={cancellingOrderId === order.orderId && (isCancelPending || isCancelConfirming)}
          isCancelled={cancellingOrderId === order.orderId && isCancelSuccess}
          cancelError={cancellingOrderId === order.orderId ? cancelError : null}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: SellOrder;
  onCancel: () => void;
  isCancelling: boolean;
  isCancelled: boolean;
  cancelError: Error | null;
}

function OrderCard({ order, onCancel, isCancelling, isCancelled, cancelError }: OrderCardProps) {
  const companyName = useCompanyName(order.tokenContract);
  const displayName = companyName || `Order #${order.orderId}`;

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TokenLogo tokenContract={order.tokenContract} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/50">{shortenAddress(order.tokenContract)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCancelled ? (
            <span className="flex items-center gap-1 text-[#A2D5C6] text-sm">
              <CheckCircle className="h-4 w-4" />
              Cancelled
            </span>
          ) : (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Amount</p>
          <p className="font-semibold text-white">{Number(order.amount).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Price/Token</p>
          <p className="font-semibold text-white">{formatUSDC(BigInt(order.pricePerToken))}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Total Value</p>
          <p className="font-semibold text-[#A2D5C6]">
            {formatUSDC(BigInt(order.amount) * BigInt(order.pricePerToken))}
          </p>
        </div>
      </div>

      {cancelError && (
        <div className="flex items-center gap-2 text-red-400 text-sm mt-3">
          <AlertCircle className="h-4 w-4" />
          {cancelError.message?.slice(0, 60) || 'Failed to cancel order'}
        </div>
      )}
    </div>
  );
}
