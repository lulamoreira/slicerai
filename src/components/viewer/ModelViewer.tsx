import React, { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader, ThreeMFLoader } from "three-stdlib";
import { useAppStore } from "../../store/useAppStore";
import * as fflate from "fflate";

interface ModelViewerProps {
  file?: File;
}

const Model = ({ file }: { file: File }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | THREE.Group | null>(null);
  const { setStatus, setGeometry: setGeoData, isWireframe, setOrientationAdvice } = useAppStore();

  useEffect(() => {
    if (!file) return;

    const loadModel = async () => {
      setStatus('parsing');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (!result) return;

        try {
          if (file.name.toLowerCase().endsWith('.stl')) {
            const loader = new STLLoader();
            const geom = loader.parse(result as ArrayBuffer);
            geom.center();
            setGeometry(geom);
            analyze(geom);
          } else if (file.name.toLowerCase().endsWith('.3mf')) {
            // .3MF loading is more complex as it's a zip
            const loader = new ThreeMFLoader();
            // 3MFLoader usually expects a URL, but we can use parse if we unzip or feed it the buffer
            // Standard ThreeMFLoader in stdlib has .parse(buffer)
            const group = loader.parse(result as ArrayBuffer);
            // Center the group
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            group.position.sub(center);
            setGeometry(group);

            // Merge for analysis
            const mergedGeom = new THREE.BufferGeometry();
            const positions: number[] = [];
            group.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const pos = mesh.geometry.attributes.position.array;
                    positions.push(...pos);
                }
            });
            mergedGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            analyze(mergedGeom);
          }
        } catch (err) {
          console.error(err);
          setStatus('parse_error');
        }
      };

      if (file.name.toLowerCase().endsWith('.stl') || file.name.toLowerCase().endsWith('.3mf')) {
        reader.readAsArrayBuffer(file);
      }
    };

    const analyze = (geom: THREE.BufferGeometry) => {
        // Use Web Worker for analysis
        const worker = new Worker(new URL('../../workers/analyze.worker.ts', import.meta.url), { type: 'module' });
        
        const pos = geom.attributes.position.array;
        // Transfer the array buffer to avoid copying
        worker.postMessage({ 
            geometryData: { 
                position: pos,
                index: geom.index?.array 
            } 
        }, [pos.buffer as ArrayBuffer]);

        worker.onmessage = (e) => {
            const { result } = e.data;
            setGeoData(result);
            setStatus('ready');
            
            // Orientation Advisor
            if (result.overhangsDetected && result.boundingBox.x < result.boundingBox.z) {
                setOrientationAdvice({ suggested: true, dismissed: false });
            }
            
            worker.terminate();
        };
    };

    loadModel();
  }, [file]);

  if (!geometry) return null;

  return (
    <primitive object={geometry}>
      {(geometry as any).isBufferGeometry ? (
        <meshStandardMaterial 
          color="#00c8b4" 
          metalness={0.1} 
          roughness={0.7} 
          wireframe={isWireframe} 
        />
      ) : (
        geometry.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: "#00c8b4",
              metalness: 0.1,
              roughness: 0.7,
              wireframe: isWireframe,
            });
          }
        })
      )}
    </primitive>
  );
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ file }) => {
  return (
    <div className="w-full h-full bg-[#0d0d14] relative rounded-xl overflow-hidden border border-white/5">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [150, 150, 150], fov: 45 }}>
        <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.2, blur: 2 }} adjustCamera={true}>
          {file && <Model file={file} />}
        </Stage>
        <OrbitControls makeDefault />
        <Grid
          infiniteGrid
          fadeDistance={300}
          fadeStrength={5}
          sectionSize={10}
          sectionThickness={1.5}
          sectionColor="#00c8b4"
          cellSize={2}
          cellThickness={0.8}
          cellColor="#1e1e2e"
        />
        <ambientLight intensity={0.4} />
        <directionalLight position={[100, 100, 100]} intensity={0.8} castShadow />
      </Canvas>
      
      {/* Wireframe toggle */}
      <button 
        onClick={() => useAppStore.getState().toggleWireframe()}
        className="absolute top-4 right-4 p-2 bg-surface-raised border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors z-10"
      >
        WIREFRAME
      </button>
    </div>
  );
};
