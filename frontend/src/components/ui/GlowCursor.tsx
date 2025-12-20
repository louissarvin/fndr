import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function GlowCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorTrailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const trail = cursorTrailRef.current;

    if (!cursor || !trail) return;

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      // Main cursor - follows instantly
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
      });

      // Trail - follows with delay for smooth effect
      gsap.to(trail, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    // Scale up on hover over interactive elements
    const onMouseEnter = () => {
      gsap.to(cursor, {
        scale: 1.5,
        duration: 0.3,
      });
      gsap.to(trail, {
        scale: 1.8,
        opacity: 0.3,
        duration: 0.3,
      });
    };

    const onMouseLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        duration: 0.3,
      });
      gsap.to(trail, {
        scale: 1,
        opacity: 0.15,
        duration: 0.3,
      });
    };

    // Add listeners
    window.addEventListener('mousemove', onMouseMove);

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <>
      {/* Main glowing cursor */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '20px',
          height: '20px',
          background: 'radial-gradient(circle, rgba(207,255,226,0.9) 0%, rgba(162,213,198,0.6) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />

      {/* Trailing glow effect */}
      <div
        ref={cursorTrailRef}
        className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(162,213,198,0.2) 0%, rgba(207,255,226,0.1) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(10px)',
          opacity: 0.15,
        }}
      />
    </>
  );
}
