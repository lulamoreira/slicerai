import OpenAI from "openai";
import { z } from "zod";
import { WizardState, AIResponse } from "./types";

const aiResponseSchema = z.object({
  quality: z.object({
    layer_height: z.number(),
    first_layer_height: z.number(),
    seam_position: z.string(),
    ironing: z.boolean(),
  }),
  strength: z.object({
    infill_percent: z.number(),
    infill_pattern: z.string(),
    wall_loops: z.number(),
    top_bottom_layers: z.number(),
  }),
  support: z.object({
    enabled: z.boolean(),
    type: z.string(),
    threshold_angle: z.number(),
    reason: z.string(),
  }),
  temperatures: z.object({
    nozzle: z.number(),
    bed: z.number(),
    chamber: z.number(),
  }),
  speed: z.object({
    print: z.number(),
    first_layer: z.number(),
    travel: z.number(),
  }),
  estimates: z.object({
    time: z.string(),
    filament_g: z.number(),
    filament_m: z.number(),
    filament_per_color: z.array(z.number()),
    estimated_cost_brl: z.number(),
    chamber_temp_required: z.boolean(),
  }),
  advanced: z.object({
    elephant_foot_compensation: z.number(),
    enable_overhang_speed: z.boolean(),
    bridge_speed: z.number(),
  }),
  explanation: z.object({
    topics: z.record(z.string()),
    warnings: z.array(z.string()),
    pre_print_checklist_extra: z.array(z.string()),
  }),
  profile_name_suggestion: z.string(),
});

/**
 * Repairs truncated JSON by balancing braces and brackets.
 */
export const repairJSON = (json: string): string => {
  let balanced = json.trim();
  const stack: string[] = [];
  
  for (let i = 0; i < balanced.length; i++) {
    const char = balanced[i];
    if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      const last = stack.pop();
      if ((char === "}" && last !== "{") || (char === "]" && last !== "[")) {
        // Mismatch - usually shouldn't happen in truncated valid prefix
      }
    }
  }
  
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === "{") balanced += "}";
    if (last === "[") balanced += "]";
  }
  
  return balanced;
};

export const generateSettings = async (
  apiKey: string,
  wizard: WizardState
): Promise<AIResponse> => {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const prompt = `
    Analyze this 3D model and printer configuration to provide optimized Bambu Studio settings.
    
    GEOMETRY:
    - Height: ${wizard.geometryStats?.height.toFixed(2)}mm
    - Volume: ${wizard.geometryStats?.volume.toFixed(2)}cm³
    - Overhangs: ${wizard.geometryStats?.overhangsDetected ? "Detected" : "None"}
    - Max Overhang Angle: ${wizard.geometryStats?.maxOverhangAngle.toFixed(1)}°
    
    PRINTER & USER PREFERENCES:
    - Printer: ${wizard.printer}
    - Nozzle: ${wizard.nozzle}mm
    - Material: ${wizard.material} (${wizard.variant})
    - AMS: ${wizard.hasAMS ? "Yes" : "No"}
    - Build Plate: ${wizard.buildPlate}
    - Priority: ${wizard.priority}% (0=Quality, 100=Speed)
    - Use Case: ${wizard.useCase}
    - Orientation Tip Accepted: ${wizard.shouldRotate90X ? "Yes" : "No"}

    Respond ONLY with a JSON object following this schema:
    {
      "quality": { "layer_height": number, "first_layer_height": number, "seam_position": string, "ironing": boolean },
      "strength": { "infill_percent": number, "infill_pattern": string, "wall_loops": number, "top_bottom_layers": number },
      "support": { "enabled": boolean, "type": string, "threshold_angle": number, "reason": string },
      "temperatures": { "nozzle": number, "bed": number, "chamber": number },
      "speed": { "print": number, "first_layer": number, "travel": number },
      "estimates": { "time": "H:MM", "filament_g": number, "filament_m": number, "filament_per_color": [number], "estimated_cost_brl": number, "chamber_temp_required": boolean },
      "advanced": { "elephant_foot_compensation": number, "enable_overhang_speed": boolean, "bridge_speed": number },
      "explanation": { "topics": { "key": "value" }, "warnings": [string], "pre_print_checklist_extra": [string] },
      "profile_name_suggestion": "NAME"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Empty response from AI");

  const repaired = repairJSON(content);
  const parsed = JSON.parse(repaired);
  return aiResponseSchema.parse(parsed);
};

export const testConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    });
    return true;
  } catch (e) {
    return false;
  }
};
