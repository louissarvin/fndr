import { useState } from 'react';
import { Users, Clock, TrendingUp, Wallet, ExternalLink } from 'lucide-react';
import { formatUnits } from 'viem';
import type { Round } from '@/hooks/usePonderData';
import InvestModal from '@/components/investor/InvestModal';

interface RoundCardProps {
  round: Round;
}

const USDC_DECIMALS = 6;

function formatUSDC(value: string): string {
  const num = Number(formatUnits(BigInt(value), USDC_DECIMALS));
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateProgress(raised: string, target: string): number {
  const raisedNum = Number(raised);
  const targetNum = Number(target);
  if (targetNum === 0) return 0;
  return Math.min(Math.round((raisedNum / targetNum) * 100), 100);
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRoundStateLabel(state: number): { label: string; color: string } {
  switch (state) {
    case 0:
      return { label: 'Fundraising', color: 'bg-[#A2D5C6] text-black' };
    case 1:
      return { label: 'Completed', color: 'bg-blue-500 text-white' };
    case 2:
      return { label: 'Cancelled', color: 'bg-red-500 text-white' };
    default:
      return { label: 'Unknown', color: 'bg-gray-500 text-white' };
  }
}

function getRandomImage(id: string): string {
  const images = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
  ];
  const index = parseInt(id.slice(-4), 16) % images.length;
  return images[index];
}

export default function RoundCard({ round }: RoundCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const progress = calculateProgress(round.totalRaised, round.targetRaise);
  const stateInfo = getRoundStateLabel(round.state);
  const image = getRandomImage(round.id);
  const isActive = round.state === 0;

  return (
    <div
      className="group bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-[#A2D5C6]/15"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={round.companyName || 'Startup'}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-105' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* State Badge */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${stateInfo.color}`}>
          {stateInfo.label}
        </span>

        {/* APY Badge */}
        <span className="absolute top-3 right-3 bg-[#A2D5C6] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          6% APY
        </span>

        {/* Equity Badge */}
        {round.equityPercentage && (
          <span className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            {Number(round.equityPercentage) / 100}% Equity
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Founder */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#A2D5C6]/30 flex items-center justify-center">
            <Wallet className="h-3 w-3 text-[#A2D5C6]" />
          </div>
          <span className="text-sm text-white/60">{shortenAddress(round.founder)}</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-[#CFFFE2] transition-colors">
            {round.companyName || `Round ${shortenAddress(round.id)}`}
          </h3>
          <p className="text-sm text-white/60 line-clamp-2 mt-1">
            Fundraising round on FNDR platform
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-white">
              {formatUSDC(round.totalRaised)}
            </span>
            <span className="text-white/60">
              of {formatUSDC(round.targetRaise)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A2D5C6] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-white/40 text-right">
            {progress}% funded
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{round.investorCount} investors</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(Number(round.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          {isActive && (
            <button
              onClick={() => setIsInvestModalOpen(true)}
              className="flex-1 bg-[#A2D5C6] text-black text-center py-3 rounded-2xl font-semibold hover:bg-[#CFFFE2] transition-colors"
            >
              Invest Now
            </button>
          )}
          <a
            href={`https://sepolia.mantlescan.xyz/address/${round.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isActive ? 'flex-shrink-0 p-3' : 'flex-1 py-3'} flex items-center justify-center gap-2 border border-white/20 text-white/60 rounded-2xl hover:bg-white/5 hover:text-white transition-colors`}
          >
            <ExternalLink className="h-4 w-4" />
            {!isActive && 'View on Explorer'}
          </a>
        </div>
      </div>

      {/* Invest Modal */}
      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        roundId={round.id}
      />
    </div>
  );
}
