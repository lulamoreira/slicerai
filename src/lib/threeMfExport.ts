import JSZip from "jszip";
import { BambuSettings } from "./bambuExport";

export interface MeshData {
  vertices: [number, number, number][];
  triangles: [number, number, number][];
}

const PRINTER_MAP: Record<string, any> = {
  "X1C": { settings_id: "Bambu Lab X1 Carbon 0.4 nozzle", model: "Bambu Lab X1 Carbon", model_id: "BL-P001", plate: [256, 256] },
  "X1E": { settings_id: "Bambu Lab X1E 0.4 nozzle", model: "Bambu Lab X1E", model_id: "BL-P001", plate: [256, 256] },
  "P1S": { settings_id: "Bambu Lab P1S 0.4 nozzle", model: "Bambu Lab P1S", model_id: "C11", plate: [256, 256] },
  "P1P": { settings_id: "Bambu Lab P1P 0.4 nozzle", model: "Bambu Lab P1P", model_id: "C12", plate: [256, 256] },
  "A1": { settings_id: "Bambu Lab A1 0.4 nozzle", model: "Bambu Lab A1", model_id: "N2S", plate: [256, 256] },
  "A1-Mini": { settings_id: "Bambu Lab A1 mini 0.4 nozzle", model: "Bambu Lab A1 mini", model_id: "N1", plate: [180, 180] },
};

const PRINT_SETTINGS_MAP: Record<string, string> = {
  "X1C": "0.20mm Standard @BBL X1C", "X1E": "0.20mm Standard @BBL X1E",
  "P1S": "0.20mm Standard @BBL P1S", "P1P": "0.20mm Standard @BBL P1P",
  "A1": "0.20mm Standard @BBL A1", "A1-Mini": "0.20mm Standard @BBL A1M",
};

const FILAMENT_MAP: Record<string, Record<string, string>> = {
  PLA: { X1C: "Bambu PLA Basic @BBL X1C", P1S: "Bambu PLA Basic @BBL P1S", A1: "Bambu PLA Basic @BBL A1", "A1-Mini": "Bambu PLA Basic @BBL A1M" },
  ABS: { X1C: "Bambu ABS @BBL X1C", P1S: "Bambu ABS @BBL P1S" },
  PETG: { X1C: "Bambu PETG HF @BBL X1C", P1S: "Bambu PETG HF @BBL P1S", A1: "Bambu PETG HF @BBL A1" },
  TPU: { X1C: "Bambu TPU 95A @BBL X1C", P1S: "Bambu TPU 95A @BBL P1S" },
  ASA: { X1C: "Bambu ASA @BBL X1C", P1S: "Bambu ASA @BBL P1S" },
};

function getOrientationTransform(rotation: string, cx: number, cy: number): string {
  const r = (rotation || "").toLowerCase();
  if (r.includes("90") && r.includes("x")) return `1 0 0 0 0 -1 0 1 0 ${cx} ${cy} 0`;
  if (r.includes("90") && r.includes("y")) return `0 0 1 0 1 0 -1 0 0 ${cx} ${cy} 0`;
  if (r.includes("180") && r.includes("z")) return `-1 0 0 0 -1 0 0 0 1 ${cx} ${cy} 0`;
  return `1 0 0 0 1 0 0 0 1 ${cx} ${cy} 0`;
}

