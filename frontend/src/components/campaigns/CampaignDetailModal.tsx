import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { Users, Clock, TrendingUp, BadgeCheck, X } from 'lucide-react';
import { formatCurrency, calculateProgress } from '@/lib/web3-config';

interface Campaign {
  id: string;
  name: string;
  tagline: string;
  description?: string;
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

interface CampaignDetailModalProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CampaignDetailModal({ campaign, open, onOpenChange }: CampaignDetailModalProps) {
  const [investAmount, setInvestAmount] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const progress = calculateProgress(campaign.raised, campaign.target);

  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const apyBadgeRef = useRef<HTMLSpanElement>(null);
  const founderRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const progressSectionRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const investSectionRef = useRef<HTMLDivElement>(null);
  const quickButtonsRef = useRef<HTMLDivElement>(null);

  // Handle open state changes
  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  // Entrance animations
  useEffect(() => {
    if (!open || !shouldRender) return;

    let ctx: gsap.Context | null = null;

    // Wait for Portal to render
    const timeoutId = setTimeout(() => {
      // Check if refs are available
      if (!containerRef.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Set initial states
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(containerRef.current, { scale: 0.9, opacity: 0, y: 30 });
        gsap.set(imageRef.current, { scale: 1.1 });
        gsap.set([badgesRef.current, apyBadgeRef.current], { y: -20, opacity: 0 });
        gsap.set(founderRef.current, { x: -20, opacity: 0 });
        gsap.set(titleRef.current, { y: 30, opacity: 0 });
        gsap.set(taglineRef.current, { y: 20, opacity: 0 });
        gsap.set(descriptionRef.current, { y: 20, opacity: 0 });
        gsap.set(progressSectionRef.current, { y: 30, opacity: 0 });
        gsap.set(progressBarRef.current, { scaleX: 0, transformOrigin: 'left' });
        gsap.set(investSectionRef.current, { y: 30, opacity: 0 });
        gsap.set(quickButtonsRef.current?.children || [], { y: 20, opacity: 0 });

        // Animate overlay
        tl.to(overlayRef.current, {
          opacity: 1,
          duration: 0.3
        });

        // Animate container
        tl.to(containerRef.current, {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'back.out(1.2)'
        }, '-=0.2');

        // Animate image zoom out
        tl.to(imageRef.current, {
          scale: 1,
          duration: 0.8,
          ease: 'power2.out'
        }, '-=0.2');

        // Animate badges
        tl.to([badgesRef.current, apyBadgeRef.current], {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.5)'
        }, '-=0.6');

        // Animate founder
        tl.to(founderRef.current, {
          x: 0,
          opacity: 1,
          duration: 0.4
        }, '-=0.3');

        // Animate title
        tl.to(titleRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.3)'
        }, '-=0.2');

        // Animate tagline
        tl.to(taglineRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.4
        }, '-=0.3');

        // Animate description
        tl.to(descriptionRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.4
        }, '-=0.2');

        // Animate progress section
        tl.to(progressSectionRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.5
        }, '-=0.2');

        // Animate progress bar fill
        tl.to(progressBarRef.current, {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out'
        }, '-=0.3');

