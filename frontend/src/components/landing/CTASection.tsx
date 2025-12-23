import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import SparkleBackground from '@/components/3d/SparkleBackground';
import FloatingTokensArc from '@/components/3d/FloatingTokensArc';

interface CTASectionProps {
  ctaHeaderRef: React.RefObject<HTMLDivElement>;
  ctaTitleRef: React.RefObject<HTMLHeadingElement>;
}

const CTASection = forwardRef<HTMLElement, CTASectionProps>(
  ({ ctaHeaderRef, ctaTitleRef }, ref) => {
    return (
      <section
        ref={ref}
        className="relative bg-[#000000] overflow-hidden"
      >
        {/* 3D Sparkle Background */}
        <SparkleBackground />
        <div className="relative h-screen flex items-center justify-center">
          {/* Floating Tokens Arc - Three.js with shader for transparent backgrounds */}
          <FloatingTokensArc />

          {/* Header - Centered, in front of the cards */}
          <div ref={ctaHeaderRef} className="relative z-30 text-center pointer-events-none px-8">
            <h2 ref={ctaTitleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-4">
              {'Ready to Start Earning?'.split(' ').map((word, i) => (
                <span key={i} className="inline-block cta-title-word">{word}</span>
              ))}
            </h2>
            <p className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto mb-8 cta-subtitle-text">
              Join thousands of investors already earning yield while supporting the next generation of startups.
            </p>
            <div className="flex justify-center gap-4 pointer-events-auto">
              <Link to="/browse" className="bg-[#A2D5C6] text-[#000000] px-8 py-3 rounded-full text-lg font-semibold hover:bg-[#CFFFE2] hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                Launch App
              </Link>
              <Link to="/browse" className="bg-transparent text-[#A2D5C6] px-8 py-3 rounded-full text-lg font-semibold border-2 border-[#A2D5C6] hover:bg-[#A2D5C6]/10 hover:border-[#CFFFE2] hover:text-[#CFFFE2] hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

CTASection.displayName = 'CTASection';

export default CTASection;
