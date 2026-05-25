import { z } from "zod";
import { WizardState, AIResponse } from "./types";
import { supabase } from "../integrations/supabase/client";
import { useSettingsStore, useAppStore } from "../store/useAppStore";
import { detectModelType } from "./supportProfiles";


const SafeNumber = z.number().or(z.string().transform(v => parseFloat(v) || 0)).catch(0);
const SafeString = z.string().catch("");
const SafeBool = z.boolean().or(z.string().transform(v => v === "true" || v === "1")).catch(false);

const EstimatesSchema = z.object({
  print_time_minutes: SafeNumber.optional().default(60),
  filament_grams: SafeNumber.optional().default(20),
  filament_meters: SafeNumber.optional().default(6),
  estimated_cost_brl: SafeNumber.optional().default(0),
  filament_per_color: z.any().optional().default([]),
}).partial().passthrough();

const SupportSchema = z.object({
  needed: SafeBool.optional().default(false),
  type: SafeString.optional().default("tree(auto)"),
  style: SafeString.optional().default("tree_organic"),
  threshold_angle: SafeNumber.optional().default(45),
  supportReason: SafeString.optional().default(""),
}).partial().passthrough();

const OrientationSchema = z.object({
  rotation: SafeString.optional().default("Sem rotação"),
  reason: SafeString.optional().default(""),
  supportReduction: SafeString.optional().default("0%"),
}).partial().passthrough();

const DecisionsSchema = z.object({
  layerHeight: SafeString.optional().default(""),
  wallLoops: SafeString.optional().default(""),
  infillDensity: SafeString.optional().default(""),
  infillPattern: SafeString.optional().default(""),
  printSpeed: SafeString.optional().default(""),
  support: SafeString.optional().default(""),
  seam: SafeString.optional().default(""),
  ironing: SafeString.optional().default(""),
  temperatures: SafeString.optional().default(""),
  overall: SafeString.optional().default(""),
}).partial().passthrough();

export const AIResponseSchema = z.object({
  quality: z.object({
    layer_height: SafeNumber.optional().default(0.2),
    first_layer_height: SafeNumber.optional().default(0.2),
    seam_position: SafeString.optional().default("back"),
    seamReason: SafeString.optional().default(""),
    ironing: SafeBool.optional().default(false),
    ironing_flow: SafeNumber.optional().default(10),
    ironing_speed: SafeNumber.optional().default(30),
  }).partial().passthrough().default({}),
  strength: z.object({
    infill_density: SafeNumber.optional().default(15),
    infill_pattern: SafeString.optional().default("grid"),
    wall_loops: SafeNumber.optional().default(3),
    top_layers: SafeNumber.optional().default(4),
    bottom_layers: SafeNumber.optional().default(3),
    top_surface_pattern: SafeString.optional().default("monotonic"),
    bottom_surface_pattern: SafeString.optional().default("monotonic"),
  }).partial().passthrough().default({}),
  support: SupportSchema.default({}),
  temperature: z.object({
    nozzle: SafeNumber.optional().default(220),
    nozzle_first_layer: SafeNumber.optional().default(225),
    bed: SafeNumber.optional().default(60),
    bed_first_layer: SafeNumber.optional().default(65),
    chamber: SafeNumber.optional().default(0),
    chamber_required: SafeBool.optional().default(false),
    part_cooling_fan: SafeNumber.optional().default(100),
    part_cooling_first_layer: SafeNumber.optional().default(0),
  }).partial().passthrough().default({}),
  speed: z.object({
    mode: SafeString.optional().default("normal"),
    outer_wall: SafeNumber.optional().default(150),
    inner_wall: SafeNumber.optional().default(200),
    top_surface: SafeNumber.optional().default(100),
    bottom_surface: SafeNumber.optional().default(100),
    infill: SafeNumber.optional().default(200),
    travel: SafeNumber.optional().default(300),
    first_layer: SafeNumber.optional().default(30),
    bridge: SafeNumber.optional().default(50),
    overhang_slow: SafeNumber.optional().default(10),
  }).partial().passthrough().default({}),
  ams: z.object({
    wipe_tower_enabled: SafeBool.optional().default(true),
    wipe_tower_width: SafeNumber.optional().default(60),
    flush_multiplier: SafeNumber.optional().default(1.0),
    flush_into_infill: SafeBool.optional().default(true),
    flush_into_objects: SafeBool.optional().default(false),
    prime_all_extruders: SafeBool.optional().default(false),
  }).partial().passthrough().default({}),
  adhesion: z.object({
    brim_type: SafeString.optional().default("auto"),
    brim_width: SafeNumber.optional().default(5),
    skirt_loops: SafeNumber.optional().default(0),
  }).partial().passthrough().default({}),
  advanced: z.object({
    elephant_foot_compensation: SafeNumber.optional().default(0.15),
    enable_overhang_speed: SafeBool.optional().default(true),
    bridge_flow: SafeNumber.optional().default(1.0),
    precise_outer_wall: SafeBool.optional().default(false),
    thick_bridges: SafeBool.optional().default(false),
    small_perimeter_speed: SafeNumber.optional().default(30),
  }).partial().passthrough().default({}),
  estimates: EstimatesSchema.default({}),
  explanation: z.object({
    layer_height_reason: SafeString.optional().default(""),
    infill_reason: SafeString.optional().default(""),
    support_reason: SafeString.optional().default(""),
    material_plate_tips: SafeString.optional().default(""),
    postprocessing_tips: SafeString.optional().default(""),
    warnings: z.array(z.string()).optional().default([]),
    pre_print_checklist_extra: z.array(z.string()).optional().default([]),
  }).partial().passthrough().default({}),
  profile_name_suggestion: SafeString.optional().default("SlicerAI_Profile"),
  decisions: DecisionsSchema.default({}),
  improvements: z.record(z.string()).optional().default({}),
  orientation: OrientationSchema.default({}),
}).partial().passthrough();

