import { z } from "zod";
import { WizardState, AIResponse } from "./types";
import { supabase } from "../integrations/supabase/client";
import { useSettingsStore } from "../store/useAppStore";

const aiResponseSchema = z.object({
  quality: z.object({
    layer_height: z.number(),
    first_layer_height: z.number(),
    seam_position: z.string(),
    ironing: z.boolean(),
    ironing_flow: z.number(),
    ironing_speed: z.number()
  }),
  strength: z.object({
    infill_density: z.number(),
    infill_pattern: z.string(),
    wall_loops: z.number(),
    top_layers: z.number(),
    bottom_layers: z.number(),
    top_surface_pattern: z.string(),
    bottom_surface_pattern: z.string()
  }),
  support: z.object({
    needed: z.boolean(),
    type: z.string(),
    threshold_angle: z.number(),
    top_z_distance: z.number(),
    bottom_z_distance: z.number(),
    xy_distance: z.number(),
    interface_layers: z.number(),
    interface_pattern: z.string(),
    tree_support_angle: z.number(),
    on_build_plate_only: z.boolean()
  }),
  temperature: z.object({
    nozzle: z.number(),
    nozzle_first_layer: z.number(),
    bed: z.number(),
    bed_first_layer: z.number(),
    chamber: z.number(),
    chamber_required: z.boolean(),
    part_cooling_fan: z.number(),
    part_cooling_first_layer: z.number()
  }),
  speed: z.object({
    mode: z.string(),
    outer_wall: z.number(),
    inner_wall: z.number(),
    top_surface: z.number(),
    bottom_surface: z.number(),
    infill: z.number(),
    travel: z.number(),
    first_layer: z.number(),
    bridge: z.number(),
    overhang_slow: z.number()
  }),
  ams: z.object({
    wipe_tower_enabled: z.boolean(),
    wipe_tower_width: z.number(),
    flush_multiplier: z.number(),
    flush_into_infill: z.boolean(),
    flush_into_objects: z.boolean(),
    prime_all_extruders: z.boolean()
  }),
  adhesion: z.object({
    brim_type: z.string(),
    brim_width: z.number(),
    skirt_loops: z.number()
  }),
  advanced: z.object({
    elephant_foot_compensation: z.number(),
    enable_overhang_speed: z.boolean(),
    bridge_flow: z.number(),
    precise_outer_wall: z.boolean(),
    thick_bridges: z.boolean(),
    small_perimeter_speed: z.number()
  }),
  estimates: z.object({
    print_time_minutes: z.number(),
    filament_grams: z.number(),
    filament_meters: z.number(),
    filament_per_color: z.array(z.object({
      slot: z.number(),
      color: z.string(),
      grams: z.number(),
      meters: z.number()
    })),
    estimated_cost_brl: z.number()
  }),
  explanation: z.object({
    layer_height_reason: z.string(),
    infill_reason: z.string(),
    support_reason: z.string(),
    material_plate_tips: z.string(),
    postprocessing_tips: z.string(),
    warnings: z.array(z.string()),
    pre_print_checklist_extra: z.array(z.string())
  }),
  profile_name_suggestion: z.string()
});

export const repairJSON = (json: string): string => {
  let balanced = json.trim();
  const stack: string[] = [];
  for (let i = 0; i < balanced.length; i++) {
    const char = balanced[i];
    if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") stack.pop();
  }
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === "{") balanced += "}";
    if (last === "[") balanced += "]";
  }
  return balanced;
};

