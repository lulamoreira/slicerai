const PRINTER_MAP: Record<string, string> = {
  'X1 Carbon': 'X1C',
  'X1C': 'X1C',
  'X1E': 'X1E',
  'P1S': 'P1S',
  'P1P': 'P1P',
  'A1': 'A1',
  'A1 Mini': 'A1 mini',
  'A1 MINI': 'A1 mini',
};

const LAYER_QUALITY: Record<string, string> = {
  '0.08': '0.08mm Extra Fine',
  '0.12': '0.12mm Fine',
  '0.16': '0.16mm Optimal',
  '0.20': '0.20mm Standard',
  '0.24': '0.24mm Draft',
  '0.28': '0.28mm Extra Draft',
};

export function generateBambuProfile(results: any, wizard: any, suggestedName: string): string {
  const printerCode = PRINTER_MAP[wizard.printer] || 'X1C';
  const nozzle = wizard.nozzle || '0.4';
  const layerKey = Number(results.layerHeight || 0.20).toFixed(2);
  const qualityLabel = LAYER_QUALITY[layerKey] || `${layerKey}mm Standard`;
  const inherits = `${qualityLabel} @BBL ${printerCode} ${nozzle} nozzle`;

  const profile: Record<string, any> = {
    type: "process",
    name: `SlicerAI - ${suggestedName}`,
    from: "user",
    is_custom_defined: "1",
    inherits,
    layer_height: String(results.layerHeight || 0.20),
    first_layer_height: String(results.firstLayerHeight || results.layerHeight || 0.20),
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
    inner_wall_speed: String(results.printSpeed || 150),
    outer_wall_speed: String(Math.round((results.printSpeed || 150) * 0.6)),
    sparse_infill_speed: String(results.printSpeed || 150),
    top_surface_speed: String(Math.round((results.printSpeed || 150) * 0.5)),
    top_shell_layers: String(results.topLayers || 4),
    bottom_shell_layers: String(results.bottomLayers || 4),
    enable_ironing: results.ironing ? "1" : "0",
    notes: `Gerado pelo SlicerAI for Bambu em ${new Date().toLocaleDateString('pt-BR')}`
  };

  return JSON.stringify(profile, null, 2);
}

export function downloadBambuProfile(results: any, wizard: any, suggestedName: string) {
  const json = generateBambuProfile(results, wizard, suggestedName);
  const safeName = (suggestedName || 'perfil').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SlicerAI_${safeName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
