import { forwardRef } from 'react';
import SparkleBackground from '@/components/3d/SparkleBackground';

interface CrosswordSectionProps {
  bentoGridRef: React.RefObject<HTMLDivElement>;
}

const CrosswordSection = forwardRef<HTMLElement, CrosswordSectionProps>(
  ({ bentoGridRef }, ref) => {
    return (
      <section
        ref={ref}
        className="min-h-screen bg-[#000000] py-32 px-8 relative overflow-hidden flex items-center justify-center"
      >
        {/* 3D Sparkle Background */}
        <SparkleBackground />

        <div ref={bentoGridRef} className="relative z-10">
          {/* Crossword Container - using CSS Grid for precise alignment */}
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: 'repeat(11, 60px)',
              gridTemplateRows: 'repeat(8, 70px)',
            }}
          >
            {/* Row 1: I */}
            <div className="col-start-6 row-start-1 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#4988C4] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>I</span>
            </div>

            {/* Row 2: N */}
            <div className="col-start-6 row-start-2 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#4988C4] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>N</span>
            </div>

            {/* Row 3: V */}
            <div className="col-start-6 row-start-3 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#4988C4] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>V</span>
            </div>

            {/* Row 4: EARN */}
            <div className="col-start-6 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-[#1C4D8D] transition-all duration-300 hover:text-[#4988C4] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>E</span>
            </div>
            <div className="col-start-7 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>A</span>
            </div>
            <div className="col-start-8 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>R</span>
            </div>
            <div className="col-start-9 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>N</span>
            </div>

            {/* Row 5: GROWS */}
            <div className="col-start-2 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>G</span>
            </div>
            <div className="col-start-3 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>R</span>
            </div>
            <div className="col-start-4 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>O</span>
            </div>
            <div className="col-start-5 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>W</span>
            </div>
            <div className="col-start-6 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#4988C4] hover:scale-110">S</span>
            </div>

            {/* Row 6: TRADE */}
            <div className="col-start-6 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-[#1C4D8D] transition-all duration-300 hover:text-[#4988C4] hover:scale-110">T</span>
            </div>
            <div className="col-start-7 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>R</span>
            </div>
            <div className="col-start-8 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>A</span>
            </div>
            <div className="col-start-9 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>D</span>
            </div>
            <div className="col-start-10 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#1C4D8D' }}>E</span>
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-center text-[#F6F6F6]/50 text-lg max-w-md mx-auto">
            Four actions. One platform. <span className="text-[#1C4D8D]">Infinite possibilities.</span>
          </p>
          <p className="text-center text-[#F6F6F6]/50 text-lg max-w-md mx-auto">
            Backed the next unicorn.
          </p>
        </div>
      </section>
    );
  }
);

CrosswordSection.displayName = 'CrosswordSection';

export default CrosswordSection;
