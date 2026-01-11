import { useState } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  Wallet,
  ExternalLink,
  Loader2,
  Bot,
} from "lucide-react";
import { formatUnits } from "viem";
import type { Round } from "@/hooks/usePonderData";
import { useRoundMetadata, ipfsToHttp } from "@/hooks/useIPFS";
import InvestModal from "@/components/investor/InvestModal";
import FounderHoverCard from "@/components/founder/FounderHoverCard";
import { useAI } from "@/components/ai/AIContext";
import { calculateCredibilityScore } from "@/lib/credibilityScore";

interface RoundCardProps {
  round: Round;
}

const USDC_DECIMALS = 6;

// Fallback images when no IPFS image is available
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
];

function formatUSDC(value: string): string {
  const num = Number(formatUnits(BigInt(value), USDC_DECIMALS));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
      return { label: "Fundraising", color: "bg-[#4988C4] text-black" };
    case 1:
      return { label: "Completed", color: "bg-[#4988C4] text-black" };
    case 2:
      return { label: "Cancelled", color: "bg-[#4988C4] text-black" };
    default:
      return { label: "Unknown", color: "bg-[#4988C4] text-black" };
  }
}

function getFallbackImage(id: string): string {
  const index = parseInt(id.slice(-4), 16) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export default function RoundCard({ round }: RoundCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const { openWithRound } = useAI();

  // Fetch IPFS metadata
  const { data: metadata, isLoading: isLoadingMetadata } = useRoundMetadata(
    round.metadataURI
  );

  const progress = calculateProgress(round.totalRaised, round.targetRaise);
  const stateInfo = getRoundStateLabel(round.state);
  const isActive = round.state === 0;
  const credibility = calculateCredibilityScore(round);

  // Get image: IPFS logo > fallback
  const logoUrl = metadata?.logo ? ipfsToHttp(metadata.logo) : null;
  const image = logoUrl || getFallbackImage(round.id);

  // Get company name: metadata > indexed > shortened address
  const companyName =
    metadata?.name || round.companyName || `Round ${shortenAddress(round.id)}`;
  const description =
    metadata?.description || "Fundraising round on FNDR platform";

  return (
    <div
      className="group bg-[#4988C4]/10 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        {isLoadingMetadata ? (
          <div className="w-full h-full bg-[#4988C4]/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#4988C4]/40" />
          </div>
        ) : (
          <img
            src={image}
            alt={companyName}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : ""
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* State Badge */}
        <span
          className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${stateInfo.color}`}
        >
          {stateInfo.label}
        </span>

        {/* APY Badge */}
        <span className="absolute top-3 right-3 bg-[#4988C4] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          6% APY
        </span>

        {/* Equity Badge */}
        {round.equityPercentage && (
          <span className="absolute bottom-3 left-3 bg-[#4988C4] backdrop-blur-sm text-black text-xs font-bold px-3 py-1 rounded-full">
            {Number(round.equityPercentage) / 100}% Equity
          </span>
        )}

        {/* Credibility Score Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <span className={`${credibility.color} text-xs font-bold px-2 py-1 rounded-full`}>
            {credibility.score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Founder */}
        <div className="flex items-center justify-between">
          <FounderHoverCard founderAddress={round.founder as `0x${string}`}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-6 w-6 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-[#4988C4]" />
              </div>
              <span className="text-sm text-white/60">
                {shortenAddress(round.founder)}
              </span>
            </div>
          </FounderHoverCard>
          <a
            href={`https://sepolia.arbiscan.io/address/${round.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/40 hover:text-white transition-all"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-bold text-lg text-white transition-colors">
            {companyName}
          </h3>
          <p className="text-sm text-white/60 line-clamp-2 mt-1">
            {description}
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
              className="h-full bg-[#4988C4] rounded-full transition-all duration-500"
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
              className="flex-1 bg-[#4988C4] text-black text-center py-3 rounded-2xl font-semibold hover:bg-[#1C4D8D] transition-colors"
            >
              Invest Now
            </button>
          )}
          <button
            onClick={() => openWithRound(round)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-colors"
            title="AI Analysis"
          >
            <Bot className="h-4 w-4" />
          </button>
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
