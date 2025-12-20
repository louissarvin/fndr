import { useState } from 'react';
import { Users, Clock, TrendingUp, BadgeCheck } from 'lucide-react';
import { formatCurrency, calculateProgress } from '@/lib/web3-config';
import CampaignDetailModal from './CampaignDetailModal';

interface Campaign {
  id: string;
  name: string;
  tagline: string;
  category: string;
  image: string;
  raised: number;
  target: number;
  investors: number;
  daysLeft: number;
  apy: number;
  founder: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  featured?: boolean;
}

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const progress = calculateProgress(campaign.raised, campaign.target);

  return (
    <>
      <CampaignDetailModal
        campaign={campaign}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    <div className="group bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer ">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={campaign.image}
          alt={campaign.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
          {campaign.category}
        </span>

        {/* APY Badge */}
        <span className="absolute top-3 right-3 bg-[#A2D5C6] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {campaign.apy}% APY
        </span>

        {/* Featured Badge */}
        {campaign.featured && (
          <span className="absolute bottom-3 left-3 bg-[#CFFFE2] text-black text-xs font-bold px-3 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Founder */}
        <div className="flex items-center gap-2">
          <img
            src={campaign.founder.avatar}
            alt={campaign.founder.name}
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-sm text-white/60">{campaign.founder.name}</span>
          {campaign.founder.verified && (
            <BadgeCheck className="h-4 w-4 text-[#A2D5C6]" />
          )}
        </div>

        {/* Title & Tagline */}
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-[#CFFFE2] transition-colors">
            {campaign.name}
          </h3>
          <p className="text-sm text-white/60 line-clamp-2 mt-1">
            {campaign.tagline}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-white">
              {formatCurrency(campaign.raised)}
            </span>
            <span className="text-white/60">
              of {formatCurrency(campaign.target)}
            </span>
          </div>
          {/* Custom Progress Bar */}
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
            <span>{campaign.investors} investors</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{campaign.daysLeft} days left</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="block w-full bg-[#A2D5C6] text-black text-center py-3 rounded-2xl font-semibold hover:bg-[#CFFFE2] transition-colors"
        >
          View Startup
        </button>
      </div>
    </div>
    </>
  );
}
