import JSZip from "jszip";

export interface PlateObject {
  id: string;
  name: string;
  vertices: [number, number, number][];
  triangles: [number, number, number][];
  transform: number[]; // matriz 4x4 row-major (16 valores)
  extruder: number;
  volumeType: "ModelPart" | "NegativePart" | "SupportEnforcer" | "SupportBlocker" | "ParameterModifier";
}

export interface Plate {
  id: number;
  name: string;
  thumbnailDataUrl?: string;
  objects: PlateObject[];
}

export interface ParsedThreeMf {
  plates: Plate[];
  embeddedProjectSettings?: Record<string, any>;
  embeddedFilaments: Array<Record<string, any>>;
  hasEmbeddedSettings: boolean;
}

function parseTransform(str: string | null): number[] {
  if (!str) return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const nums = str.trim().split(/\s+/).map(parseFloat);
  if (nums.length === 12) {
    return [nums[0],nums[1],nums[2],0, nums[3],nums[4],nums[5],0, nums[6],nums[7],nums[8],0, nums[9],nums[10],nums[11],1];
  }
  return nums.length === 16 ? nums : [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}

export async function parseThreeMfFile(file: File): Promise<ParsedThreeMf> {
  const zip = await JSZip.loadAsync(file);
  const modelXml = await zip.file("3D/3dmodel.model")?.async("text");
  if (!modelXml) throw new Error("Arquivo .3mf inválido: 3D/3dmodel.model não encontrado");

  const doc = new DOMParser().parseFromString(modelXml, "application/xml");
  const objectMap = new Map<string, { vertices: [number,number,number][]; triangles: [number,number,number][] }>();

  doc.querySelectorAll("resources > object").forEach(objEl => {
    const id = objEl.getAttribute("id") || "";
    const vertices: [number,number,number][] = [];
    const triangles: [number,number,number][] = [];
    objEl.querySelectorAll("mesh > vertices > vertex").forEach(v => {
      vertices.push([parseFloat(v.getAttribute("x")||"0"), parseFloat(v.getAttribute("y")||"0"), parseFloat(v.getAttribute("z")||"0")]);
    });
    objEl.querySelectorAll("mesh > triangles > triangle").forEach(t => {
      triangles.push([parseInt(t.getAttribute("v1")||"0"), parseInt(t.getAttribute("v2")||"0"), parseInt(t.getAttribute("v3")||"0")]);
    });
    if (vertices.length > 0) objectMap.set(id, { vertices, triangles });
  });

  const buildItems = new Map<string, number[]>();
  doc.querySelectorAll("build > item").forEach(item => {
    const objId = item.getAttribute("objectid") || "";
    buildItems.set(objId, parseTransform(item.getAttribute("transform")));
  });

  const plates: Plate[] = [];
  const modelSettingsXml = await zip.file("Metadata/model_settings.config")?.async("text");
  if (modelSettingsXml) {
    const msDoc = new DOMParser().parseFromString(modelSettingsXml, "application/xml");
    const objectMeta = new Map<string, { name: string; extruder: number; volumeType: any }>();
    msDoc.querySelectorAll("object").forEach(o => {
      const id = o.getAttribute("id") || "";
      const name = o.querySelector('metadata[key="name"]')?.getAttribute("value") || `Object ${id}`;
      const extruder = parseInt(o.querySelector('metadata[key="extruder"]')?.getAttribute("value") || "1");
      const volumeType = (o.querySelector('volume metadata[key="volume_type"]')?.getAttribute("value") || "ModelPart") as any;
      objectMeta.set(id, { name, extruder, volumeType });
    });
    msDoc.querySelectorAll("plate").forEach((plateEl, idx) => {
      const plateId = parseInt(plateEl.querySelector('metadata[key="plater_id"]')?.getAttribute("value") || String(idx+1));
      const plateName = plateEl.querySelector('metadata[key="plater_name"]')?.getAttribute("value") || `Mesa ${plateId}`;
      const objects: PlateObject[] = [];
      plateEl.querySelectorAll("model_instance").forEach(inst => {
        const objId = inst.querySelector('metadata[key="object_id"]')?.getAttribute("value") || "";
        const geo = objectMap.get(objId);
        const meta = objectMeta.get(objId) || { name: `Object ${objId}`, extruder: 1, volumeType: "ModelPart" };
        if (geo) {
          objects.push({
            id: objId, name: meta.name,
            vertices: geo.vertices, triangles: geo.triangles,
            transform: buildItems.get(objId) || [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
            extruder: meta.extruder, volumeType: meta.volumeType,
          });
        }
      });
      plates.push({ id: plateId, name: plateName, objects });
    });
  }

  // Fallback: se não tinha model_settings, cria 1 mesa com todos os objetos
  if (plates.length === 0) {
    const objects: PlateObject[] = [];
    objectMap.forEach((geo, id) => {
      objects.push({
        id, name: `Object ${id}`,
        vertices: geo.vertices, triangles: geo.triangles,
        transform: buildItems.get(id) || [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        extruder: 1, volumeType: "ModelPart",
      });
    });
    if (objects.length > 0) plates.push({ id: 1, name: "Mesa 1", objects });
  }

  // Settings embarcados
  let embeddedProjectSettings: Record<string, any> | undefined;
  const psFile = zip.file("Metadata/project_settings.config");
  if (psFile) {
    try { embeddedProjectSettings = JSON.parse(await psFile.async("text")); } catch {}
  }
  const embeddedFilaments: Array<Record<string, any>> = [];
  const filamentFiles = Object.keys(zip.files).filter(n => /^Metadata\/filament_\d+\.config$/.test(n));
  for (const n of filamentFiles) {
    try {
      const text = await zip.file(n)!.async("text");
      embeddedFilaments.push(JSON.parse(text));
    } catch {}
  }

  // Thumbnails
  for (const plate of plates) {
    const thumbFile = zip.file(`Metadata/plate_${plate.id}.png`);
    if (thumbFile) {
      const blob = await thumbFile.async("blob");
      plate.thumbnailDataUrl = await new Promise<string>(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
    }
  }

  return {
    plates,
    embeddedProjectSettings,
    embeddedFilaments,
    hasEmbeddedSettings: !!embeddedProjectSettings,
  };
}
