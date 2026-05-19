/// <reference types="@react-three/fiber" />
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stage } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader, ThreeMFLoader } from "three-stdlib";
import { useAppStore } from "../../store/useAppStore";

interface ModelViewerProps {
  file?: File;
}

const Model = ({ file }: { file: File }) => {
  const mountRef = useRef<THREE.Group>(null);
  const [modelObject, setModelObject] = useState<THREE.Object3D | null>(null);
  const { setStatus, setGeometry: setGeoData, isWireframe, setOrientationAdvice } = useAppStore();
  const wizard = useAppStore((s) => s.wizard);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (!result) return;

      try {
        let geometry: THREE.BufferGeometry | null = null;
        let object: THREE.Object3D | null = null;

        if (file.name.toLowerCase().endsWith('.stl')) {
          const loader = new STLLoader();
          geometry = loader.parse(result as ArrayBuffer);
          geometry.computeVertexNormals();
          geometry.center();
          const mesh = new THREE.Mesh(geometry);
          
          // Scaling
          const box = new THREE.Box3().setFromObject(mesh);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          mesh.scale.setScalar(80 / maxDim);
          
          // Re-center after scale
          geometry.center();
          object = mesh;
        } else if (file.name.toLowerCase().endsWith('.3mf')) {
          const loader = new ThreeMFLoader();
          object = loader.parse(result as ArrayBuffer);
          
          // Center and scale the group/object
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 80 / maxDim;
          object.scale.setScalar(scale);
          
          const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
          object.position.sub(center);

          // Extract geometry for analysis
          const positions: number[] = [];
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const pos = mesh.geometry.attributes.position.array;
              positions.push(...Array.from(pos));
            }
          });
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        }

        if (object) {
          // Force material settings
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                color: "#00ADB5",
                metalness: 0.1,
                roughness: 0.4,
                side: THREE.DoubleSide
              });
            }
          });
          
          setModelObject(object);
          if (geometry) analyze(geometry);
        }
      } catch (err) {
        console.error(err);
        setStatus('parse_error');
      }
    };

    const analyze = (geom: THREE.BufferGeometry) => {
      const worker = new Worker(new URL('../../workers/analyze.worker.ts', import.meta.url), { type: 'module' });
      const pos = geom.attributes.position.array as Float32Array;
      
      worker.postMessage({ 
        geometryData: { 
          position: pos,
          index: geom.index?.array 
        } 
      }, [pos.buffer]);

      worker.onmessage = (e) => {
        const { result } = e.data;
        setGeoData(result);
        setStatus('ready');
        if (result.overhangsDetected && result.boundingBox.x < result.boundingBox.z) {
          setOrientationAdvice({ suggested: true, dismissed: false });
        }
        worker.terminate();
      };
    };

    reader.readAsArrayBuffer(file);
  }, [file]);

  useEffect(() => {
    if (!modelObject) return;
    const meshes: THREE.Mesh[] = [];
    modelObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
    });
    meshes.forEach((mesh, idx) => {
      let color = "#00ADB5";
      if (wizard.hasAMS && meshes.length > 1) {
        const slot = wizard.amsSlots[idx % wizard.amsSlotCount];
        if (slot?.color) color = slot.color;
      }
      mesh.material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.4,
        wireframe: isWireframe,
        side: THREE.DoubleSide
      });
    });
  }, [modelObject, isWireframe, wizard.hasAMS, wizard.amsSlots, wizard.amsSlotCount, wizard.baseColor]);

  if (!modelObject) return null;

  return <primitive object={modelObject} />;
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ file: fileProp }) => {
  const storeFile = useAppStore((s) => s.file);
  const file = fileProp || storeFile || undefined;
  return (
    <div className="w-full h-full bg-[var(--background)] relative rounded-xl overflow-hidden border border-border">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [120, 80, 120], fov: 45, near: 0.1, far: 10000 }}>
        <Stage 
          environment="city" 
          intensity={0.5} 
          adjustCamera={false}
        >
          {file && <Model file={file} />}
        </Stage>
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
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
      
      <button 
        onClick={() => useAppStore.getState().toggleWireframe()}
        className="absolute top-4 right-4 p-2 bg-surface-raised border border-border rounded-lg text-[10px] font-bold tracking-widest text-muted hover:text-foreground hover:bg-surface-hover transition-colors z-10"
      >
        WIREFRAME
      </button>
    </div>
  );
};
