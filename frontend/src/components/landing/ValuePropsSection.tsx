import { forwardRef } from 'react';
import SparkleBackground from '@/components/3d/SparkleBackground';

interface ValuePropItem {
  quote: string;
  bg: string;
  textColor: string;
}

interface ValuePropsSectionProps {
  valuePropsHeaderRef: React.RefObject<HTMLDivElement>;
  valuePropsTitleRef: React.RefObject<HTMLHeadingElement>;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  data: ValuePropItem[];
}

const ValuePropsSection = forwardRef<HTMLElement, ValuePropsSectionProps>(
  ({ valuePropsHeaderRef, valuePropsTitleRef, cardRefs, data }, ref) => {
    return (
      <section
        ref={ref}
        className="relative bg-[#000000] overflow-hidden"
      >
        {/* 3D Sparkle Background */}
        <SparkleBackground />

        {/* Section Header */}
        <div ref={valuePropsHeaderRef} className="text-center pt-24 pb-8 relative z-10">
          <h2 ref={valuePropsTitleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-x-4">
            {'Why startup capital needs an upgrade?'.split(' ').map((word, i) => (
              <span key={i} className="inline-block value-props-title-word">{word}</span>
            ))}
          </h2>
          <p className="text-lg md:text-xl text-[#F6F6F6]/60 max-w-2xl mx-auto value-props-subtitle-text">
            Where every investment generates yield from day one, and startup equity becomes truly liquid.
          </p>
        </div>

        <div className="cards-container h-screen w-full flex items-center justify-center relative z-10">
          {data.map((item, index) => (
            <div
              key={index}
              ref={(el) => { cardRefs.current[index] = el; }}
              className={`value-card absolute ${item.bg} rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 md:p-16 lg:p-20`}
              style={{
                width: 'calc(100% - 4rem)',
                maxWidth: '900px',
                minHeight: '400px',
                zIndex: index + 1,
              }}
            >
              <p className={`text-2xl md:text-4xl lg:text-5xl font-black leading-tight text-center ${item.textColor}`}>
                {item.quote}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }
);

ValuePropsSection.displayName = 'ValuePropsSection';

export default ValuePropsSection;