export const parseAIResponse = (text: string): any => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch {
    const opens = (cleaned.match(/{/g) || []).length;
    const closes = (cleaned.match(/}/g) || []).length;
    const missing = opens - closes;
    if (missing > 0) {
      const repaired = cleaned + "}".repeat(missing);
      try { return JSON.parse(repaired); } catch {}
    }
    const fallback = cleaned.replace(/,\s*"[^"]*"\s*:\s*[^,}]*$/, "") + "}".repeat(Math.max(0, opens - closes));
    try {
      return JSON.parse(fallback);
    } catch (e) {
      console.error("Final parse failure:", e, "Cleaned text:", cleaned);
      throw e;
    }
  }
};

export const callClaude = async (prompt: string, apiKey: string, improvementImage?: string) => {
  const claudeMessages = [];
  if (improvementImage) {
    claudeMessages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        { 
          type: "image", 
          source: { 
            type: "base64", 
            media_type: "image/jpeg", 
            data: improvementImage.split(',')[1] 
          } 
        }
      ]
    });
  } else {
    claudeMessages.push({ role: "user", content: prompt });
  }

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim().replace(/[^\x20-\x7E]/g, ""),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages: claudeMessages,
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errorMessage = errBody?.error?.message || errBody?.error?.status || response.statusText || "Erro desconhecido";
    
    if (response.status === 402) {
      throw { 
        code: "NO_BALANCE", 
        provider: "Claude", 
        message: "Saldo insuficiente — seus créditos acabaram. Acesse console.anthropic.com para recarregar." 
      };
    }

    if (response.status === 401) {
      throw { 
        code: "INVALID_KEY", 
        provider: "Claude", 
        message: "Chave de API inválida para Claude. Verifique nas Configurações." 
      };
    }
    
    throw new Error(`Claude [${response.status}]: ${errorMessage}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text;
};

export const generateSettings = async (
  wizard: WizardState,
  userProfile: any,
  history: any[] = [],
  improvementImage?: string,
  currentVersion?: number,
  previousResults?: AIResponse
): Promise<AIResponse> => {
  const state = useAppStore.getState();
  const geometry = state.geometry;
  const meshData = state.meshData;

  let geometryContext = "DADOS GEOMÉTRICOS DA PEÇA (NUNCA UNDEFINED):\n";
  if (geometry) {
    geometryContext += `- Dimensões: ${geometry.boundingBox?.x ?? "?"}×${geometry.boundingBox?.y ?? "?"}×${geometry.boundingBox?.z ?? "?"} mm\n`;
    geometryContext += `- Volume: ${geometry.volume ?? "?"} cm³\n`;
    geometryContext += `- Área: ${geometry.surfaceArea ?? "?"} cm²\n`;
    geometryContext += `- Peso estimado: ${((geometry.volume || 0) * 1.24).toFixed(1)} g\n`;
    geometryContext += `- Triângulos: ${geometry.triangleCount ?? (meshData?.triangles || []).length ?? "?"}\n`;
    
    if (geometry.boundingBox) {
      const ratio = geometry.boundingBox.z / Math.max(geometry.boundingBox.x, geometry.boundingBox.y, 1);
      geometryContext += `- Razão altura/base: ${ratio.toFixed(2)}\n`;
    }
    
    geometryContext += `- Tipo detectado: ${detectModelType({
      width: geometry.boundingBox?.x ?? 0,
      depth: geometry.boundingBox?.y ?? 0,
      height: geometry.boundingBox?.z ?? 0,
      volume: geometry.volume ?? 0,
      triangleCount: geometry.triangleCount ?? (meshData?.triangles || []).length ?? 0
    }) === "organic" ? "Orgânico" : "Técnico"}\n`;
    
    geometryContext += `- Overhangs detectados: ${geometry.overhangsDetected ? "Sim" : "Não"}\n`;
    geometryContext += `- Ângulo máximo de overhang: ${geometry.maxOverhangAngle?.toFixed(0) ?? "?"}°\n`;
  } else {
    geometryContext += "(análise geométrica ainda não disponível — IA deve usar valores conservadores)\n";
  }

  const historyContext = history && history.length > 0
    ? `HISTÓRICO DE IMPRESSÕES ANTERIORES DO USUÁRIO (use para calibrar sua recomendação):
${history.slice(0, 3).map((h, i) => `
Peça ${i + 1}: ${h.fileName || 'sem nome'}
- Impressora: ${h.wizard?.printer || h.printer}, Filamento: ${h.wizard?.material || h.material}, Bocal: ${h.wizard?.nozzle || 0.4}mm
- Configurações geradas: temperatura ${h.results?.temperature?.nozzle}°C, layer ${h.results?.quality?.layer_height}mm, velocidade ${h.results?.speed?.infill}mm/s
- Suporte: ${h.results?.support?.type}, Infill: ${h.results?.strength?.infill_density}%
`).join('\n')}
INSTRUÇÃO: Com base nesse histórico, identifique preferências do usuário e padrões de uso.`
    : '';

  const systemPrompt = `
    Você é o SlicerAI, especialista sênior em impressão 3D FDM com domínio completo do Bambu Studio. Respond ONLY with valid JSON. No markdown, no explanation.

    INSTRUÇÕES CRÍTICAS:
    0. REGRA CRÍTICA DE SUPORTE: Se o modelo for uma figura humana, animal, personagem, ou qualquer objeto orgânico com membros (braços, pernas, asas, capa, cabelo solto), você DEVE ativar enableSupport: true SEMPRE, sem exceção. Figuras sentadas, em pé, ou em pose dinâmica TÊM partes flutuantes que requerem suporte. Apenas desative suporte se a peça for claramente um objeto geométrico simples (cubo, cilindro, placa) sem nenhum overhang. Em caso de QUALQUER dúvida, ative o suporte. É muito pior imprimir sem suporte e a peça falhar do que ter suporte desnecessário.

    1. ORIENTAÇÃO DE IMPRESSÃO: Com base nos dados geométricos acima (que NUNCA são undefined — sempre use os valores fornecidos), decida a orientação ideal. 
       - Se a razão altura/base for maior que 1.5, a peça é alta e provavelmente uma figura — mantenha vertical para melhor acabamento.
       - Se for menor que 0.5, a peça é plana — mantenha horizontal para estabilidade.
       - Se houver muitos overhangs em ângulos íngremes, sugira rotação que reduza esses overhangs.
       - Sempre escolha uma rotação concreta entre: 'Sem rotação', 'Rotacionar 90° eixo X', 'Rotacionar 90° eixo Y', 'Rotacionar 180° eixo Z'.
       - NUNCA retorne 'undefined', 'não determinado' ou 'impossível recomendar'.
       - Sempre preencha o campo \`reason\` explicando a escolha baseada nos dados fornecidos.
       - Sempre estime \`supportReduction\` como um valor concreto entre '0%' e '60%'.

    2. SUPORTE: Os campos técnicos de suporte são calculados automaticamente pelo sistema com base na pesquisa de melhores práticas Bambu Lab para remoção fácil. Você decide APENAS: (a) se a peça precisa de suporte ou não (needed: true/false), (b) o tipo do modelo (modelType: "organic" para figuras, personagens, animais, ou "technical" para peças mecânicas e geométricas) — o sistema aplica automaticamente o perfil completo otimizado. Inclua no JSON apenas needed e modelType dentro do objeto support, e explique no supportReason por que ativou ou não.

    3. A posição da costura (seam position) é decidida automaticamente pelo sistema com base em melhores práticas da comunidade Bambu Lab — você não precisa retornar este campo. Não inclua seamPosition nem seam_position na resposta JSON.
    4. Adicione o campo seamReason no objeto quality.
    5. Decida AUTOMATICAMENTE se o ironing (alisamento) é benéfico.
    6. EXPLICAÇÕES DIDÁTICAS (Campo decisions): Justifique cada escolha principal em 1 ou 2 frases curtas no campo decisions.
  `;

  const improvementContext = improvementImage 
    ? `
ALERTA DE MELHORIA (Versão v${currentVersion}):
O usuário enviou um print screen do fatiamento no Bambu Studio usando as configurações da versão v${currentVersion}.
Analise a imagem e melhore os parâmetros.
CONFIGURAÇÕES v${currentVersion} ATUAIS:
${JSON.stringify(previousResults, null, 2)}
` : '';

  const userMessage = `
${geometryContext}

Analise este modelo 3D e gere as melhores configurações para o Bambu Studio.

CONFIGURAÇÕES:
- Impressora: ${wizard.printer} | Nozzle: ${wizard.nozzle}mm
- AMS: ${wizard.hasAMS ? "Sim" : "Não"}, ${wizard.amsSlotCount} slots
- Material: ${wizard.material} (${wizard.variant})
${wizard.hasAMS ? wizard.amsSlots.slice(0, wizard.amsSlotCount).map(s => `- Slot ${s.slot}: ${s.material}`).join('\n') : ''}
- Build plate: ${wizard.buildPlate}
- Propósitos: ${wizard.purposes.join(', ')}

Retorne este JSON exato (todos os campos obrigatórios):
{
  "quality": { "layer_height": number, "first_layer_height": number, "seam_position": string, "seamReason": string, "improveReason": string, "ironing": boolean, "ironing_flow": number, "ironing_speed": number },
  "strength": { "infill_density": number, "infill_pattern": string, "wall_loops": number, "top_layers": number, "bottom_layers": number, "top_surface_pattern": string, "bottom_surface_pattern": string },
  "support": { "needed": boolean, "type": string, "style": string, "threshold_angle": number, "supportReason": string },
  "temperature": { "nozzle": number, "nozzle_first_layer": number, "bed": number, "bed_first_layer": number, "chamber": number, "chamber_required": boolean, "part_cooling_fan": number, "part_cooling_first_layer": number },
  "speed": { "outer_wall": number, "inner_wall": number, "top_surface": number, "bottom_surface": number, "infill": number, "travel": number, "first_layer": number, "bridge": number, "overhang_slow": number },
  "ams": { "wipe_tower_enabled": boolean, "wipe_tower_width": number, "flush_multiplier": number, "flush_into_infill": boolean, "flush_into_objects": boolean, "prime_all_extruders": boolean },
  "adhesion": { "brim_type": string, "brim_width": number, "skirt_loops": number },
  "advanced": { "elephant_foot_compensation": number, "enable_overhang_speed": boolean, "bridge_flow": number, "precise_outer_wall": boolean, "thick_bridges": boolean, "small_perimeter_speed": number },
  "estimates": { "print_time_minutes": number, "filament_grams": number, "filament_meters": number, "estimated_cost_brl": number },
  "explanation": { "layer_height_reason": string, "infill_reason": string, "support_reason": string, "material_plate_tips": string, "postprocessing_tips": string, "warnings": [string], "pre_print_checklist_extra": [string] },
  "profile_name_suggestion": string,
  "decisions": { "layerHeight": string, "wallLoops": string, "infillDensity": string, "infillPattern": string, "printSpeed": string, "support": string, "seam": string, "ironing": string, "temperatures": string, "overall": string },
  "improvements": { "campo": "motivo" },
  "orientation": { "rotation": "string", "reason": "string", "supportReduction": "string" }
}
  `;

  const fullPrompt = `${historyContext}\n\n${improvementContext}\n\n${systemPrompt}\n\n${userMessage}`;

  let claudeKey = useSettingsStore.getState().claudeKey;
  
  if (userProfile?.api_key_mode === 'centralized') {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          improvementImage,
        }),
      }
    );
    
    if (!response.ok) {
       throw new Error(`Claude Proxy error: ${response.statusText}`);
    }
    const data = await response.json();
    const content = data?.content?.[0]?.text;
    if (!content) throw new Error("Empty response from Claude Proxy");
    const parsed = parseAIResponse(content);
    return AIResponseSchema.parse(parsed) as any;
  }

  if (!claudeKey) throw new Error('NO_API_KEY');

  const content = await callClaude(fullPrompt, claudeKey, improvementImage);
  if (!content) throw new Error("Empty response from Claude");
  const parsed = parseAIResponse(content);

  const result = AIResponseSchema.safeParse(parsed);
  if (!result.success) {
    const defaults = AIResponseSchema.parse({});
    const merged = { ...defaults, ...parsed };
    for (const key of Object.keys(defaults)) {
      if (typeof (defaults as any)[key] === 'object' && (parsed as any)[key]) {
        (merged as any)[key] = { ...(defaults as any)[key], ...(parsed as any)[key] };
      }
    }
    return merged as any;
  }

  return result.data as any;
};

export const testClaudeKey = async (apiKey: string): Promise<"ok" | "invalid" | "error"> => {
  try {
    const content = await callClaude("ok", apiKey);
    return content ? "ok" : "error";
  } catch (e: any) {
    if (e.code === "INVALID_KEY") return "invalid";
    return "error";
  }
};