export async function downloadThreeMfProject(
  mesh: MeshData,
  settings: BambuSettings,
  profileName: string,
  orientation?: { rotation?: string }
): Promise<void> {
  const printerKey = (settings as any).printer || "X1C";
  const printerInfo = PRINTER_MAP[printerKey] || PRINTER_MAP["X1C"];
  const printSettingsId = PRINT_SETTINGS_MAP[printerKey] || PRINT_SETTINGS_MAP["X1C"];
  const filamentMap = FILAMENT_MAP[settings.filamentType] || FILAMENT_MAP["PLA"];
  const filamentId = filamentMap[printerKey] || filamentMap["X1C"] || Object.values(filamentMap)[0];
  const [plateW, plateH] = printerInfo.plate;
  const cx = plateW / 2, cy = plateH / 2;
  const transformStr = getOrientationTransform(orientation?.rotation || "", cx, cy);

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="png" ContentType="image/png"/>
 <Default Extension="gcode" ContentType="text/x.gcode"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`);

  const vXml = mesh.vertices.map(v => `    <vertex x="${v[0].toFixed(6)}" y="${v[1].toFixed(6)}" z="${v[2].toFixed(6)}"/>`).join("\n");
  const tXml = mesh.triangles.map(t => `    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join("\n");
  zip.file("3D/3dmodel.model", `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <metadata name="Application">BambuStudio-02.00.00.00</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="1" p:UUID="00000001-61cb-4c03-9d28-80fed5dfa1dc" type="model">
   <mesh>
    <vertices>
${vXml}
    </vertices>
    <triangles>
${tXml}
    </triangles>
   </mesh>
  </object>
 </resources>
 <build p:UUID="2c7c17d8-22b5-4d84-8835-1976022ea369">
  <item objectid="1" p:UUID="00000001-b1ec-4553-aec9-835e5b724bb4" transform="${transformStr}" printable="1"/>
 </build>
</model>`);

  zip.file("Metadata/project_settings.config", JSON.stringify({
    from: "project", name: "project_settings", version: "02.00.00.00", is_custom_defined: "0",
    printer_settings_id: printerInfo.settings_id, print_settings_id: printSettingsId,
    printer_model: printerInfo.model, printer_variant: "0.4",
    filament_settings_id: [filamentId], nozzle_diameter: ["0.4"],
    layer_height: String(settings.layerHeight), first_layer_height: "0.2",
    wall_loops: String(settings.wallLoops),
    sparse_infill_density: settings.infillDensity + "%",
    sparse_infill_pattern: settings.infillPattern || "grid",
    enable_support: settings.enableSupport ? "1" : "0",
    support_type: settings.supportType || "tree(auto)",
    support_style: (settings as any).supportStyle || "tree_organic",
    support_threshold_angle: String((settings as any).supportThreshold || 45),
    support_top_z_distance: "0.2", support_object_xy_distance: "0.35",
    support_interface_top_layers: "2", support_interface_pattern: "concentric",
    inner_wall_speed: String(settings.printSpeed),
    outer_wall_speed: String(Math.round(settings.printSpeed * 0.6)),
    sparse_infill_speed: String(settings.printSpeed),
    travel_speed: String(settings.travelSpeed || 200),
    nozzle_temperature: [String(settings.nozzleTemp)],
    nozzle_temperature_initial_layer: [String(settings.nozzleTemp + 5)],
    hot_plate_temp: [String(settings.bedTemp)],
    hot_plate_temp_initial_layer: [String(settings.bedTemp + 5)],
    filament_type: [settings.filamentType], filament_flow_ratio: ["1"],
    filament_max_volumetric_speed: ["15"], filament_diameter: ["1.75"],
    seam_position: (settings as any).seamPosition || "back",
    enable_ironing: settings.enableIroning ? "1" : "0",
  }, null, 2));

  zip.file("Metadata/model_settings.config", `<?xml version="1.0" encoding="UTF-8"?>
<config>
 <plate>
  <metadata key="plater_id" value="1"/>
  <metadata key="plater_name" value=""/>
  <metadata key="locked" value="false"/>
  <model_instance>
   <metadata key="object_id" value="1"/>
   <metadata key="instance_id" value="0"/>
  </model_instance>
 </plate>
 <object id="1">
  <metadata key="name" value="${profileName}.stl"/>
  <metadata key="extruder" value="1"/>
 </object>
</config>`);

  zip.file("Metadata/slice_info.config", `<?xml version="1.0" encoding="UTF-8"?>
<config>
 <header>
  <header_item key="X-BBL-Client-Type" value="slicer"/>
  <header_item key="X-BBL-Client-Version" value="02.00.00.00"/>
 </header>
 <plate>
  <metadata key="index" value="1"/>
  <metadata key="printer_model_id" value="${printerInfo.model_id}"/>
  <metadata key="nozzle_diameters" value="0.4"/>
 </plate>
</config>`);

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${profileName}.3mf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}