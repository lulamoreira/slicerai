import { zipSync, strToU8 } from 'fflate';

const COMPATIBLE_PRINTERS: Record<string, Record<string, string>> = {
  'X1 Carbon': { '0.2': 'Bambu Lab X1 Carbon 0.2 nozzle', '0.4': 'Bambu Lab X1 Carbon 0.4 nozzle', '0.6': 'Bambu Lab X1 Carbon 0.6 nozzle', '0.8': 'Bambu Lab X1 Carbon 0.8 nozzle' },
  'X1C':       { '0.2': 'Bambu Lab X1 Carbon 0.2 nozzle', '0.4': 'Bambu Lab X1 Carbon 0.4 nozzle', '0.6': 'Bambu Lab X1 Carbon 0.6 nozzle', '0.8': 'Bambu Lab X1 Carbon 0.8 nozzle' },
  'X1E':       { '0.4': 'Bambu Lab X1E 0.4 nozzle', '0.6': 'Bambu Lab X1E 0.6 nozzle' },
  'P1S':       { '0.2': 'Bambu Lab P1S 0.2 nozzle', '0.4': 'Bambu Lab P1S 0.4 nozzle', '0.6': 'Bambu Lab P1S 0.6 nozzle' },
  'P1P':       { '0.2': 'Bambu Lab P1P 0.2 nozzle', '0.4': 'Bambu Lab P1P 0.4 nozzle', '0.6': 'Bambu Lab P1P 0.6 nozzle' },
  'A1':        { '0.2': 'Bambu Lab A1 0.2 nozzle', '0.4': 'Bambu Lab A1 0.4 nozzle', '0.6': 'Bambu Lab A1 0.6 nozzle' },
  'A1 Mini':   { '0.2': 'Bambu Lab A1 mini 0.2 nozzle', '0.4': 'Bambu Lab A1 mini 0.4 nozzle', '0.6': 'Bambu Lab A1 mini 0.6 nozzle' },
  'A1 MINI':   { '0.2': 'Bambu Lab A1 mini 0.2 nozzle', '0.4': 'Bambu Lab A1 mini 0.4 nozzle', '0.6': 'Bambu Lab A1 mini 0.6 nozzle' },
};

const INHERITS_BY_LAYER: Record<string, string> = {
  '0.06': 'fdm_process_single_0.06',
  '0.08': 'fdm_process_single_0.08',
  '0.10': 'fdm_process_single_0.10',
  '0.12': 'fdm_process_single_0.12',
  '0.16': 'fdm_process_single_0.16',
  '0.20': 'fdm_process_single_0.20',
  '0.24': 'fdm_process_single_0.24',
  '0.28': 'fdm_process_single_0.28',
};

export function downloadBambuProfile(results: any, wizard: any, suggestedName: string) {
  const nozzle = String(wizard.nozzle || '0.4');
  const printerMap = COMPATIBLE_PRINTERS[wizard.printer] || COMPATIBLE_PRINTERS['X1C'];
  const compatiblePrinter = printerMap[nozzle] || printerMap['0.4'];
  
  // Map internal results to the format expected by the export logic
  const layerHeightValue = results.quality?.layer_height || wizard.layerHeight || 0.20;
  const layerKey = Number(layerHeightValue).toFixed(2);
  const inherits = INHERITS_BY_LAYER[layerKey] || 'fdm_process_single_0.20';
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
    compatible_printers: [compatiblePrinter],
    description: `Gerado pelo SlicerAI for Bambu em ${new Date().toLocaleDateString('pt-BR')}`,
    layer_height: String(layerHeightValue),
    initial_layer_print_height: String(results.quality?.first_layer_height || layerHeightValue),
    wall_loops: String(results.strength?.wall_loops || 3),
    sparse_infill_density: `${results.strength?.infill_density || 15}%`,
    sparse_infill_pattern: results.strength?.infill_pattern || "gyroid",
    enable_support: (results.support?.needed) ? "1" : "0",
    support_type: String(results.support?.type || '').toLowerCase().includes("tree") ? "tree(auto)" : "normal(auto)",
    support_threshold_angle: String(results.support?.threshold_angle || 30),
    nozzle_temperature: [String(results.temperature?.nozzle || 220)],
    nozzle_temperature_initial_layer: [String(results.temperature?.nozzle_first_layer || 220)],
    hot_plate_temp: [String(results.temperature?.bed || 65)],
    hot_plate_temp_initial_layer: [String(results.temperature?.bed_first_layer || 65)],
    inner_wall_speed: [String(results.speed?.inner_wall || 150)],
    outer_wall_speed: [String(results.speed?.outer_wall || Math.round((results.speed?.inner_wall || 150) * 0.6))],
    sparse_infill_speed: [String(results.speed?.infill || 150)],
    top_surface_speed: [String(results.speed?.top_surface || Math.round((results.speed?.inner_wall || 150) * 0.5))],
    top_shell_layers: String(results.strength?.top_layers || 4),
    bottom_shell_layers: String(results.strength?.bottom_layers || 4),
    enable_ironing: results.quality?.ironing ? "1" : "0",
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
