import { zipSync, strToU8 } from 'fflate';

const INHERITS_MAP: Record<string, Record<string, string>> = {
  'X1 Carbon': { '0.4': '0.20mm Standard @BBL X1C', '0.2': '0.20mm Standard @BBL X1C 0.2 nozzle', '0.6': '0.20mm Standard @BBL X1C 0.6 nozzle', '0.8': '0.20mm Standard @BBL X1C 0.8 nozzle' },
  'X1C':       { '0.4': '0.20mm Standard @BBL X1C', '0.2': '0.20mm Standard @BBL X1C 0.2 nozzle', '0.6': '0.20mm Standard @BBL X1C 0.6 nozzle', '0.8': '0.20mm Standard @BBL X1C 0.8 nozzle' },
  'X1E':       { '0.4': '0.20mm Standard @BBL X1E', '0.6': '0.20mm Standard @BBL X1E 0.6 nozzle' },
  'P1S':       { '0.4': '0.20mm Standard @BBL P1S', '0.2': '0.20mm Standard @BBL P1S 0.2 nozzle', '0.6': '0.20mm Standard @BBL P1S 0.6 nozzle' },
  'P1P':       { '0.4': '0.20mm Standard @BBL P1P', '0.2': '0.20mm Standard @BBL P1P 0.2 nozzle', '0.6': '0.20mm Standard @BBL P1P 0.6 nozzle' },
  'A1':        { '0.4': '0.20mm Standard @BBL A1',  '0.2': '0.20mm Standard @BBL A1 0.2 nozzle',  '0.6': '0.20mm Standard @BBL A1 0.6 nozzle' },
  'A1 Mini':   { '0.4': '0.20mm Standard @BBL A1M', '0.2': '0.20mm Standard @BBL A1M 0.2 nozzle', '0.6': '0.20mm Standard @BBL A1M 0.6 nozzle' },
  'A1 MINI':   { '0.4': '0.20mm Standard @BBL A1M', '0.2': '0.20mm Standard @BBL A1M 0.2 nozzle', '0.6': '0.20mm Standard @BBL A1M 0.6 nozzle' },
};

const COMPATIBLE_PRINTERS_MAP: Record<string, Record<string, string>> = {
  'X1 Carbon': { '0.4': 'Bambu Lab X1 Carbon 0.4 nozzle', '0.2': 'Bambu Lab X1 Carbon 0.2 nozzle', '0.6': 'Bambu Lab X1 Carbon 0.6 nozzle', '0.8': 'Bambu Lab X1 Carbon 0.8 nozzle' },
  'X1C':       { '0.4': 'Bambu Lab X1 Carbon 0.4 nozzle', '0.2': 'Bambu Lab X1 Carbon 0.2 nozzle', '0.6': 'Bambu Lab X1 Carbon 0.6 nozzle', '0.8': 'Bambu Lab X1 Carbon 0.8 nozzle' },
  'X1E':       { '0.4': 'Bambu Lab X1E 0.4 nozzle', '0.6': 'Bambu Lab X1E 0.6 nozzle' },
  'P1S':       { '0.4': 'Bambu Lab P1S 0.4 nozzle', '0.2': 'Bambu Lab P1S 0.2 nozzle', '0.6': 'Bambu Lab P1S 0.6 nozzle' },
  'P1P':       { '0.4': 'Bambu Lab P1P 0.4 nozzle', '0.2': 'Bambu Lab P1P 0.2 nozzle', '0.6': 'Bambu Lab P1P 0.6 nozzle' },
  'A1':        { '0.4': 'Bambu Lab A1 0.4 nozzle',  '0.2': 'Bambu Lab A1 0.2 nozzle',  '0.6': 'Bambu Lab A1 0.6 nozzle' },
  'A1 Mini':   { '0.4': 'Bambu Lab A1 mini 0.4 nozzle', '0.2': 'Bambu Lab A1 mini 0.2 nozzle', '0.6': 'Bambu Lab A1 mini 0.6 nozzle' },
  'A1 MINI':   { '0.4': 'Bambu Lab A1 mini 0.4 nozzle', '0.2': 'Bambu Lab A1 mini 0.2 nozzle', '0.6': 'Bambu Lab A1 mini 0.6 nozzle' },
};

export function downloadBambuProfile(results: any, wizard: any, suggestedName: string) {
  const nozzle = String(wizard.nozzle || '0.4');
  const inheritsMap = INHERITS_MAP[wizard.printer] || INHERITS_MAP['X1C'];
  const compatMap = COMPATIBLE_PRINTERS_MAP[wizard.printer] || COMPATIBLE_PRINTERS_MAP['X1C'];
  const inherits = inheritsMap[nozzle] || inheritsMap['0.4'];
  const compatPrinter = compatMap[nozzle] || compatMap['0.4'];
  const profileName = `SlicerAI - ${suggestedName}`;
  const safeName = (suggestedName || 'perfil').replace(/[^a-zA-Z0-9_\-]/g, '_');

  const processProfile = {
    type: "process",
    print_settings_id: "",
    name: profileName,
    version: "1.9.0.0",
    from: "user",
    instantiation: "true",
    inherits,
    compatible_printers: [compatPrinter],
    description: `Gerado pelo SlicerAI for Bambu em ${new Date().toLocaleDateString('pt-BR')}`,
    layer_height: String(results.layerHeight || 0.20),
    initial_layer_print_height: String(results.layerHeight || 0.20),
    wall_loops: String(results.wallLoops || 3),
    sparse_infill_density: `${results.infillPercent || 15}%`,
    sparse_infill_pattern: results.infillPattern || "gyroid",
    enable_support: (results.supportType && results.supportType !== "none" && results.supportType !== "Sem suporte") ? "1" : "0",
    support_type: results.supportType === "tree" ? "tree(auto)" : "normal(auto)",
    support_threshold_angle: String(results.supportAngle || 30),
    nozzle_temperature: [String(results.nozzleTemp || 220)],
    nozzle_temperature_initial_layer: [String(results.nozzleTemp || 220)],
    hot_plate_temp: [String(results.bedTemp || 65)],
    hot_plate_temp_initial_layer: [String(results.bedTemp || 65)],
    inner_wall_speed: [String(results.printSpeed || 150)],
    outer_wall_speed: [String(Math.round((results.printSpeed || 150) * 0.6))],
    sparse_infill_speed: [String(results.printSpeed || 150)],
    top_surface_speed: [String(Math.round((results.printSpeed || 150) * 0.5))],
    top_shell_layers: String(results.topLayers || 4),
    bottom_shell_layers: String(results.bottomLayers || 4),
    enable_ironing: results.ironing ? "1" : "0",
  };

  const fileName = `${safeName}.json`;
  const files: Record<string, Uint8Array> = {
    [fileName]: strToU8(JSON.stringify(processProfile, null, 2)),
  };

  const zipped = zipSync(files);
  const blob = new Blob([zipped], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SlicerAI_${safeName}.bbscfg`;
  a.click();
  URL.revokeObjectURL(url);
}
