import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import anthropicToken from '@/assets/antrophic-token.png';
import openaiToken from '@/assets/openai-token.png';
import xaiToken from '@/assets/xai-token.png';
import usdcToken from '@/assets/usdc-transparent.png';
import usdtToken from '@/assets/usdt-transparent.png';

interface LoadingScreenProps {
  loadingProgress: number;
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ loadingProgress, onLoadingComplete }: LoadingScreenProps) => {
  const loadingRef = useRef<HTMLDivElement>(null);
  const loadingLogoRef = useRef<HTMLDivElement>(null);
  const loadingTextRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        loadingLogoRef.current,
        { scale: 0.8, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
      );

      gsap.fromTo(
        loadingTextRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3 }
      );

      gsap.to(loadingLogoRef.current, {
        scale: 1.05,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });

    return () => ctx.revert();
  }, []);

  const tokens = [
    { src: anthropicToken, alt: 'Anthropic', angle: 0 },
    { src: openaiToken, alt: 'OpenAI', angle: 72 },
    { src: xaiToken, alt: 'xAI', angle: 144 },
    { src: usdcToken, alt: 'USDC', angle: 216 },
    { src: usdtToken, alt: 'USDT', angle: 288 },
  ];

  return (
    <div
      ref={loadingRef}
      className="fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Layer 1: Converging particles from all directions */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const startAngle = (i / 40) * 2 * Math.PI + (i * 0.3);
          const startDistance = 500 + Math.random() * 300;
          const startX = Math.cos(startAngle) * startDistance;
          const startY = Math.sin(startAngle) * startDistance;
          const progress = loadingProgress / 100;
          const currentX = startX * (1 - progress);
          const currentY = startY * (1 - progress);
          const size = 2 + Math.random() * 3;

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: i % 3 === 0 ? '#1C4D8D' : i % 3 === 1 ? '#4988C4' : '#FFD700',
                transform: `translate(-50%, -50%) translate(${currentX}px, ${currentY}px)`,
                opacity: 0.1 + progress * 0.5,
                transition: 'transform 0.5s ease-out, opacity 0.3s ease',
                boxShadow: `0 0 ${6 + progress * 12}px ${i % 3 === 2 ? 'rgba(255, 215, 0, 0.5)' : 'rgba(28, 77, 141, 0.5)'}`,
                filter: `blur(${(1 - progress) * 1.5}px)`
              }}
            />
          );
        })}
      </div>

      {/* Layer 2: Orbiting tokens - 5 tokens at 72° intervals */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative w-72 h-72"
          style={{
            animation: `orbit ${6 - loadingProgress * 0.03}s linear infinite`
          }}
        >
          {tokens.map((token, index) => (
            <div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `rotate(${token.angle}deg) translateY(-144px) rotate(-${token.angle}deg)`,
                marginLeft: '-20px',
                marginTop: '-20px'
              }}
            >
              <img
                src={token.src}
                alt={token.alt}
                className="w-10 h-10 object-contain"
                style={{
                  animation: `counterOrbit ${6 - loadingProgress * 0.03}s linear infinite`,
                  filter: `drop-shadow(0 0 ${8 + loadingProgress * 0.15}px rgba(28, 77, 141, 0.6))`,
                  opacity: 0.7 + loadingProgress * 0.003
                }}
              />
            </div>
          ))}
        </div>

        {/* Orbit trail ring */}
        <div
          className="absolute w-72 h-72 rounded-full border border-[#4988C4]/20"
          style={{
            boxShadow: `0 0 ${15 + loadingProgress * 0.3}px rgba(28, 77, 141, ${0.1 + loadingProgress * 0.004})`
          }}
        />
      </div>

      {/* Layer 3: Central energy core */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: `${60 + loadingProgress * 0.8}px`,
          height: `${60 + loadingProgress * 0.8}px`,
          background: `radial-gradient(circle, rgba(73, 136, 196, ${loadingProgress * 0.006}) 0%, transparent 70%)`,
          boxShadow: `0 0 ${loadingProgress * 0.8}px rgba(28, 77, 141, ${loadingProgress * 0.008})`,
          transition: 'all 0.3s ease'
        }}
      />

      {/* Layer 4: Morphing Logo - Center */}
      <div className="flex flex-col items-center relative z-10">
        <div
          ref={loadingLogoRef}
          className="opacity-0 relative mb-6"
          style={{
            filter: `drop-shadow(0 0 ${loadingProgress * 0.3}px rgba(28, 77, 141, ${loadingProgress * 0.006}))`
          }}
        >
          {/* Logo letters assembling - F N D R */}
          <div className="flex items-center gap-1 text-6xl font-bold">
            <span
              className="inline-block transition-all duration-700"
              style={{
                opacity: loadingProgress >= 5 ? 1 : 0,
                transform: `translateY(${loadingProgress >= 5 ? 0 : -40}px) rotate(${loadingProgress >= 5 ? 0 : -180}deg)`,
                color: '#4988C4'
              }}
            >
              ✦
            </span>
            <span
              className="inline-block transition-all duration-700"
              style={{
                opacity: loadingProgress >= 20 ? 1 : 0,
                transform: `translateX(${loadingProgress >= 20 ? 0 : -25}px)`,
                color: '#FFFFFF'
              }}
            >
              f
            </span>
            <span
              className="inline-block transition-all duration-700"
              style={{
                opacity: loadingProgress >= 35 ? 1 : 0,
                transform: `translateY(${loadingProgress >= 35 ? 0 : 25}px)`,
                color: '#FFFFFF'
              }}
            >
              n
            </span>
            <span
              className="inline-block transition-all duration-700"
              style={{
                opacity: loadingProgress >= 50 ? 1 : 0,
                transform: `scale(${loadingProgress >= 50 ? 1 : 0.3})`,
                color: '#FFFFFF'
              }}
            >
              d
            </span>
            <span
              className="inline-block transition-all duration-700"
              style={{
                opacity: loadingProgress >= 65 ? 1 : 0,
                transform: `translateX(${loadingProgress >= 65 ? 0 : 25}px)`,
                color: '#FFFFFF'
              }}
            >
              r
            </span>
          </div>

          {/* Underline that grows */}
          <div
            className="h-0.5 bg-gradient-to-r from-[#4988C4] to-[#1C4D8D] rounded-full mt-1 mx-auto transition-all duration-500"
            style={{
              width: `${Math.min(loadingProgress * 1.2, 100)}%`,
              opacity: loadingProgress >= 15 ? 1 : 0
            }}
          />
        </div>

        {/* Progress text */}
        <div ref={loadingTextRef} className="opacity-0 flex flex-col items-center">
          <div
            className="text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #4988C4 0%, #1C4D8D 50%, #4988C4 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 2s ease infinite'
            }}
          >
            {loadingProgress}%
          </div>
          <div className="text-[#F6F6F6]/40 text-xs tracking-widest uppercase">
            {loadingProgress < 20 && 'Initializing...'}
            {loadingProgress >= 20 && loadingProgress < 40 && 'Assembling...'}
            {loadingProgress >= 40 && loadingProgress < 60 && 'Connecting...'}
            {loadingProgress >= 60 && loadingProgress < 80 && 'Syncing...'}
            {loadingProgress >= 80 && loadingProgress < 95 && 'Almost Ready...'}
            {loadingProgress >= 95 && 'Launching!'}
          </div>
        </div>
      </div>

      {/* Outer pulsing rings */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4988C4]/10 pointer-events-none"
        style={{
          width: `${320 - loadingProgress * 0.5}px`,
          height: `${320 - loadingProgress * 0.5}px`,
          animation: 'ringPulse 2s ease-in-out infinite'
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1C4D8D]/5 pointer-events-none"
        style={{
          width: `${380 - loadingProgress * 0.8}px`,
          height: `${380 - loadingProgress * 0.8}px`,
          animation: 'ringPulse 2s ease-in-out infinite 0.5s'
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes counterOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.03); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
