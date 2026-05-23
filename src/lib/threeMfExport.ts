import JSZip from "jszip";
import { BambuSettings } from "./bambuExport";

export interface MeshData {
  vertices: [number, number, number][];
  triangles: [number, number, number][];
}

export async function downloadThreeMfProject(
  mesh: MeshData,
  settings: BambuSettings,
  profileName: string
): Promise<void> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="png" ContentType="image/png"/>
 <Default Extension="gcode" ContentType="text/x.gcode"/>
</Types>`;
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  zip.file("_rels/.rels", relsXml);

  // 3. 3D/3dmodel.model
  // Ensure all vertices have z >= 0
  let minZ = Infinity;
  mesh.vertices.forEach(v => {
    if (v[2] < minZ) minZ = v[2];
  });
  const offsetZ = minZ < 0 ? -minZ : 0;

  const verticesXml = mesh.vertices
    .map(v => `    <vertex x="${v[0].toFixed(6)}" y="${v[1].toFixed(6)}" z="${(v[2] + offsetZ).toFixed(6)}"/>`)
    .join("\n");

  const trianglesXml = mesh.triangles
    .map(t => `    <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`)
    .join("\n");

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:Bambulab="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p" unit="millimeter" xml:lang="en-US">
 <metadata name="Application">BambuStudio-02.00.00.00</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="1" p:UUID="00000001-61cb-4c03-9d28-80fed5dfa1dc" type="model">
   <mesh>
    <vertices>
${verticesXml}
    </vertices>
    <triangles>
${trianglesXml}
    </triangles>
   </mesh>
  </object>
 </resources>
 <build p:UUID="2c7c17d8-22b5-4d84-8835-1976022ea369">
  <item objectid="1" p:UUID="00000001-b1ec-4553-aec9-835e5b724bb4" transform="1 0 0 0 1 0 0 0 1 128 128 0" printable="1"/>
 </build>
</model>`;
  zip.file("3D/3dmodel.model", modelXml);

  // 4. Metadata/project_settings.config
  const filamentMap: Record<string, string> = {
    PLA: "Bambu PLA Basic @BBL X1C",
    ABS: "Bambu ABS @BBL X1C",
    PETG: "Bambu PETG HF @BBL X1C",
    TPU: "Bambu TPU 95A @BBL X1C",
    ASA: "Bambu ASA @BBL X1C",
  };
  const filamentId = filamentMap[settings.filamentType] || filamentMap["PLA"];

  const projectSettings = {
    from: "project",
    name: "project_settings",
    version: "02.00.00.00",
    is_custom_defined: "0",
    printer_settings_id: "Bambu Lab X1 Carbon 0.4 nozzle",
    print_settings_id: "0.20mm Standard @BBL X1C",
    printer_model: "Bambu Lab X1 Carbon",
    printer_variant: "0.4",
    filament_settings_id: [filamentId],
    nozzle_diameter: ["0.4"],
    layer_height: String(settings.layerHeight),
    first_layer_height: "0.2",
    wall_loops: String(settings.wallLoops),
    sparse_infill_density: settings.infillDensity + "%",
    sparse_infill_pattern: settings.infillPattern,
    enable_support: settings.enableSupport ? "1" : "0",
    support_type: settings.supportType,
    support_style: settings.supportStyle || "tree_organic",
    support_threshold_angle: String(settings.supportThreshold || 45),
    support_top_z_distance: "0.2",
    support_object_xy_distance: "0.35",
    support_interface_top_layers: "2",
    support_interface_pattern: "concentric",
    inner_wall_speed: String(settings.printSpeed),
    outer_wall_speed: String(Math.round(settings.printSpeed * 0.6)),
    sparse_infill_speed: String(settings.printSpeed),
    travel_speed: String(settings.travelSpeed || 200),
    nozzle_temperature: [String(settings.nozzleTemp)],
    nozzle_temperature_initial_layer: [String(settings.nozzleTemp + 5)],
    hot_plate_temp: [String(settings.bedTemp)],
    hot_plate_temp_initial_layer: [String(settings.bedTemp + 5)],
    filament_type: [settings.filamentType],
    filament_flow_ratio: ["1"],
    filament_max_volumetric_speed: ["15"],
    filament_diameter: ["1.75"],
    seam_position: settings.seamPosition || "back",
    enable_ironing: settings.enableIroning ? "1" : "0",
  };
  zip.file("Metadata/project_settings.config", JSON.stringify(projectSettings, null, 2));

  // 5. Metadata/model_settings.config
  const modelSettingsXml = `<?xml version="1.0" encoding="UTF-8"?>
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
</config>`;
  zip.file("Metadata/model_settings.config", modelSettingsXml);

  // 6. Metadata/slice_info.config
  const sliceInfoXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
 <header>
  <header_item key="X-BBL-Client-Type" value="slicer"/>
  <header_item key="X-BBL-Client-Version" value="02.00.00.00"/>
 </header>
 <plate>
  <metadata key="index" value="1"/>
  <metadata key="printer_model_id" value="BL-P001"/>
  <metadata key="nozzle_diameters" value="0.4"/>
 </plate>
</config>`;
  zip.file("Metadata/slice_info.config", sliceInfoXml);

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profileName}.3mf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
