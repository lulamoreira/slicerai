import { zipSync, strToU8 } from 'fflate';

const PRINTER_PROFILES: Record<string, Record<string, string>> = {
  'X1 Carbon': { '0.4': '0.20mm Standard @BBL X1C', '0.2': '0.20mm Standard @BBL X1C 0.2 nozzle', '0.6': '0.20mm Standard @BBL X1C 0.6 nozzle', '0.8': '0.20mm Standard @BBL X1C 0.8 nozzle' },
  'X1C': { '0.4': '0.20mm Standard @BBL X1C', '0.2': '0.20mm Standard @BBL X1C 0.2 nozzle', '0.6': '0.20mm Standard @BBL X1C 0.6 nozzle', '0.8': '0.20mm Standard @BBL X1C 0.8 nozzle' },
  'P1S': { '0.4': '0.20mm Standard @BBL P1S', '0.2': '0.20mm Standard @BBL P1S 0.2 nozzle', '0.6': '0.20mm Standard @BBL P1S 0.6 nozzle' },
  'P1P': { '0.4': '0.20mm Standard @BBL P1P', '0.2': '0.20mm Standard @BBL P1P 0.2 nozzle', '0.6': '0.20mm Standard @BBL P1P 0.6 nozzle' },
  'A1': { '0.4': '0.20mm Standard @BBL A1', '0.2': '0.20mm Standard @BBL A1 0.2 nozzle', '0.6': '0.20mm Standard @BBL A1 0.6 nozzle' },
  'A1 Mini': { '0.4': '0.20mm Standard @BBL A1M', '0.2': '0.20mm Standard @BBL A1M 0.2 nozzle', '0.6': '0.20mm Standard @BBL A1M 0.6 nozzle' },
};

export function downloadBambuProfile(results: any, wizard: any, suggestedName: string) {
  const nozzle = String(wizard.nozzle || '0.4');
  const printerProfiles = PRINTER_PROFILES[wizard.printer] || PRINTER_PROFILES['X1C'];
  const inherits = printerProfiles[nozzle] || printerProfiles['0.4'];
  const profileName = `SlicerAI - ${suggestedName}`;
  const safeName = (suggestedName || 'perfil').replace(/[^a-zA-Z0-9_\-]/g, '_');

  const processProfile = {
    type: "process",
    name: profileName,
    from: "user",
    setting_id: "",
    is_custom_defined: "1",
    instantiation: "true",
    inherits,
    layer_height: String(results.quality?.layer_height || 0.20),
    first_layer_height: String(results.quality?.first_layer_height || 0.20),
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
    inner_wall_speed: String(results.speed?.inner_wall || 150),
    outer_wall_speed: String(results.speed?.outer_wall || Math.round((results.speed?.inner_wall || 150) * 0.6)),
    sparse_infill_speed: String(results.speed?.infill || 150),
    top_surface_speed: String(results.speed?.top_surface || Math.round((results.speed?.inner_wall || 150) * 0.5)),
    top_shell_layers: String(results.strength?.top_layers || 4),
    bottom_shell_layers: String(results.strength?.bottom_layers || 4),
    enable_ironing: results.quality?.ironing ? "1" : "0",
  };

  const fileName = `SlicerAI_${safeName}.json`;
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
