export interface ParsedMesh {
  vertices: [number, number, number][];
  triangles: [number, number, number][];
  isBinary: boolean;
}

export async function parseStlFile(file: File): Promise<ParsedMesh> {
  const buffer = await file.arrayBuffer();
  const dataView = new DataView(buffer);
  
  // Detection formula: expectedBinarySize = 84 + triangleCount * 50
  const triangleCount = dataView.byteLength >= 84 ? dataView.getUint32(80, true) : 0;
  const expectedBinarySize = 84 + triangleCount * 50;
  const isBinary = expectedBinarySize === buffer.byteLength;

  if (isBinary) {
    return parseBinaryStl(buffer);
  } else {
    const text = new TextDecoder().decode(buffer);
    return parseAsciiStl(text);
  }
}

function parseBinaryStl(buffer: ArrayBuffer): ParsedMesh {
  const dataView = new DataView(buffer);
  const triangleCount = dataView.getUint32(80, true);
  const vertices: [number, number, number][] = [];
  const triangles: [number, number, number][] = [];
  const vertexMap = new Map<string, number>();

  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    // Skip normal (12 bytes)
    offset += 12;

    const faceIndices: number[] = [];
    for (let v = 0; v < 3; v++) {
      const x = dataView.getFloat32(offset, true);
      const y = dataView.getFloat32(offset + 4, true);
      const z = dataView.getFloat32(offset + 8, true);
      offset += 12;

      const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, vertices.length);
        vertices.push([x, y, z]);
      }
      faceIndices.push(vertexMap.get(key)!);
    }

    triangles.push([faceIndices[0], faceIndices[1], faceIndices[2]] as [number, number, number]);
    
    // Skip attribute byte count (2 bytes)
    offset += 2;
  }

  return { vertices, triangles, isBinary: true };
}

function parseAsciiStl(text: string): ParsedMesh {
  const vertices: [number, number, number][] = [];
  const triangles: [number, number, number][] = [];
  const vertexMap = new Map<string, number>();
  
  const vertexRegex = /vertex\s+(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\s+(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\s+(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g;
  let match;
  const tempVertices: [number, number, number][] = [];

  while ((match = vertexRegex.exec(text)) !== null) {
    tempVertices.push([
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3])
    ]);
  }

  for (let i = 0; i < tempVertices.length; i += 3) {
    if (i + 2 >= tempVertices.length) break;

    const faceIndices: number[] = [];
    for (let v = 0; v < 3; v++) {
      const [x, y, z] = tempVertices[i + v];
      const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
      
      if (!vertexMap.has(key)) {
        vertexMap.set(key, vertices.length);
        vertices.push([x, y, z]);
      }
      faceIndices.push(vertexMap.get(key)!);
    }
    
    triangles.push([faceIndices[0], faceIndices[1], faceIndices[2]] as [number, number, number]);
  }

  return { vertices, triangles, isBinary: false };
}
