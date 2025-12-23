import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import TreasureChest from '@/components/3d/TreasureChest';

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement>;
  headlineRef: React.RefObject<HTMLHeadingElement>;
  subtitleRef: React.RefObject<HTMLParagraphElement>;
  buttonsRef: React.RefObject<HTMLDivElement>;
  statsRef: React.RefObject<HTMLDivElement>;
}

const HeroSection = forwardRef<HTMLElement, HeroSectionProps>(
  ({ heroRef, headlineRef, subtitleRef, buttonsRef, statsRef }, _) => {
    return (
      <section className="h-screen relative">
        <div className="absolute inset-0">
          <TreasureChest stage="opened" onChestClick={() => {}} />
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="pointer-events-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
            <div ref={heroRef} className="bg-[#000000]/40 backdrop-blur-sm rounded-3xl px-36 py-24 opacity-0 w-[1280px]">
              <h1 ref={headlineRef} className="text-6xl font-extrabold tracking-tight mb-6 text-white overflow-hidden flex justify-center flex-wrap gap-x-4">
                {'A new financial layer for startup ownership'.split(' ').map((word, i) => (
                  <span key={i} className="inline-block hero-title-word">{word}</span>
                ))}
              </h1>
              <p ref={subtitleRef} className="text-xl text-[#F6F6F6]/60 mb-10 hero-subtitle-text">
                Tokenized startup equity with on-chain yield — built on Mantle.
              </p>
              <div ref={buttonsRef} className="flex space-x-6 justify-center mb-12">
                <Link to="/browse" className="bg-[#A2D5C6] text-[#000000] px-8 py-3 rounded-full text-lg font-semibold hover:bg-[#CFFFE2] hover:scale-105 hover:-translate-y-1 transition-all duration-300 opacity-0">
                  Explore startups
                </Link>
                <Link to="/founder" className="bg-transparent text-[#A2D5C6] px-8 py-3 rounded-full text-lg font-semibold border-2 border-[#A2D5C6] hover:bg-[#A2D5C6]/10 hover:border-[#CFFFE2] hover:text-[#CFFFE2] hover:scale-105 hover:-translate-y-1 transition-all duration-300 opacity-0">
                  Tokenize your startup
                </Link>
              </div>

              <div ref={statsRef} className="flex justify-center space-x-32 pt-8">
                <div className="text-center opacity-0">
                  <div className="text-4xl font-bold text-[#CFFFE2]">$2.5M+</div>
                  <div className="text-sm text-[#F6F6F6]/60 mt-1">Total Raised</div>
                </div>
                <div className="text-center opacity-0">
                  <div className="text-4xl font-bold text-[#CFFFE2]">127</div>
                  <div className="text-sm text-[#F6F6F6]/60 mt-1">Active Campaigns</div>
                </div>
                <div className="text-center opacity-0">
                  <div className="text-4xl font-bold text-[#CFFFE2]">6%</div>
                  <div className="text-sm text-[#F6F6F6]/60 mt-1">Guaranteed Yield</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

HeroSection.displayName = 'HeroSection';

export default HeroSection;
