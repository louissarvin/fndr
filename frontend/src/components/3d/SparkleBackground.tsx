import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';

function SparkleScene() {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />

      {/* Main sparkles - teal/mint colors */}
      <Sparkles
        count={100}
        scale={12}
        size={2.5}
        speed={0.3}
        color="#1C4D8D"
        opacity={0.6}
      />
      <Sparkles
        count={60}
        scale={8}
        size={1.5}
        speed={0.2}
        color="#4988C4"
        opacity={0.5}
      />
      <Sparkles
        count={40}
        scale={15}
        size={3}
        speed={0.15}
        color="#1C4D8D"
        opacity={0.3}
      />
    </>
  );
}

export default function SparkleBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SparkleScene />
      </Canvas>
    </div>
  );
}
