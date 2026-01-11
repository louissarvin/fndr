import { forwardRef } from 'react';
import SparkleBackground from '@/components/3d/SparkleBackground';
import treasureImg from '@/assets/treasure.png';
import anthropicToken from '@/assets/antrophic-token.png';
import openaiToken from '@/assets/openai-token.png';
import xaiToken from '@/assets/xai-token.png';
import anthropicLogo from '@/assets/antrophic.png';
import openaiLogo from '@/assets/openai.png';
import xaiLogo from '@/assets/xai.png';

interface HowItWorksCard {
  icon: string;
  bgColor: string;
  hoverBgColor: string;
  hoverTextColor: string;
  hoverDescColor: string;
  title: string;
  description: string;
}

interface HowItWorksSectionProps {
  howItWorksHeaderRef: React.RefObject<HTMLDivElement>;
  howItWorksTitleRef: React.RefObject<HTMLHeadingElement>;
  howItWorksCardsRef: React.RefObject<HTMLDivElement>;
  treasureRef: React.RefObject<HTMLDivElement>;
  cardsData: HowItWorksCard[];
}

const HowItWorksSection = forwardRef<HTMLElement, HowItWorksSectionProps>(
  ({ howItWorksHeaderRef, howItWorksTitleRef, howItWorksCardsRef, treasureRef, cardsData }, ref) => {
    return (
      <section
        id="how-it-works"
        ref={ref}
        className="relative bg-[#000000] py-24 px-8 overflow-hidden"
      >
        {/* 3D Sparkle Background */}
        <SparkleBackground />
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div ref={howItWorksHeaderRef} className="text-center mb-12">
            <h2 ref={howItWorksTitleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center gap-4">
              {'How It Works'.split(' ').map((word, i) => (
                <span key={i} className="inline-block title-word">{word}</span>
              ))}
            </h2>
            <p className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto subtitle-text">
              Revolutionary yield-enhanced fundraising that benefits everyone.
            </p>
          </div>

          {/* Main Container Card - white glassmorphism */}
          <div className="bg-[#F6F6F6]/20 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg">
            {/* Marquee Section - white glassmorphism */}
            <div className="bg-[#4988C4]/40 backdrop-blur-md rounded-[1.5rem] py-8 mb-4 overflow-hidden relative h-[200px]">
              {/* Center Treasure Illustration - positioned absolutely */}
              <div ref={treasureRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <img src={treasureImg} alt="Treasure" className="w-72 h-auto drop-shadow-2xl treasure-img" />
              </div>

              {/* Left side - Token images */}
              <div className="absolute left-0 top-0 bottom-0 w-[45%] overflow-hidden flex items-center">
                <div className="w-full overflow-hidden">
                  <div className="marquee-track marquee-track-left">
                    <div className="flex gap-8 pr-8 items-center">
                      <img src={anthropicToken} alt="Anthropic" className="w-32 h-32 object-contain" />
                      <img src={openaiToken} alt="OpenAI" className="w-32 h-32 object-contain" />
                      <img src={xaiToken} alt="xAI" className="w-32 h-32 object-contain" />
                      <img src={anthropicToken} alt="Anthropic" className="w-32 h-32 object-contain" />
                      <img src={openaiToken} alt="OpenAI" className="w-32 h-32 object-contain" />
                      <img src={xaiToken} alt="xAI" className="w-32 h-32 object-contain" />
                    </div>
                    <div className="flex gap-8 pr-8 items-center">
                      <img src={anthropicToken} alt="Anthropic" className="w-32 h-32 object-contain" />
                      <img src={openaiToken} alt="OpenAI" className="w-32 h-32 object-contain" />
                      <img src={xaiToken} alt="xAI" className="w-32 h-32 object-contain" />
                      <img src={anthropicToken} alt="Anthropic" className="w-32 h-32 object-contain" />
                      <img src={openaiToken} alt="OpenAI" className="w-32 h-32 object-contain" />
                      <img src={xaiToken} alt="xAI" className="w-32 h-32 object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Logo images */}
              <div className="absolute right-0 top-0 bottom-0 w-[45%] overflow-hidden flex items-center">
                <div className="w-full overflow-hidden">
                  <div className="marquee-track marquee-track-left">
                    <div className="flex gap-8 pr-8 items-center">
                      <img src={openaiLogo} alt="OpenAI" className="w-20 h-20 object-contain" />
                      <img src={xaiLogo} alt="xAI" className="w-20 h-20 object-contain" />
                      <img src={anthropicLogo} alt="Anthropic" className="w-20 h-20 object-contain" />
                      <img src={openaiLogo} alt="OpenAI" className="w-20 h-20 object-contain" />
                      <img src={xaiLogo} alt="xAI" className="w-20 h-20 object-contain" />
                      <img src={anthropicLogo} alt="Anthropic" className="w-20 h-20 object-contain" />
                    </div>
                    <div className="flex gap-8 pr-8 items-center">
                      <img src={openaiLogo} alt="OpenAI" className="w-20 h-20 object-contain" />
                      <img src={xaiLogo} alt="xAI" className="w-20 h-20 object-contain" />
                      <img src={anthropicLogo} alt="Anthropic" className="w-20 h-20 object-contain" />
                      <img src={openaiLogo} alt="OpenAI" className="w-20 h-20 object-contain" />
                      <img src={xaiLogo} alt="xAI" className="w-20 h-20 object-contain" />
                      <img src={anthropicLogo} alt="Anthropic" className="w-20 h-20 object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards Grid - 2x3 glassmorphism with wipe animation */}
            <div ref={howItWorksCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cardsData.map((item, index) => (
                <div
                  key={index}
                  className="feature-card group bg-[#4988C4]/40 backdrop-blur-md rounded-2xl p-5 cursor-pointer relative overflow-hidden"
                >
                  {/* Wipe fill background - expands from icon circle on hover */}
                  <div
                    className={`absolute inset-0 ${item.hoverBgColor} rounded-2xl transition-transform duration-500 ease-out scale-0 group-hover:scale-100`}
                    style={{ transformOrigin: '3.25rem 3.25rem' }}
                  />

                  {/* Content - stays above the wipe */}
                  <div className="relative z-10">
                    {/* Icon circle - fades out on hover */}
                    <div className={`w-12 h-12 ${item.bgColor} rounded-full flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-0`}>
                      <img src={item.icon} alt={item.title} className="w-12 h-12 object-contain" />
                    </div>
                    {/* Text content - moves up on hover */}
                    <div className="transition-transform duration-500 group-hover:-translate-y-12">
                      <h3 className={`text-lg font-bold text-white mb-2 transition-colors duration-500 ${item.hoverTextColor}`}>{item.title}</h3>
                      <p className={`text-sm text-white/60 leading-relaxed transition-colors duration-500 ${item.hoverDescColor}`}>{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

HowItWorksSection.displayName = 'HowItWorksSection';

export default HowItWorksSection;
