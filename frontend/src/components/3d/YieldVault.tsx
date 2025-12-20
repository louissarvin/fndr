import { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  MeshDistortMaterial,
  Sphere,
  Box,
  Torus,
} from "@react-three/drei";
import * as THREE from "three";
import usdcImage from "@/assets/usdc.png";
import usdtImage from "@/assets/usdt.png";

function TokenCoin({
  position,
  delay,
  tokenType,
}: {
  position: [number, number, number];
  delay: number;
  tokenType: "usdc" | "usdt";
}) {
  const spriteRef = useRef<THREE.Sprite>(null);

  // Load the actual token images
  const usdcTexture = useLoader(THREE.TextureLoader, usdcImage);
  const usdtTexture = useLoader(THREE.TextureLoader, usdtImage);

  const texture = tokenType === "usdc" ? usdcTexture : usdtTexture;

  useFrame((state) => {
    if (spriteRef.current) {
      spriteRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.2;
      spriteRef.current.material.rotation =
        state.clock.elapsedTime * 0.5 + delay;
    }
  });

  // Create a custom material that removes white/light areas
  const customMaterial = useMemo(() => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });

    // Custom fragment shader to remove white/light areas
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
        #include <map_fragment>
        
        // Remove white/light areas by making them transparent
        float brightness = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        if (brightness > 0.7) {
          diffuseColor.a *= (1.0 - brightness) * 2.0;
        }
        `
      );
    };

    return material;
  }, [texture]);

  return (
    <sprite
      ref={spriteRef}
      position={position}
      scale={[0.4, 0.4, 0.4]}
      material={customMaterial}
    />
  );
}

function VaultCore() {
  const vaultRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (vaultRef.current) {
      vaultRef.current.rotation.y += 0.003;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group ref={vaultRef}>
      {/* Main vault sphere */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Sphere args={[1, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#6366f1"
            attach="material"
            distort={0.2}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Float>

      {/* Rotating ring - Silver */}
      <Torus
        ref={ringRef}
        args={[1.5, 0.05, 16, 100]}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial  metalness={0.9} roughness={0.1} />
      </Torus>

      {/* Secondary ring - Platinum/Light Silver */}
      <Torus
        args={[1.3, 0.03, 16, 100]}
        position={[0, 0, 0]}
        rotation={[Math.PI / 3, Math.PI / 4, 0]}
      >
        <meshStandardMaterial color="#a78bfa" metalness={0.9} roughness={0.1} />
      </Torus>

      {/* Yield indicator cubes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.5} floatIntensity={0.3}>
          <Box
            args={[0.1, 0.1, 0.1]}
            position={[
              Math.cos((i / 6) * Math.PI * 2) * 2,
              Math.sin((i / 6) * Math.PI * 2) * 0.5,
              Math.sin((i / 6) * Math.PI * 2) * 2,
            ]}
          >
            <meshStandardMaterial
              color="#10b981"
              metalness={0.7}
              roughness={0.2}
              emissive="#10b981"
              emissiveIntensity={0.5}
            />
          </Box>
        </Float>
      ))}
    </group>
  );
}

function FloatingTokens() {
  const tokens = useMemo(() => {
    const tokenData: {
      position: [number, number, number];
      tokenType: "usdc" | "usdt";
    }[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 0.5;
      tokenData.push({
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius,
        ],
        tokenType: i % 2 === 0 ? "usdc" : "usdt", // Alternate between USDC and USDT
      });
    }
    return tokenData;
  }, []);

  return (
    <>
      {tokens.map((token, i) => (
        <TokenCoin
          key={i}
          position={token.position}
          delay={i * 0.5}
          tokenType={token.tokenType}
        />
      ))}
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#8b5cf6" />

      <VaultCore />
      <FloatingTokens />

      <Sparkles
        count={100}
        scale={6}
        size={2}
        speed={0.4}
        color="#10b981"
        opacity={0.6}
      />
    </>
  );
}

export default function YieldVault() {
  return (
    <div className="h-[500px] w-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
