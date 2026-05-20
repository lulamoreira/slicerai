export function generateBambuProfile(results: any, wizard: any, suggestedName: string): string {
  const layerHeight = results.layerHeight ?? results.quality?.layer_height ?? 0.20;
  const wallLoops = results.wallLoops ?? results.strength?.wall_loops ?? 3;
  const infillPercent = results.infillPercent ?? results.strength?.infill_density ?? 15;
  const infillPattern = results.infillPattern ?? results.strength?.infill_pattern ?? "gyroid";
  const supportType = results.supportType ?? results.support?.type ?? "none";
  const supportAngle = results.supportAngle ?? results.support?.threshold_angle ?? 30;
  const nozzleTemp = results.nozzleTemp ?? results.temperature?.nozzle ?? 220;
  const bedTemp = results.bedTemp ?? results.temperature?.bed ?? 65;
  const printSpeed = results.printSpeed ?? results.speed?.inner_wall ?? 150;
  const topLayers = results.topLayers ?? results.strength?.top_layers ?? 4;
  const bottomLayers = results.bottomLayers ?? results.strength?.bottom_layers ?? 4;
  const ironing = results.ironing ?? results.quality?.ironing ?? false;

  const supportEnabled = (supportType && supportType !== "none" && supportType !== "Sem suporte");

  const profile = {
    type: "process",
    name: `SlicerAI - ${suggestedName}`,
    inherits: "fdm_process_common",
    instantiation: "true",
    layer_height: String(layerHeight),
    first_layer_height: String(layerHeight),
    wall_loops: String(wallLoops),
    fill_density: `${infillPercent}%`,
    fill_pattern: infillPattern,
    enable_support: supportEnabled ? "1" : "0",
    support_type: supportType === "tree" ? "tree(auto)" : "normal(auto)",
    support_threshold_angle: String(supportAngle),
    nozzle_temperature: [String(nozzleTemp)],
    nozzle_temperature_initial_layer: [String(nozzleTemp)],
    hot_plate_temp: [String(bedTemp)],
    hot_plate_temp_initial_layer: [String(bedTemp)],
    inner_wall_speed: String(printSpeed),
    outer_wall_speed: String(Math.round(printSpeed * 0.6)),
    sparse_infill_speed: String(printSpeed),
    top_surface_speed: String(Math.round(printSpeed * 0.5)),
    top_shell_layers: String(topLayers),
    bottom_shell_layers: String(bottomLayers),
    enable_ironing: ironing ? "1" : "0",
    notes: `Gerado pelo SlicerAI for Bambu em ${new Date().toLocaleDateString('pt-BR')}`,
  };

  return JSON.stringify(profile, null, 2);
}

export function downloadBambuProfile(results: any, wizard: any, suggestedName: string): void {
  const json = generateBambuProfile(results, wizard, suggestedName);
  const safeName = String(suggestedName).replace(/[^a-zA-Z0-9_-]+/g, '_');
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SlicerAI_${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
