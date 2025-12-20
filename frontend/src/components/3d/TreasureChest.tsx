import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import usdcImage from '@/assets/usdc.png';
import usdtImage from '@/assets/usdt.png';

interface TreasureChestProps {
  stage: 'closed' | 'opening' | 'opened';
  onChestClick: () => void;
}

interface ChestModelProps {
  stage: 'closed' | 'opening' | 'opened';
  onChestClick: () => void;
}

function ChestModel({ stage, onChestClick }: ChestModelProps) {
  const chestRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (chestRef.current) {
      // Gentle floating animation for closed chest
      if (stage === 'closed') {
        chestRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        chestRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      }
    }
    
    // Opening animation
    if (lidRef.current && stage === 'opening') {
      const progress = Math.min((state.clock.elapsedTime % 3) / 3, 1); // 3 second animation
      lidRef.current.rotation.x = -progress * Math.PI * 0.4; // Open to 72 degrees
    }
  });

  const handleClick = () => {
    if (stage === 'closed') {
      onChestClick();
    }
  };

  return (
    <group ref={chestRef} onClick={handleClick} position={[0, 0, 0]}>
      {/* Chest Base */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.8, 1]} />
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Chest Lid */}
      <group ref={lidRef} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.5, 0.4, 1]} />
          <meshStandardMaterial 
            color="#A0522D" 
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
        
        {/* Lid Handle */}
        <mesh position={[0, 0.4, 0.4]}>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Metal Bands */}
      <mesh position={[0, -0.1, 0.51]}>
        <boxGeometry args={[1.6, 0.05, 0.02]} />
        <meshStandardMaterial 
          color="#C0C0C0" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.1, -0.51]}>
        <boxGeometry args={[1.6, 0.05, 0.02]} />
        <meshStandardMaterial 
          color="#C0C0C0" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Lock (only visible when closed) */}
      {stage === 'closed' && (
        <mesh position={[0, -0.1, 0.52]}>
          <boxGeometry args={[0.2, 0.3, 0.05]} />
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.9}
            roughness={0.1}
            emissive="#B8860B"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Hover indication for closed chest */}
      {stage === 'closed' && (
        <>
          <Sparkles
            count={20}
            scale={2}
            size={1}
            speed={0.3}
            color="#FFD700"
            opacity={0.8}
          />
          <pointLight 
            position={[0, 1, 0]} 
            intensity={0.5} 
            color="#FFD700" 
            distance={3}
          />
        </>
      )}
    </group>
  );
}

