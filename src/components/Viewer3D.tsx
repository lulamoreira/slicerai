/// <reference types="@react-three/fiber" />
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";
import { useStore } from "../lib/store";
import { analyzeGeometry } from "../lib/geometry";

interface Viewer3DProps {
  file?: File;
}

const Model = ({ file }: { file: File }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const updateWizard = useStore((state) => state.updateWizard);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!file) return;

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const geom = loader.parse(result as ArrayBuffer);
        geom.computeVertexNormals();
        geom.center(); 
        setGeometry(geom);

        const tempMesh = new THREE.Mesh(geom);
        const stats = analyzeGeometry(tempMesh);
        updateWizard({ geometryStats: stats });
      }
    };

    reader.readAsArrayBuffer(file);
  }, [file, updateWizard]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#00ADB5" roughness={0.5} metalness={0.2} />
    </mesh>
  );
};

export const Viewer3D: React.FC<Viewer3DProps> = ({ file }) => {
  return (
    <div className="w-full h-full bg-[#0d0d14] relative rounded-lg overflow-hidden border border-white/10">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [100, 100, 100], fov: 45 }}>
        <Stage 
          environment="city" 
          intensity={0.5} 
          shadows={{ type: 'contact', opacity: 0.2 }}
          adjustCamera={true}
        >
          {file && <Model file={file} />}
        </Stage>
        <OrbitControls makeDefault minDistance={10} maxDistance={500} />
        <Grid
          infiniteGrid
          fadeDistance={300}
          fadeStrength={5}
          sectionSize={10}
          sectionThickness={1.5}
          sectionColor="#00ADB5"
          cellSize={2}
          cellThickness={0.8}
          cellColor="#1e1e2e"
        />
        <ambientLight intensity={0.5} />
        <pointLight position={[100, 100, 100]} castShadow />
      </Canvas>
    </div>
  );
};
