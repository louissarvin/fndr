import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useSellerOrders, useCancelSellOrder, USDC_DECIMALS } from '@/hooks/useContracts';
import {
  Tag,
  Clock,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Trash2,
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

export default function MyOrders() {
  const { address, isConnected } = useAccount();
  const [cancellingOrderId, setCancellingOrderId] = useState<bigint | null>(null);

  // Get seller's orders from contract
  const { data: orderIds, isLoading, refetch } = useSellerOrders(address);

  // Cancel order hook
  const {
    cancelSellOrder,
    isPending: isCancelPending,
    isConfirming: isCancelConfirming,
    isSuccess: isCancelSuccess,
    error: cancelError,
  } = useCancelSellOrder();

  const handleCancelOrder = async (orderId: bigint) => {
    setCancellingOrderId(orderId);
    cancelSellOrder(orderId);
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

  if (!orderIds || orderIds.length === 0) {
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
      {orderIds.map((orderId) => (
        <OrderCard
          key={orderId.toString()}
          orderId={orderId}
          onCancel={() => handleCancelOrder(orderId)}
          isCancelling={cancellingOrderId === orderId && (isCancelPending || isCancelConfirming)}
          isCancelled={cancellingOrderId === orderId && isCancelSuccess}
          cancelError={cancellingOrderId === orderId ? cancelError : null}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  orderId: bigint;
  onCancel: () => void;
  isCancelling: boolean;
  isCancelled: boolean;
  cancelError: Error | null;
}

function OrderCard({ orderId, onCancel, isCancelling, isCancelled, cancelError }: OrderCardProps) {
  // In a real implementation, you'd fetch order details from contract
  // For now, we'll show a simplified view

  return (
    <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A2D5C6]/20 flex items-center justify-center">
            <Tag className="h-5 w-5 text-[#A2D5C6]" />
          </div>
          <div>
            <p className="font-semibold text-white">Order #{orderId.toString()}</p>
            <p className="text-xs text-white/50">Active sell order</p>
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
                <>
                  <Trash2 className="h-4 w-4" />
                  Cancel
                </>
              )}
            </button>
          )}
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
