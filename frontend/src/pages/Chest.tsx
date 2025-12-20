import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LoadingScreen,
  LandingNavbar,
  HeroSection,
  ValuePropsSection,
  CrosswordSection,
  HowItWorksSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';
import investIcon from '@/assets/invest.png';
import yieldIcon from '@/assets/yield.png';
import custodyIcon from '@/assets/custody.png';
import trackIcon from '@/assets/track.png';
import tradeIcon from '@/assets/trade.png';
import instantIcon from '@/assets/instant.png';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const Chest = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Main content refs
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Scroll sections refs
  const howItWorksSectionRef = useRef<HTMLElement>(null);
  const howItWorksHeaderRef = useRef<HTMLDivElement>(null);
  const howItWorksTitleRef = useRef<HTMLHeadingElement>(null);
  const howItWorksCardsRef = useRef<HTMLDivElement>(null);
  const treasureRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);

  // CTA Section refs
  const ctaHeaderRef = useRef<HTMLDivElement>(null);
  const ctaTitleRef = useRef<HTMLHeadingElement>(null);

  // Value proposition card refs
  const valuePropsRef = useRef<HTMLElement>(null);
  const valuePropsHeaderRef = useRef<HTMLDivElement>(null);
  const valuePropsTitleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Crossword section refs
  const bentoSectionRef = useRef<HTMLElement>(null);
  const bentoGridRef = useRef<HTMLDivElement>(null);

  // Loading progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsLoading(false), 600);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  // Main content + scroll animations
  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Hero entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Get hero title words and subtitle
      const heroTitleWords = headlineRef.current?.querySelectorAll('.hero-title-word') || [];
      const heroSubtitle = subtitleRef.current;
      const heroButtons = buttonsRef.current?.children || [];

      // Set initial state for hero elements
      gsap.set(heroTitleWords, { y: 100, opacity: 0 });
      gsap.set(heroSubtitle, { y: 20, opacity: 0 });
      gsap.set(heroButtons, { y: 20, opacity: 0, scale: 0.9 });

      tl.fromTo(navRef.current, { y: -100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 });
      tl.fromTo(heroRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, '-=0.4');

      // Animate hero title words
      tl.to(heroTitleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: 'back.out(1.7)'
      }, '-=0.4');

      // Animate subtitle
      tl.to(heroSubtitle, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3');

      // Animate buttons with bounce
      tl.to(heroButtons, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: 'back.out(1.4)'
      }, '-=0.2');

      tl.fromTo(statsRef.current?.children || [], { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.2');

      // Value Proposition Section - Split text animation (word by word)
      const valuePropsTitleWords = valuePropsTitleRef.current?.querySelectorAll('.value-props-title-word') || [];
      const valuePropsSubtitleText = valuePropsHeaderRef.current?.querySelector('.value-props-subtitle-text');

      // Set initial state
      gsap.set(valuePropsTitleWords, { y: 100, opacity: 0 });
      gsap.set(valuePropsSubtitleText, { y: 20, opacity: 0 });

      // Animate words
      gsap.to(valuePropsTitleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: valuePropsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // Animate subtitle after title
      gsap.to(valuePropsSubtitleText, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: valuePropsRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // Value Proposition Cards - Stacking effect
      const numCards = cardRefs.current.filter(Boolean).length;
      const cardsContainer = valuePropsRef.current?.querySelector('.cards-container');

      if (cardsContainer) {
        const frontCardRotation = -4;
        const startRotation = 6;

        cardRefs.current.forEach((card, index) => {
          if (!card) return;
          if (index === 0) {
            gsap.set(card, { y: 0, rotation: frontCardRotation });
          } else {
            gsap.set(card, { y: '100vh', rotation: startRotation });
          }
        });

        const cardsTl = gsap.timeline({
          scrollTrigger: {
            trigger: cardsContainer,
            start: 'top top',
            end: `+=${(numCards - 1) * 100}%`,
            pin: true,
            scrub: true,
            pinSpacing: true,
          }
        });

        cardRefs.current.forEach((card, index) => {
          if (!card || index === 0) return;
          const position = (index - 1) / (numCards - 1);
          const duration = 1 / (numCards - 1);
          const cardRotation = index % 2 === 1 ? -frontCardRotation : frontCardRotation;

          cardsTl.to(card, {
            y: 0,
            rotation: cardRotation,
            duration: duration,
            ease: 'none',
          }, position);
        });
      }

      // Crossword Typography - Parallax effect on each letter
      const crosswordItems = bentoGridRef.current?.querySelectorAll('.crossword-item') || [];
      crosswordItems.forEach((item, index) => {
        const speed = 0.5 + (index % 3) * 0.3;
        gsap.fromTo(
          item,
          { y: 80 * speed, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top 100%',
              end: 'top 70%',
              scrub: true,
            }
          }
        );
      });

      // How It Works Section - Split text animation
      const titleWords = howItWorksTitleRef.current?.querySelectorAll('.title-word') || [];
      const subtitleText = howItWorksHeaderRef.current?.querySelector('.subtitle-text');

      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleText, { y: 20, opacity: 0 });

      gsap.to(titleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: howItWorksSectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      gsap.to(subtitleText, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: howItWorksSectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // Treasure chest - Float animation
      if (treasureRef.current) {
        gsap.to(treasureRef.current, {
          y: -15,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }

      // How It Works cards animation
      const howItWorksCards = howItWorksCardsRef.current?.children || [];
      gsap.fromTo(
        howItWorksCards,
        { opacity: 0, scale: 0.8, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: howItWorksCardsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // CTA Section - Split text animation
      const ctaTitleWords = ctaTitleRef.current?.querySelectorAll('.cta-title-word') || [];
      const ctaSubtitleText = ctaHeaderRef.current?.querySelector('.cta-subtitle-text');
      const ctaButtons = ctaHeaderRef.current?.querySelectorAll('button') || [];

      gsap.set(ctaTitleWords, { y: 100, opacity: 0 });
      gsap.set(ctaSubtitleText, { y: 20, opacity: 0 });
      gsap.set(ctaButtons, { y: 20, opacity: 0, scale: 0.9 });

      gsap.to(ctaTitleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: ctaSectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      gsap.to(ctaSubtitleText, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ctaSectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      gsap.to(ctaButtons, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        delay: 0.7,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: ctaSectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

    });

    return () => ctx.revert();
  }, [isLoading]);

  // How It Works cards data
  const howItWorksCardsData = [
    {
      icon: investIcon,
      bgColor: 'bg-[#CFFFE2]',
      hoverBgColor: 'bg-[#CFFFE2]',
      hoverTextColor: 'group-hover:text-[#000000]',
      hoverDescColor: 'group-hover:text-[#000000]/70',
      title: 'Invest',
      description: 'Browse verified startups and invest in tokenized equity with just a few clicks.'
    },
    {
      icon: yieldIcon,
      bgColor: 'bg-[#000000]',
      hoverBgColor: 'bg-[#000000]',
      hoverTextColor: 'group-hover:text-[#F6F6F6]',
      hoverDescColor: 'group-hover:text-[#F6F6F6]/70',
      title: 'Earn Yield',
      description: 'Your investment earns 6% APY from day one while waiting for startup milestones.'
    },
    {
      icon: custodyIcon,
      bgColor: 'bg-[#F6F6F6]',
      hoverBgColor: 'bg-[#F6F6F6]',
      hoverTextColor: 'group-hover:text-[#000000]',
      hoverDescColor: 'group-hover:text-[#000000]/70',
      title: 'Self-Custody',
      description: 'Full control of your funds. Your tokens stay in your wallet at all times.'
    },
    {
      icon: trackIcon,
      bgColor: 'bg-[#CFFFE2]',
      hoverBgColor: 'bg-[#CFFFE2]',
      hoverTextColor: 'group-hover:text-[#000000]',
      hoverDescColor: 'group-hover:text-[#000000]/70',
      title: 'Track',
      description: 'Monitor your portfolio performance and startup updates in real-time.'
    },
    {
      icon: tradeIcon,
      bgColor: 'bg-[#000000]',
      hoverBgColor: 'bg-[#000000]',
      hoverTextColor: 'group-hover:text-[#F6F6F6]',
      hoverDescColor: 'group-hover:text-[#F6F6F6]/70',
      title: 'Trade',
      description: 'Trade your equity tokens on secondary markets after the lock-up period.'
    },
    {
      icon: instantIcon,
      bgColor: 'bg-[#F6F6F6]',
      hoverBgColor: 'bg-[#F6F6F6]',
      hoverTextColor: 'group-hover:text-[#000000]',
      hoverDescColor: 'group-hover:text-[#000000]/70',
      title: 'Instant',
      description: 'Instant settlement on Mantle. Low fees, fast transactions, no middlemen.'
    },
  ];

  // Value proposition cards data
  const valuePropsData = [
    {
      quote: "Your investment works 24/7 — earning 6% APY while you sleep.",
      bg: 'bg-[#F6F6F6]',
      textColor: 'text-[#000000]',
    },
    {
      quote: "No more idle capital. Every dollar generates yield from minute one.",
      bg: 'bg-[#1a1a1a]',
      textColor: 'text-[#F6F6F6]',
    },
    {
      quote: "Trade your startup equity on a liquid secondary market after 180 days.",
      bg: 'bg-[#A2D5C6]',
      textColor: 'text-[#000000]',
    },
    {
      quote: "Transparent, on-chain fundraising. Every transaction verifiable.",
      bg: 'bg-[#000000]',
      textColor: 'text-[#CFFFE2]',
    },
  ];

  return (
    <div className="w-full relative overflow-x-hidden bg-[#000000]">
      {/* Marquee Animation Styles */}
      <style>{`
        .marquee-track {
          display: flex;
          width: max-content;
        }
        .marquee-track-left {
          animation: scrollLeft 15s linear infinite;
        }
        .marquee-track-right {
          animation: scrollRight 15s linear infinite;
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen
          loadingProgress={loadingProgress}
          onLoadingComplete={() => setIsLoading(false)}
        />
      )}

      {/* Fixed Navbar */}
      {!isLoading && <LandingNavbar ref={navRef} />}

      {/* Hero Section */}
      {!isLoading && (
        <HeroSection
          heroRef={heroRef}
          headlineRef={headlineRef}
          subtitleRef={subtitleRef}
          buttonsRef={buttonsRef}
          statsRef={statsRef}
        />
      )}

      {/* Value Proposition Cards - Stacking Parallax */}
      {!isLoading && (
        <ValuePropsSection
          ref={valuePropsRef}
          valuePropsHeaderRef={valuePropsHeaderRef}
          valuePropsTitleRef={valuePropsTitleRef}
          cardRefs={cardRefs}
          data={valuePropsData}
        />
      )}

      {/* Crossword Typography Section */}
      {!isLoading && (
        <CrosswordSection
          ref={bentoSectionRef}
          bentoGridRef={bentoGridRef}
        />
      )}

      {/* How It Works Section */}
      {!isLoading && (
        <HowItWorksSection
          ref={howItWorksSectionRef}
          howItWorksHeaderRef={howItWorksHeaderRef}
          howItWorksTitleRef={howItWorksTitleRef}
          howItWorksCardsRef={howItWorksCardsRef}
          treasureRef={treasureRef}
          cardsData={howItWorksCardsData}
        />
      )}

      {/* CTA Section */}
      {!isLoading && (
        <CTASection
          ref={ctaSectionRef}
          ctaHeaderRef={ctaHeaderRef}
          ctaTitleRef={ctaTitleRef}
        />
      )}

      {/* Footer */}
      {!isLoading && <LandingFooter />}
    </div>
  );
};

export default Chest;