function TokenParticle({ 
  position, 
  delay, 
  tokenType,
  stage 
}: { 
  position: [number, number, number]; 
  delay: number;
  tokenType: 'usdc' | 'usdt';
  stage: 'closed' | 'opening' | 'opened';
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const usdcTexture = useLoader(THREE.TextureLoader, usdcImage);
  const usdtTexture = useLoader(THREE.TextureLoader, usdtImage);
  
  const texture = tokenType === 'usdc' ? usdcTexture : usdtTexture;
  
  useFrame((state) => {
    if (spriteRef.current && stage === 'opened') {
      const time = state.clock.elapsedTime + delay;
      
      // Floating motion
      spriteRef.current.position.x = position[0] + Math.sin(time * 0.5) * 0.5;
      spriteRef.current.position.y = position[1] + Math.sin(time * 0.7) * 0.3;
      spriteRef.current.position.z = position[2] + Math.cos(time * 0.3) * 0.4;
      
      // Rotation
      spriteRef.current.material.rotation = time * 0.5;
    } else if (spriteRef.current && stage === 'opening') {
      // Unified pouring animation - all tokens pour out together from chest
      const animationTime = state.clock.elapsedTime;
      const startDelay = delay * 0.05; // Even smaller delay for immediate effect
      const adjustedTime = Math.max(0, animationTime - startDelay);
      const progress = Math.min(adjustedTime / 2.5, 1); // 2.5 second pour duration
      
      if (progress > 0) {
        // Start from chest opening
        const chestX = 0;
        const chestY = 0.3; // Chest lid height
        const chestZ = 0;
        
        // Natural center-focused pouring effect
        const frontBias = 0.7; // Forward bias
        
        // Natural spread with center bias (like real pouring)
        const baseAngle = delay * 2.8; // Base angle for variation
        const centerBias = 0.6; // 60% bias toward center
        const maxSpread = Math.PI * 0.4; // Max 72° spread (±36°)
        
        // Create center-weighted distribution
        const rawAngle = (baseAngle % (Math.PI * 2)) - Math.PI; // -180° to +180°
        const centerWeighted = Math.sign(rawAngle) * Math.pow(Math.abs(rawAngle / Math.PI), centerBias) * Math.PI;
        const spreadAngle = centerWeighted * (maxSpread / Math.PI); // Scale to max spread
        
        const verticalVariation = (delay * 5.7) % 1; // Height variation
        const explosionForce = progress * 3.2; // Base force
        
        // Natural horizontal spread (more center, less extreme sides)
        const horizontalForce = explosionForce * 1.2;
        const directionX = Math.sin(spreadAngle) * horizontalForce;
        
        // Natural vertical movement
        const verticalForce = explosionForce * (0.6 + verticalVariation * 1.0);
        const directionY = (verticalVariation - 0.35) * verticalForce;
        
        // Forward movement with deterministic variation (no random for performance)
        const forwardVariation = Math.sin(delay * 4.7) * 0.2 + 0.9; // Deterministic variation
        const forwardForce = explosionForce * frontBias * forwardVariation;
        const directionZ = forwardForce;
        
        // Add controlled randomness (less chaotic)
        const randomX = (Math.sin(delay * 3.7) * 0.5) * progress;
        const randomY = (Math.cos(delay * 2.8) * 0.4) * progress; 
        const randomZ = (Math.sin(delay * 2.1) * 0.3) * progress; // Less Z randomness
        
        // Position tokens flowing toward viewer
        spriteRef.current.position.x = chestX + directionX + randomX;
        spriteRef.current.position.y = chestY + directionY + randomY;
        spriteRef.current.position.z = chestZ + directionZ + randomZ; // Primarily positive Z (toward viewer)
        
        // Scale tokens as they fall
        const scaleProgress = Math.min(progress * 2, 1);
        spriteRef.current.scale.setScalar(scaleProgress * 0.3);
        
        // Rotation during pour
        spriteRef.current.material.rotation = adjustedTime * 2 + delay;
      } else {
        // Hide token until its time to pour
        spriteRef.current.scale.setScalar(0);
      }
    }
  });

  // Custom material to remove white areas
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

  if (stage === 'closed') return null;

  return (
    <sprite 
      ref={spriteRef} 
      position={stage === 'opening' ? [0, 0.5, 0] : position} 
      scale={[0.3, 0.3, 0.3]}
      material={customMaterial}
    />
  );
}

function GoldSparkle({ 
  position, 
  delay, 
  stage 
}: { 
  position: [number, number, number]; 
  delay: number;
  stage: 'closed' | 'opening' | 'opened';
}) {
  const sparkleRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sparkleRef.current && stage === 'opening') {
      const time = state.clock.elapsedTime;
      // Gradual release based on chest opening progress (3 second duration to match)
      const chestProgress = Math.min(time / 3, 1); // Match chest opening timing
      const sparkleStartTime = delay * 0.3; // Staggered sparkle appearance
      const individualProgress = Math.max(0, Math.min((chestProgress - sparkleStartTime) / (1 - sparkleStartTime), 1));
      
      if (chestProgress > sparkleStartTime && individualProgress > 0) {
        // Balanced sparkle spread (matching token distribution)
        const spreadIntensity = individualProgress * individualProgress; // Quadratic for slow start
        const frontBias = 0.9; // Strong front bias for sparkles
        
        // Balanced sparkle distribution (-90° to +90°)
        const sparkleIndex = delay * 8; // Convert delay to index-like value
        const normalizedSparkle = (sparkleIndex % 1); // 0 to 1
        const balancedAngle = (normalizedSparkle - 0.5) * Math.PI; // -90° to +90° evenly
        
        const spreadX = Math.sin(balancedAngle) * spreadIntensity * 2; // Balanced left/right
        const spreadY = (Math.cos(delay * 3.1) * spreadIntensity * 1.2) + (spreadIntensity * 0.8); // Varied height
        const spreadZ = spreadIntensity * 3.5 * frontBias * (0.7 + Math.abs(Math.cos(balancedAngle)) * 0.5); // Strong forward
        
        sparkleRef.current.position.x = spreadX;
        sparkleRef.current.position.y = 0.3 + spreadY;
        sparkleRef.current.position.z = spreadZ;
        
        // Gradual appearance and twinkling
        const baseSize = individualProgress * 0.1; // Start small, grow slowly
        const twinkle = Math.sin(time * 8) * 0.3 + 0.7;
        sparkleRef.current.scale.setScalar(baseSize * twinkle);
        
        // Slow rotation that increases with progress
        const rotationSpeed = individualProgress * 3; // Starts slow, speeds up
        sparkleRef.current.rotation.x = time * rotationSpeed;
        sparkleRef.current.rotation.y = time * rotationSpeed * 0.7;
        sparkleRef.current.rotation.z = time * rotationSpeed * 1.3;
        
        // Gradual fade in, then fade out
        let opacity;
        if (individualProgress < 0.3) {
          opacity = individualProgress / 0.3; // Fade in slowly
        } else if (individualProgress < 0.8) {
          opacity = 1; // Stay bright
        } else {
          opacity = Math.max(0, 1 - (individualProgress - 0.8) / 0.2); // Fade out
        }
        
        if (sparkleRef.current.material instanceof THREE.MeshStandardMaterial) {
          sparkleRef.current.material.opacity = opacity;
        }
      } else {
        // Hide sparkle until it's time to appear
        sparkleRef.current.scale.setScalar(0);
      }
    }
  });

  if (stage !== 'opening') return null;

  return (
    <mesh ref={sparkleRef} position={[0, 0.3, 0]}>
      <octahedronGeometry args={[0.02, 0]} />
      <meshStandardMaterial 
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.8}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

