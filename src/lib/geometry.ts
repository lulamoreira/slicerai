import * as THREE from "three";
import { GeometryStats } from "./types";

export const MATERIAL_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
  ASA: 1.07,
  PA: 1.14,
  PC: 1.20,
  TPU: 1.21,
  CarbonFiber: 1.30,
};

export const analyzeGeometry = (mesh: THREE.Mesh): GeometryStats => {
  const geometry = mesh.geometry;
  
  if (!geometry.index && !geometry.attributes.position) {
    throw new Error("Invalid geometry");
  }

  // Ensure we have a BufferGeometry
  const bufferGeometry = geometry as THREE.BufferGeometry;
  
  // Calculate Volume and Surface Area
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

    // Signed volume of tetrahedron
    volume += p1.dot(p2.cross(p3)) / 6.0;

    // Surface Area
    const edge1 = new THREE.Vector3().subVectors(p2, p1);
    const edge2 = new THREE.Vector3().subVectors(p3, p1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2);
    const area = normal.length() / 2.0;
    surfaceArea += area;

    // Normal analysis for overhangs
    normal.normalize();
    // Assuming Z is up in most 3D models or we adjust
    // In Three.js default Y is up, but Bambu/Slicers usually use Z up
    // We'll check the angle relative to the "down" vector (0, -1, 0) or (0, 0, -1)
    // Let's assume Z is up for the sake of analysis
    const angle = normal.angleTo(new THREE.Vector3(0, 0, -1));
    if (angle < overhangThreshold) {
      hasOverhangs = true;
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
    volume: Math.abs(volume) / 1000, // mm³ to cm³
    surfaceArea: surfaceArea / 100, // mm² to cm²
    overhangsDetected: hasOverhangs,
    maxOverhangAngle: maxOverhangAngle,
    thinWalls: false, // Simplification: placeholder
    bridging: false, // Simplification: placeholder
    boundingBox: { x: size.x, y: size.y, z: size.z }
  };
};

export const checkRotationBenefit = (stats: GeometryStats): boolean => {
  // Check if rotating 90 deg on X would significantly reduce overhangs
  // This is a complex calculation in a real app, here we'll use a heuristic:
  // if X dimension is smaller than Z and it has overhangs.
  return stats.overhangsDetected && stats.boundingBox.x < stats.boundingBox.z;
};
