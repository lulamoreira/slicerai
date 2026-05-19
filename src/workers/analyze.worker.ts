import * as THREE from 'three';

self.onmessage = (e: MessageEvent) => {
  const { geometryData } = e.data;
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(geometryData.position, 3));
  if (geometryData.index) {
    geometry.setIndex(new THREE.BufferAttribute(geometryData.index, 1));
  }

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
  let overhangArea = 0;
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

    volume += p1.dot(p2.cross(p3)) / 6.0;

    edge1.subVectors(p2, p1);
    edge2.subVectors(p3, p1);
    normal.crossVectors(edge1, edge2);
    const area = normal.length() / 2.0;
    surfaceArea += area;

    normal.normalize();
    const angle = normal.angleTo(new THREE.Vector3(0, 0, -1));
    if (angle < overhangThreshold) {
      overhangArea += area;
      const deg = (angle * 180) / Math.PI;
      if (deg > maxOverhangAngle) maxOverhangAngle = deg;
    }

    if (normal.angleTo(new THREE.Vector3(0, 0, -1)) < 0.17) {
        bridgingDetected = true;
    }
  }

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const result = {
    height: size.z,
    volume: Math.max(0, Math.abs(volume) / 1000),
    surfaceArea: surfaceArea / 100,
    overhangsDetected: overhangArea > 0,
    maxOverhangAngle: maxOverhangAngle,
    overhangPercentage: (overhangArea / surfaceArea) * 100,
    thinWalls: false,
    bridging: bridgingDetected,
    isTall: size.z > 150,
    boundingBox: { x: size.x, y: size.y, z: size.z },
    parts: 1,
    colors: 1
  };

  self.postMessage({ result });
};