export const generateSettings = async (
  wizard: WizardState,
  userProfile: any
): Promise<AIResponse> => {
  const systemPrompt = `
    Você é o SlicerAI, especialista sênior em impressão 3D FDM com domínio completo do Bambu Studio (versão mais recente, 2024-2025). Conhece todos os perfis, materiais, build plates, configurações AMS, suporte, velocidade, temperatura e nuances de cada impressora Bambu Lab. Responda sempre em português do Brasil (ou inglês se o usuário selecionou EN). Seja preciso, técnico e acessível. Justifique cada recomendação com base nos dados de geometria e escolhas do usuário. Respond ONLY with valid JSON. No markdown, no explanation. Retorne APENAS JSON válido conforme o schema solicitado, sem markdown, sem texto extra.
  `;

  const userMessage = `
Analise este modelo 3D e gere as melhores configurações para o Bambu Studio.

GEOMETRIA:
- Dimensões: ${wizard.geometryStats?.boundingBox.x.toFixed(1)}mm × ${wizard.geometryStats?.boundingBox.y.toFixed(1)}mm × ${wizard.geometryStats?.boundingBox.z.toFixed(1)}mm
- Volume: ${wizard.geometryStats?.volume.toFixed(2)} cm³ | Área: ${wizard.geometryStats?.surfaceArea.toFixed(2)} cm² | Peso: ${(wizard.geometryStats?.volume || 0).toFixed(1)}g
- Overhangs > 45°: ${wizard.geometryStats?.overhangsDetected ? "Sim" : "Não"} (máximo: ${wizard.geometryStats?.maxOverhangAngle.toFixed(0)}°, ${wizard.geometryStats?.overhangPercentage.toFixed(1)}% da área)
- Bridging: ${wizard.geometryStats?.bridging ? "Sim" : "Não"} | Paredes finas: ${wizard.geometryStats?.thinWalls ? "Sim" : "Não"} | Alto > 150mm: ${wizard.geometryStats?.isTall ? "Sim" : "Não"}
- Multi-part: ${wizard.geometryStats?.parts && wizard.geometryStats.parts > 1 ? "Sim" : "Não"} (${wizard.geometryStats?.parts} partes, ${wizard.geometryStats?.colors} cores)
- Orientação rotacionada 90° X: ${wizard.shouldRotate90X ? "Sim" : "Não"}

CONFIGURAÇÕES:
- Impressora: ${wizard.printer} | Nozzle: ${wizard.nozzle}mm
- AMS: ${wizard.hasAMS ? "Sim" : "Não"}, ${wizard.amsSlotCount} slots
- Material: ${wizard.material} (${wizard.variant}) | Cor: ${wizard.baseColor}
${wizard.hasAMS ? wizard.amsSlots.slice(0, wizard.amsSlotCount).map(s => `- Slot ${s.slot}: ${s.material} / ${s.color}`).join('\n') : ''}
- Flush AMS: ${wizard.flushStrategy} | Wipe tower: ${wizard.wipeTower ? "Sim" : "Não"}
- Build plate: ${wizard.buildPlate}
- Layer height: ${wizard.layerHeight}mm
- Propósitos: ${wizard.purposes.join(', ')}
- Ironing: ${wizard.ironing ? "Sim" : "Não"} | Seam: ${wizard.seamPosition}
- Suporte: ${wizard.supportType} | Interface: ${wizard.supportInterface}
- Custo filamento: R$120/kg

Retorne este JSON exato (todos os campos obrigatórios):
{
  "quality": { "layer_height": number, "first_layer_height": number, "seam_position": string, "ironing": boolean, "ironing_flow": number, "ironing_speed": number },
  "strength": { "infill_density": number, "infill_pattern": string, "wall_loops": number, "top_layers": number, "bottom_layers": number, "top_surface_pattern": string, "bottom_surface_pattern": string },
  "support": { "needed": boolean, "type": string, "threshold_angle": number, "top_z_distance": number, "bottom_z_distance": number, "xy_distance": number, "interface_layers": number, "interface_pattern": string, "tree_support_angle": number, "on_build_plate_only": boolean },
  "temperature": { "nozzle": number, "nozzle_first_layer": number, "bed": number, "bed_first_layer": number, "chamber": number, "chamber_required": boolean, "part_cooling_fan": number, "part_cooling_first_layer": number },
  "speed": { "mode": string, "outer_wall": number, "inner_wall": number, "top_surface": number, "bottom_surface": number, "infill": number, "travel": number, "first_layer": number, "bridge": number, "overhang_slow": number },
  "ams": { "wipe_tower_enabled": boolean, "wipe_tower_width": number, "flush_multiplier": number, "flush_into_infill": boolean, "flush_into_objects": boolean, "prime_all_extruders": boolean },
  "adhesion": { "brim_type": string, "brim_width": number, "skirt_loops": number },
  "advanced": { "elephant_foot_compensation": number, "enable_overhang_speed": boolean, "bridge_flow": number, "precise_outer_wall": boolean, "thick_bridges": boolean, "small_perimeter_speed": number },
  "estimates": { "print_time_minutes": number, "filament_grams": number, "filament_meters": number, "filament_per_color": [{ "slot": number, "color": string, "grams": number, "meters": number }], "estimated_cost_brl": number },
  "explanation": { "layer_height_reason": string, "infill_reason": string, "support_reason": string, "material_plate_tips": string, "postprocessing_tips": string, "warnings": [string], "pre_print_checklist_extra": [string] },
  "profile_name_suggestion": string
}
  `;

  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  let response;
  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 4096,
  };

  if (userProfile?.api_key_mode === 'centralized') {
    const { data: { session } } = await supabase.auth.getSession();
    response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig,
        }),
      }
    );
  } else {
    const apiKey = useSettingsStore.getState().apiKey;
    if (!apiKey) throw new Error('NO_API_KEY');

    response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig,
        }),
      }
    );
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini ${response.status}: ${errBody?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty response from Gemini");
  const repaired = repairJSON(content);
  return aiResponseSchema.parse(JSON.parse(repaired));
};

export type ConnectionResult = "ok" | "invalid" | "rate_limited" | "error";

export const testConnection = async (apiKey: string): Promise<boolean> => {
  const result = await testConnectionDetailed(apiKey);
  return result === "ok";
};

export const testConnectionDetailed = async (apiKey: string): Promise<ConnectionResult> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ok" }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
      }
    );
    if (response.ok) {
      const data = await response.json().catch(() => null);
      return data?.candidates ? "ok" : "error";
    }
    if (response.status === 429) return "rate_limited";
    if (response.status === 400 || response.status === 403) return "invalid";
    return "error";
  } catch {
    return "error";
  }
};
