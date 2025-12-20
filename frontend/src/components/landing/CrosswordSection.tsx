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
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#A2D5C6] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>I</span>
            </div>

            {/* Row 2: N */}
            <div className="col-start-6 row-start-2 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#A2D5C6] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>N</span>
            </div>

            {/* Row 3: V */}
            <div className="col-start-6 row-start-3 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#A2D5C6] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>V</span>
            </div>

            {/* Row 4: EARN */}
            <div className="col-start-6 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-[#A2D5C6] transition-all duration-300 hover:text-[#A2D5C6] hover:scale-110" style={{ textShadow: '0 0 30px rgba(162, 213, 198, 0.3)' }}>E</span>
            </div>
            <div className="col-start-7 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>A</span>
            </div>
            <div className="col-start-8 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>R</span>
            </div>
            <div className="col-start-9 row-start-4 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>N</span>
            </div>

            {/* Row 5: GROWS */}
            <div className="col-start-2 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#CFFFE2' }}>G</span>
            </div>
            <div className="col-start-3 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#CFFFE2' }}>R</span>
            </div>
            <div className="col-start-4 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#CFFFE2' }}>O</span>
            </div>
            <div className="col-start-5 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#CFFFE2' }}>W</span>
            </div>
            <div className="col-start-6 row-start-5 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-white transition-all duration-300 hover:text-[#FFD700] hover:scale-110">S</span>
            </div>

            {/* Row 6: TRADE */}
            <div className="col-start-6 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black text-[#A2D5C6] transition-all duration-300 hover:text-[#A2D5C6] hover:scale-110">T</span>
            </div>
            <div className="col-start-7 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>R</span>
            </div>
            <div className="col-start-8 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>A</span>
            </div>
            <div className="col-start-9 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>D</span>
            </div>
            <div className="col-start-10 row-start-6 flex items-center justify-center">
              <span className="crossword-item text-6xl md:text-7xl font-black transition-all duration-300 hover:scale-110" style={{ color: '#A2D5C6' }}>E</span>
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-center text-[#F6F6F6]/50 text-lg max-w-md mx-auto">
            Four actions. One platform. <span className="text-[#A2D5C6]">Infinite possibilities.</span>
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
