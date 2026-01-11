import { ReactNode } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useFounderProfileURI, useHasFounderProfile } from '@/hooks/useContracts';
import { useFounderProfileMetadata, ipfsToHttp } from '@/hooks/useIPFS';
import { Loader2, User, Linkedin, BadgeCheck } from 'lucide-react';

interface FounderHoverCardProps {
  founderAddress: `0x${string}`;
  children: ReactNode;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function FounderHoverCard({ founderAddress, children }: FounderHoverCardProps) {
  const { data: hasProfile, isLoading: isCheckingProfile } = useHasFounderProfile(founderAddress);
  const { data: profileURI, isLoading: isLoadingURI } = useFounderProfileURI(founderAddress);
  const { data: profile, isLoading: isLoadingProfile } = useFounderProfileMetadata(profileURI);

  const isLoading = isCheckingProfile || isLoadingURI || isLoadingProfile;
  const profileImageUrl = profile?.profileImage ? ipfsToHttp(profile.profileImage) : null;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardPrimitive.Portal>
        <HoverCardContent
          className="w-72 bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#2A2A2A] rounded-xl p-4 z-[100]"
          side="bottom"
          align="start"
          sideOffset={8}
        >
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#4988C4]" />
          </div>
        ) : hasProfile && profile ? (
          <div className="space-y-3">
            {/* Header with image and name */}
            <div className="flex items-start gap-3">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center border-2 border-[#4988C4]/30">
                  <User className="h-5 w-5 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-white truncate">{profile.name}</h4>
                  <BadgeCheck className="h-4 w-4 text-[#4988C4] flex-shrink-0" />
                </div>
                <p className="text-sm text-[#4988C4] truncate">{profile.title}</p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-white/60 line-clamp-3">{profile.bio}</p>

            {/* Social Links */}
            {(profile.linkedin || profile.twitter) && (
              <div className="flex items-center gap-2 pt-1">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-[#4988C4] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter.startsWith('http') ? profile.twitter : `https://x.com/${profile.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-[#4988C4] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>{profile.twitter.startsWith('@') ? profile.twitter : `@${profile.twitter}`}</span>
                  </a>
                )}
              </div>
            )}

            {/* Address */}
            <div className="pt-1 border-t border-white/10">
              <p className="text-xs text-white/30 font-mono">{shortenAddress(founderAddress)}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center mx-auto mb-2">
              <User className="h-4 w-4 text-white/40" />
            </div>
            <p className="text-sm text-white/60 font-mono">{shortenAddress(founderAddress)}</p>
            <p className="text-xs text-white/40 mt-1">No profile set</p>
          </div>
        )}
        </HoverCardContent>
      </HoverCardPrimitive.Portal>
    </HoverCard>
  );
}
