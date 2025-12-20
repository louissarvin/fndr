import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import usdcImage from '@/assets/usdc.png';
import usdtImage from '@/assets/usdt.png';

interface TokenSpriteProps {
  index: number;
  totalTokens: number;
  tokenType: 'usdc' | 'usdt';
  arcRadiusX: number;
  arcRadiusY: number;
  rotationRef: React.MutableRefObject<number>;
}

function TokenSprite({
  index,
  totalTokens,
  tokenType,
  arcRadiusX,
  arcRadiusY,
  rotationRef
}: TokenSpriteProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const usdcTexture = useLoader(THREE.TextureLoader, usdcImage);
  const usdtTexture = useLoader(THREE.TextureLoader, usdtImage);

  const texture = tokenType === 'usdc' ? usdcTexture : usdtTexture;

  // Custom material to remove white areas (same as TreasureChest)
  const customMaterial = useMemo(() => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });

    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>

        float brightness = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        if (brightness > 0.7) {
          diffuseColor.a *= (1.0 - brightness) * 2.0;
        }
        `
      );
    };

    return material;
  }, [texture]);

  useFrame(() => {
    if (!spriteRef.current) return;

    const arcRotation = rotationRef.current;

    // Calculate position on arc (same logic as Chest.tsx)
    const angleStep = 360 / totalTokens;
    const baseAngle = index * angleStep;
    const angle = (baseAngle + arcRotation) % 360;
    const angleRad = (angle * Math.PI) / 180;

    // Position on elliptical arc (scaled for Three.js units)
    const x = Math.cos(angleRad) * arcRadiusX;
    const y = Math.sin(angleRad) * arcRadiusY; // Positive y = top

    // Vertical position for depth effects
    const verticalPos = Math.sin(angleRad); // -1 to 1

    // Smooth opacity transition - show top half, hide bottom half
    let opacity;
    if (verticalPos > 0.3) {
      opacity = 1;
    } else if (verticalPos > -0.4) {
      opacity = (verticalPos + 0.4) / 0.7;
      opacity = opacity * opacity;
    } else {
      opacity = 0;
    }

    // Scale based on position (larger at top)
    const scale = 0.65 + (Math.max(0, verticalPos) * 0.4);

    // Update sprite
    spriteRef.current.position.x = x;
    spriteRef.current.position.y = y;
    spriteRef.current.position.z = 0;
    spriteRef.current.scale.setScalar(scale);
    spriteRef.current.material.opacity = opacity;
    spriteRef.current.visible = opacity > 0;

    // Subtle rotation based on position
    const normalizedX = x / arcRadiusX;
    spriteRef.current.material.rotation = normalizedX * -0.4; // Subtle tilt
  });

  return (
    <sprite
      ref={spriteRef}
      material={customMaterial}
    />
  );
}

function TokensScene({ rotationRef }: { rotationRef: React.MutableRefObject<number> }) {
  const totalTokens = 16;

  // Arc dimensions in Three.js units (will be scaled based on camera)
  const arcRadiusX = 8;
  const arcRadiusY = 4;

  // Generate token data
  const tokens = useMemo(() => {
    return Array.from({ length: totalTokens }, (_, i) => ({
      index: i,
      tokenType: (i % 2 === 0 ? 'usdc' : 'usdt') as 'usdc' | 'usdt',
    }));
  }, [totalTokens]);

  return (
    <>
      <ambientLight intensity={0.5} />

      {tokens.map((token) => (
        <TokenSprite
          key={token.index}
          index={token.index}
          totalTokens={totalTokens}
          tokenType={token.tokenType}
          arcRadiusX={arcRadiusX}
          arcRadiusY={arcRadiusY}
          rotationRef={rotationRef}
        />
      ))}
    </>
  );
}

export default function FloatingTokensArc() {
  const rotationRef = useRef(0);

  // Continuous rotation animation
  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    const duration = 35000; // 35 seconds per full rotation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      rotationRef.current = (elapsed / duration) * 360 % 360;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <TokensScene rotationRef={rotationRef} />
      </Canvas>
    </div>
  );
}
