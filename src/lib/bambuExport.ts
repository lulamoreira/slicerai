import JSZip from "jszip";

const INHERITS_MAP: Record<string, Record<string, string>> = {
  "X1 Carbon": {
    "0.4": "0.20mm Standard @BBL X1C",
    "0.2": "0.20mm Standard @BBL X1C 0.2 nozzle",
    "0.6": "0.20mm Standard @BBL X1C 0.6 nozzle",
    "0.8": "0.20mm Standard @BBL X1C 0.8 nozzle",
  },
  "X1E": {
    "0.4": "0.20mm Standard @BBL X1E",
    "0.2": "0.20mm Standard @BBL X1E 0.2 nozzle",
    "0.6": "0.20mm Standard @BBL X1E 0.6 nozzle",
  },
  "P1S": {
    "0.4": "0.20mm Standard @BBL P1S",
    "0.2": "0.20mm Standard @BBL P1S 0.2 nozzle",
    "0.6": "0.20mm Standard @BBL P1S 0.6 nozzle",
    "0.8": "0.20mm Standard @BBL P1S 0.8 nozzle",
  },
  "P1P": {
    "0.4": "0.20mm Standard @BBL P1P",
    "0.6": "0.20mm Standard @BBL P1P 0.6 nozzle",
  },
  "A1": {
    "0.4": "0.20mm Standard @BBL A1",
    "0.2": "0.20mm Standard @BBL A1 0.2 nozzle",
    "0.6": "0.20mm Standard @BBL A1 0.6 nozzle",
    "0.8": "0.20mm Standard @BBL A1 0.8 nozzle",
  },
  "A1 Mini": {
    "0.4": "0.20mm Standard @BBL A1M",
    "0.2": "0.20mm Standard @BBL A1M 0.2 nozzle",
    "0.6": "0.20mm Standard @BBL A1M 0.6 nozzle",
  },
};

const COMPATIBLE_PRINTERS_MAP: Record<string, Record<string, string>> = {
  "X1 Carbon": {
    "0.4": "Bambu Lab X1 Carbon 0.4 nozzle",
    "0.2": "Bambu Lab X1 Carbon 0.2 nozzle",
    "0.6": "Bambu Lab X1 Carbon 0.6 nozzle",
    "0.8": "Bambu Lab X1 Carbon 0.8 nozzle",
  },
  "X1E": {
    "0.4": "Bambu Lab X1E 0.4 nozzle",
    "0.2": "Bambu Lab X1E 0.2 nozzle",
    "0.6": "Bambu Lab X1E 0.6 nozzle",
  },
  "P1S": {
    "0.4": "Bambu Lab P1S 0.4 nozzle",
    "0.2": "Bambu Lab P1S 0.2 nozzle",
    "0.6": "Bambu Lab P1S 0.6 nozzle",
    "0.8": "Bambu Lab P1S 0.8 nozzle",
  },
  "P1P": {
    "0.4": "Bambu Lab P1P 0.4 nozzle",
    "0.6": "Bambu Lab P1P 0.6 nozzle",
  },
  "A1": {
    "0.4": "Bambu Lab A1 0.4 nozzle",
    "0.2": "Bambu Lab A1 0.2 nozzle",
    "0.6": "Bambu Lab A1 0.6 nozzle",
    "0.8": "Bambu Lab A1 0.8 nozzle",
  },
  "A1 Mini": {
    "0.4": "Bambu Lab A1 mini 0.4 nozzle",
    "0.2": "Bambu Lab A1 mini 0.2 nozzle",
    "0.6": "Bambu Lab A1 mini 0.6 nozzle",
  },
};

export interface BambuSettings {
  printer: string;
  nozzle: string;
  layerHeight: number;
  wallLoops: number;
  topLayers: number;
  bottomLayers: number;
  infillDensity: number;
  infillPattern: string;
  printSpeed: number;
  travelSpeed: number;
  enableSupport: boolean;
  supportType: string;
  supportThreshold: number;
  supportReason?: string;
  brimWidth: number;
  nozzleTemp: number;
  bedTemp: number;
  enableIroning: boolean;
  filamentType: string;
  seamPosition?: string;
  seamReason?: string;
  profileName?: string;
}

export async function downloadBambuProfile(settings: BambuSettings): Promise<void> {
  const printer = settings.printer || "X1 Carbon";
  const nozzle = settings.nozzle || "0.4";
  const printerMap = INHERITS_MAP[printer] || INHERITS_MAP["X1 Carbon"];
  const compatMap = COMPATIBLE_PRINTERS_MAP[printer] || COMPATIBLE_PRINTERS_MAP["X1 Carbon"];
  const inheritsValue = printerMap[nozzle] || printerMap["0.4"];
  const compatPrinter = compatMap[nozzle] || compatMap["0.4"];
  const profileName = settings.profileName || `SlicerAI_${printer.replace(/ /g, "_")}_${Date.now()}`;

  const preset: Record<string, unknown> = {
    print_settings_id: "",
    version: "1.9.0.0",
    from: "user",
    instantiation: "true",
    name: profileName,
    inherits: inheritsValue,
    compatible_printers: [compatPrinter],
    compatible_printers_condition: "",
    compatible_prints_condition: "",
    layer_height: String(settings.layerHeight),
    seam_position: settings.seamPosition || "aligned",
    initial_layer_print_height: String(Math.max(settings.layerHeight, 0.2)),
    wall_loops: String(settings.wallLoops),
    top_shell_layers: String(settings.topLayers),
    bottom_shell_layers: String(settings.bottomLayers),
    sparse_infill_density: `${settings.infillDensity}%`,
    sparse_infill_pattern: settings.infillPattern || "grid",
    enable_support: settings.enableSupport ? "1" : "0",
    support_type: settings.supportType || "normal(auto)",
    support_threshold_angle: String(settings.supportThreshold ?? 45),
    brim_width: String(settings.brimWidth ?? 0),
    enable_ironing: settings.enableIroning ? "1" : "0",
    inner_wall_speed: String(settings.printSpeed),
    outer_wall_speed: String(Math.round(settings.printSpeed * 0.6)),
    sparse_infill_speed: String(settings.printSpeed),
    internal_solid_infill_speed: String(Math.round(settings.printSpeed * 0.8)),
    top_surface_speed: String(Math.round(settings.printSpeed * 0.5)),
    travel_speed: String(settings.travelSpeed || 200),
    initial_layer_speed: "30",
    nozzle_temperature: String(settings.nozzleTemp),
    nozzle_temperature_initial_layer: String(settings.nozzleTemp + 5),
    bed_temperature: String(settings.bedTemp),
    bed_temperature_initial_layer: String(settings.bedTemp + 5),
  };

  const zip = new JSZip();
  zip.file(`${profileName}.json`, JSON.stringify(preset, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profileName}.bbscfg`;
  a.click();
  URL.revokeObjectURL(url);
}
