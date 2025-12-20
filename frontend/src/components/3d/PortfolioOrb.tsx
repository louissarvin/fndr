import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Sprite } from '@react-three/drei';
import * as THREE from 'three';

interface TokenOrbiterProps {
  tokenType: 'usdc' | 'usdt';
  angle: number;
  size: number;
  distance: number;
}

function TokenOrbiter({ tokenType, angle, size, distance }: TokenOrbiterProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  
  // Create the texture based on token type
  const createTokenTexture = (type: 'usdc' | 'usdt') => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Draw circular background
    ctx.fillStyle = type === 'usdc' ? '#2775CA' : '#26A17B';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw token text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type.toUpperCase(), 64, 72);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };
  
  const texture = createTokenTexture(tokenType);
  
  useFrame((state) => {
    if (spriteRef.current) {
      const time = state.clock.elapsedTime * 0.3;
      spriteRef.current.position.x = Math.cos(time + angle) * distance;
      spriteRef.current.position.z = Math.sin(time + angle) * distance;
      spriteRef.current.position.y = Math.sin(time * 0.5 + angle) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
      <sprite ref={spriteRef} scale={[size, size, 1]}>
        <spriteMaterial map={texture} transparent />
      </sprite>
    </Float>
  );
}

function CentralOrb() {
  const orbRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <Sphere ref={orbRef} args={[0.8, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  const tokenOrbiters = [
    { tokenType: 'usdc' as const, angle: 0, size: 0.6, distance: 2.0 },
    { tokenType: 'usdt' as const, angle: Math.PI * 0.5, size: 0.6, distance: 2.2 },
    { tokenType: 'usdc' as const, angle: Math.PI, size: 0.5, distance: 1.8 },
    { tokenType: 'usdt' as const, angle: Math.PI * 1.5, size: 0.5, distance: 2.4 },
    { tokenType: 'usdc' as const, angle: Math.PI * 0.25, size: 0.4, distance: 2.6 },
    { tokenType: 'usdt' as const, angle: Math.PI * 0.75, size: 0.4, distance: 1.6 },
  ];

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#6366f1" />
      
      <CentralOrb />
      {tokenOrbiters.map((token, i) => (
        <TokenOrbiter key={i} {...token} />
      ))}
    </>
  );
}

export default function PortfolioOrb() {
  return (
    <div className="h-[300px] w-full">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
