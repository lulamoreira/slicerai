import * as THREE from "three";
import { GeometryStats } from "./types";

export const MATERIAL_DENSITIES: Record<string, number> = {
  "PLA": 1.24,
  "PLA Matte": 1.24,
  "PLA Silk": 1.24,
  "PLA Galaxy": 1.24,
  "PLA Glow": 1.24,
  "PLA High Speed": 1.24,
  "PETG": 1.27,
  "PETG-CF": 1.35,
  "ABS": 1.04,
  "ASA": 1.07,
  "TPU 95A": 1.21,
  "TPU 87A": 1.20,
  "PA": 1.14,
  "PA-CF": 1.25,
  "PC": 1.20,
  "PLA-CF": 1.30,
  "PVA": 1.23,
  "HIPS": 1.05
};

export const analyzeGeometry = (mesh: THREE.Mesh): GeometryStats => {
  const geometry = mesh.geometry;
  
  if (!geometry.index && !geometry.attributes.position) {
    throw new Error("Invalid geometry");
  }

  const bufferGeometry = geometry as THREE.BufferGeometry;
  
  let volume = 0;
  let surfaceArea = 0;
  const position = bufferGeometry.attributes.position;
  const index = bufferGeometry.index;
  const faces = index ? index.count / 3 : position.count / 3;

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();

  let maxOverhangAngle = 0;
  let hasOverhangs = false;
  let overhangArea = 0;
  const overhangThreshold = Math.PI / 4; // 45 degrees

  for (let i = 0; i < faces; i++) {
    if (index) {
      p1.fromBufferAttribute(position, index.getX(i * 3));
      p2.fromBufferAttribute(position, index.getY(i * 3));
      p3.fromBufferAttribute(position, index.getZ(i * 3));
    } else {
      p1.fromBufferAttribute(position, i * 3);
      p2.fromBufferAttribute(position, i * 3 + 1);
      p3.fromBufferAttribute(position, i * 3 + 2);
    }

    volume += p1.dot(p2.cross(p3)) / 6.0;

    const edge1 = new THREE.Vector3().subVectors(p2, p1);
    const edge2 = new THREE.Vector3().subVectors(p3, p1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2);
    const area = normal.length() / 2.0;
    surfaceArea += area;

    normal.normalize();
    const angle = normal.angleTo(new THREE.Vector3(0, 0, -1));
    if (angle < overhangThreshold) {
      hasOverhangs = true;
      overhangArea += area;
      const deg = (angle * 180) / Math.PI;
      if (deg > maxOverhangAngle) maxOverhangAngle = deg;
    }
  }

  bufferGeometry.computeBoundingBox();
  const bbox = bufferGeometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  return {
    height: size.z,
    volume: Math.abs(volume) / 1000, 
    surfaceArea: surfaceArea / 100,
    overhangsDetected: hasOverhangs,
    maxOverhangAngle: maxOverhangAngle,
    overhangPercentage: (overhangArea / surfaceArea) * 100,
    thinWalls: false, 
    bridging: false, 
    isTall: size.z > 150,
    boundingBox: { x: size.x, y: size.y, z: size.z },
    parts: 1,
    colors: 1
  };
};

// Decisão de orientação agora é feita pela IA
export const checkRotationBenefit = (stats: GeometryStats): boolean => {
  return false;
};