function TokenParticles({ stage }: { stage: 'closed' | 'opening' | 'opened' }) {
  const particles = useMemo(() => {
    const particleData: { position: [number, number, number]; tokenType: 'usdc' | 'usdt' }[] = [];
    
    // More tokens for richer effect
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const radius = 2 + Math.random() * 4;
      const height = Math.random() * 5 - 2.5;

      particleData.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ],
        tokenType: i % 2 === 0 ? 'usdc' : 'usdt'
      });
    }
    
    return particleData;
  }, []);

  const sparkles = useMemo(() => {
    const sparkleData: { position: [number, number, number] }[] = [];
    
    // Minimal sparkles for optimal performance
    for (let i = 0; i < 5; i++) {
      sparkleData.push({
        position: [0, 0.3, 0] // All start from chest
      });
    }
    
    return sparkleData;
  }, []);

  return (
    <>
      {particles.map((particle, i) => (
        <TokenParticle
          key={i}
          position={particle.position}
          delay={i * 0.2}
          tokenType={particle.tokenType}
          stage={stage}
        />
      ))}
      
      {/* Gold Sparkles during opening */}
      {sparkles.map((sparkle, i) => (
        <GoldSparkle
          key={`sparkle-${i}`}
          position={sparkle.position}
          delay={i * 0.3}
          stage={stage}
        />
      ))}
    </>
  );
}

function Scene({ stage, onChestClick }: TreasureChestProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#FFD700" />
      
      {/* Main Chest - Hide when opened */}
      {stage !== 'opened' && (
        <Float speed={stage === 'closed' ? 1 : 0} rotationIntensity={0.1} floatIntensity={0.2}>
          <ChestModel stage={stage} onChestClick={onChestClick} />
        </Float>
      )}
      
      {/* Token Particles */}
      <TokenParticles stage={stage} />
      
      {/* Optimized Pouring Sparkles - During Opening */}
      {stage === 'opening' && (
        <Sparkles
          count={8}
          scale={2}
          size={1}
          speed={0.2}
          color="#FFD700"
          opacity={0.4}
          position={[0, 0.3, 0]}
        />
      )}
      
      {/* Environmental Sparkles - After Opening */}
      {stage === 'opened' && (
        <>
          <Sparkles
            count={80}
            scale={10}
            size={2}
            speed={0.3}
            color="#CFFFE2"
            opacity={0.5}
          />
          <Sparkles
            count={40}
            scale={6}
            size={1}
            speed={0.2}
            color="#A2D5C6"
            opacity={0.4}
          />
        </>
      )}
    </>
  );
}

export default function TreasureChest({ stage, onChestClick }: TreasureChestProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 2, 4], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene stage={stage} onChestClick={onChestClick} />
      </Canvas>
    </div>
  );
}