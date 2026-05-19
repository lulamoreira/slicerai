import * as THREE from 'three';

self.onmessage = (e: MessageEvent) => {
  const { geometryData } = e.data;
  
  // Reconstruct BufferGeometry from data
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(geometryData.position, 3));
  if (geometryData.index) {
    geometry.setIndex(new THREE.BufferAttribute(geometryData.index, 1));
  }

  // Calculate Volume and Surface Area
  let volume = 0;
  let surfaceArea = 0;
  const position = geometry.attributes.position;
  const index = geometry.index;
  const faces = index ? index.count / 3 : position.count / 3;

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  const overhangThreshold = Math.PI / 4; // 45 degrees
  let maxOverhangAngle = 0;
  let hasOverhangs = false;
  let bridgingDetected = false;

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

    // Signed volume
    volume += p1.dot(p2.cross(p3)) / 6.0;

    // Surface Area
    edge1.subVectors(p2, p1);
    edge2.subVectors(p3, p1);
    normal.crossVectors(edge1, edge2);
    const area = normal.length() / 2.0;
    surfaceArea += area;

    // Overhang Analysis
    normal.normalize();
    // Assuming Z is up
    const angle = normal.angleTo(new THREE.Vector3(0, 0, -1));
    if (angle < overhangThreshold) {
      hasOverhangs = true;
      const deg = (angle * 180) / Math.PI;
      if (deg > maxOverhangAngle) maxOverhangAngle = deg;
    }

    // Heuristic for bridging: near-horizontal faces (looking down)
    // Actually bridging is usually horizontal faces looking down with no support
    const upwardAngle = normal.angleTo(new THREE.Vector3(0, 0, -1));
    if (upwardAngle < 0.17) { // within ~10 degrees of flat down
        bridgingDetected = true;
    }
  }

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const result = {
    height: size.z,
    volume: Math.max(0, Math.abs(volume) / 1000), // cm³
    surfaceArea: surfaceArea / 100, // cm²
    overhangsDetected: hasOverhangs,
    maxOverhangAngle: maxOverhangAngle,
    thinWalls: false, // sampled heuristic would be too heavy here
    bridging: bridgingDetected,
    boundingBox: { x: size.x, y: size.y, z: size.z },
    parts: 1,
    colors: 1
  };

  self.postMessage({ result });
};