        // Animate invest section
        tl.to(investSectionRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.4
        }, '-=0.4');

        // Animate quick buttons with stagger
        tl.to(quickButtonsRef.current?.children || [], {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: 'back.out(1.5)'
        }, '-=0.2');
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

    // Animate quick buttons out
    tl.to(quickButtonsRef.current?.children || [], {
      y: 10,
      opacity: 0,
      duration: 0.15,
      stagger: 0.02
    });

    // Animate invest section out
    tl.to(investSectionRef.current, {
      y: 15,
      opacity: 0,
      duration: 0.15
    }, '-=0.1');

    // Animate progress section out
    tl.to(progressSectionRef.current, {
      y: 15,
      opacity: 0,
      duration: 0.15
    }, '-=0.1');

    // Animate description, tagline, title out
    tl.to([descriptionRef.current, taglineRef.current, titleRef.current], {
      y: 10,
      opacity: 0,
      duration: 0.15,
      stagger: 0.02
    }, '-=0.1');

    // Animate founder out
    tl.to(founderRef.current, {
      x: -10,
      opacity: 0,
      duration: 0.15
    }, '-=0.1');

    // Animate badges out
    tl.to([badgesRef.current, apyBadgeRef.current], {
      y: -10,
      opacity: 0,
      duration: 0.15
    }, '-=0.1');

    // Animate container out
    tl.to(containerRef.current, {
      scale: 0.95,
      opacity: 0,
      y: 20,
      duration: 0.25,
      ease: 'power2.in'
    }, '-=0.1');

    // Animate overlay out
    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2
    }, '-=0.15');
  };

  const handleInvest = () => {
    // TODO: Implement investment logic
    console.log('Investing:', investAmount);
  };

  if (!shouldRender) return null;

  return (
    <DialogPrimitive.Root open={true} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogPrimitive.Portal forceMount>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          ref={overlayRef}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Content */}
        <DialogPrimitive.Content
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4"
        >
          {/* Glassmorphism Container */}
          <div ref={containerRef} className="relative bg-[#1A1A1A]/90 backdrop-blur-xl border border-[#A2D5C6]/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>

          {/* Hero Image */}
          <div ref={imageRef} className="relative h-48 md:h-56 overflow-hidden">
            <img
              src={campaign.image}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />

            {/* Category & APY Badges */}
            <div ref={badgesRef} className="absolute top-5 left-4 flex gap-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                {campaign.category}
              </span>
              {campaign.featured && (
                <span className="bg-[#CFFFE2] text-black text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>
            <span ref={apyBadgeRef} className="absolute top-5 right-16 bg-[#A2D5C6] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              {campaign.apy}% APY
            </span>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Founder & Title */}
            <div className="space-y-3">
              <div ref={founderRef} className="flex items-center gap-2">
                <img
                  src={campaign.founder.avatar}
                  alt={campaign.founder.name}
                  className="h-8 w-8 rounded-full object-cover border-2 border-[#A2D5C6]/30"
                />
                <span className="text-sm text-white/70">{campaign.founder.name}</span>
                {campaign.founder.verified && (
                  <BadgeCheck className="h-4 w-4 text-[#A2D5C6]" />
                )}
              </div>

              <DialogPrimitive.Title ref={titleRef} className="text-2xl md:text-3xl font-bold text-white">
                {campaign.name}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description ref={taglineRef} className="text-[#A2D5C6] font-medium">
                {campaign.tagline}
              </DialogPrimitive.Description>
            </div>

            {/* Description */}
            <p ref={descriptionRef} className="text-white/60 leading-relaxed">
              {campaign.description || campaign.tagline}
            </p>

            {/* Progress Section */}
            <div ref={progressSectionRef} className="bg-[#A2D5C6]/10 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.raised)}</p>
                  <p className="text-sm text-white/50">raised of {formatCurrency(campaign.target)}</p>
                </div>
                <p className="text-lg font-semibold text-[#A2D5C6]">{progress}%</p>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="h-full bg-gradient-to-r from-[#A2D5C6] to-[#CFFFE2] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-between pt-2">
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{campaign.investors} investors</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{campaign.daysLeft} days left</span>
                </div>
              </div>
            </div>

            {/* Investment Section */}
            <div className="space-y-4">
              <div ref={investSectionRef} className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-[#0A0A0A] border border-[#A2D5C6]/20 rounded-2xl pl-8 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A2D5C6]/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleInvest}
                  disabled={!investAmount}
                  className="px-8 py-3 bg-[#A2D5C6] text-black font-semibold rounded-2xl hover:bg-[#CFFFE2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invest Now
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div ref={quickButtonsRef} className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setInvestAmount(amount.toString())}
                    className="flex-1 py-3 bg-[#A2D5C6]/10 text-[#A2D5C6] text-sm font-medium rounded-2xl hover:bg-[#A2D5C6]/20 transition-colors"
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
