import { z } from "zod";
import { WizardState, AIResponse } from "./types";
import { supabase } from "../integrations/supabase/client";
import { useSettingsStore } from "../store/useAppStore";
import { detectModelType, getSupportProfile } from "./supportProfiles";


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

const aiResponseSchema = AIResponseSchema;



export const parseAIResponse = (text: string): any => {
  let cleaned = text.trim();
  // Remove markdown code blocks que Claude e outros modelos adicionam
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  
  // Remove qualquer texto antes do primeiro {
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tenta fechar chaves abertas
    const opens = (cleaned.match(/{/g) || []).length;
    const closes = (cleaned.match(/}/g) || []).length;
    const missing = opens - closes;
    if (missing > 0) {
      const repaired = cleaned + "}".repeat(missing);
      try { return JSON.parse(repaired); } catch {}
    }
    // Remove última propriedade incompleta e tenta novamente
    const fallback = cleaned.replace(/,\s*"[^"]*"\s*:\s*[^,}]*$/, "") + "}".repeat(Math.max(0, opens - closes));
    try {
      return JSON.parse(fallback);
    } catch (e) {
      console.error("Final parse failure:", e, "Cleaned text:", cleaned);
      throw e;
    }
  }
};

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
  userProfile: any,
  history: any[] = [],
  improvementImage?: string,
  currentVersion?: number,
  previousResults?: AIResponse
): Promise<AIResponse> => {
  const stats = wizard.geometryStats;
  const dimensions = stats?.boundingBox || { x: 0, y: 0, z: 0 };
  const volume = (stats?.volume || 0).toFixed(2);
  const surfaceArea = (stats?.surfaceArea || 0).toFixed(2);
  const hasOverhangs = stats?.overhangsDetected || false;
  const maxOverhangAngle = (stats?.maxOverhangAngle || 0).toFixed(0);
  const triangleCount = stats?.triangleCount || 0;
  const modelType = detectModelType({
    width: dimensions.x,
    depth: dimensions.y,
    height: dimensions.z,
    volume: stats?.volume || 0,
    triangleCount: triangleCount
  }) === "organic" ? "Orgânico" : "Técnico";

  const heightBaseRatio = (dimensions.z / Math.max(dimensions.x, dimensions.y || 1)).toFixed(2);
  const weight = ((stats?.volume || 0) * 1.24).toFixed(1); // Estimativa padrão baseada em PLA

  const geometryContext = `
ANÁLISE GEOMÉTRICA DA PEÇA:
- Dimensões: ${dimensions.x.toFixed(1)}×${dimensions.y.toFixed(1)}×${dimensions.z.toFixed(1)}mm
- Volume: ${volume}cm³
- Área de superfície: ${surfaceArea}cm²
- Peso estimado: ${weight}g
- Razão altura/base: ${heightBaseRatio}
- Overhangs detectados: ${hasOverhangs ? "Sim" : "Não"}
- Ângulo máximo de overhang: ${maxOverhangAngle}°
- Triângulos: ${triangleCount}
- Tipo detectado: ${modelType}
  `.trim();

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
    1. ORIENTAÇÃO DE IMPRESSÃO: Com base nos dados geométricos acima (que NUNCA são undefined — sempre use os valores fornecidos), decida a orientação ideal. 
       - Se a razão altura/base for maior que 1.5, a peça é alta e provavelmente uma figura — mantenha vertical para melhor acabamento.
       - Se for menor que 0.5, a peça é plana — mantenha horizontal para estabilidade.
       - Se houver muitos overhangs em ângulos íngremes, sugira rotação que reduza esses overhangs.
       - NUNCA retorne 'undefined', 'não determinado' ou 'impossível recomendar' — sempre escolha uma orientação concreta entre: 'Sem rotação — orientação padrão é ideal', 'Rotacionar 90° no eixo X', 'Rotacionar 180° no eixo Z', 'Rotacionar 90° no eixo Y'.
       - Sempre preencha o campo \`reason\` explicando a escolha baseada nos dados fornecidos.
       - Sempre estime \`supportReduction\` como um valor concreto entre '0%' e '60%'.

    2. O campo support.type é OBRIGATÓRIO. Use 'tree(auto)' para modelos orgânicos e 'normal(auto)' para peças técnicas.
    3. Escolha o seam_position mais adequado (back, aligned, nearest, random).
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
  const fullPrompt = `${historyContext}\n\n${improvementContext}\n\n${systemPrompt}\n\n${userMessage}`;


  const messageContents: any[] = [];
  if (improvementImage) {
    messageContents.push({
      text: fullPrompt
    });
    messageContents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: improvementImage.split(',')[1] // remove data:image/jpeg;base64,
      }
    });
  } else {
    messageContents.push({ text: fullPrompt });
  }

  let response: Response;
  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens: 4096,
  };

  const aiProvider = useSettingsStore.getState().aiProvider;

  if (userProfile?.api_key_mode === 'centralized' && aiProvider === 'gemini') {
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
          contents: [{ parts: messageContents }],
          generationConfig,
        }),
      }
    );
  } else if (aiProvider === 'groq') {
    const groqApiKey = useSettingsStore.getState().groqApiKey;
    if (!groqApiKey) throw new Error('NO_API_KEY');
    const cleanKey = groqApiKey.trim().replace(/[^\x20-\x7E]/g, "");

    const messages = [];
    if (improvementImage) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          { type: "image_url", image_url: { url: improvementImage } }
        ]
      });
    } else {
      messages.push({ role: "user", content: fullPrompt });
    }

    const groqModels = improvementImage 
      ? ["llava-v1.5-7b-4096-preview", "llama-3.2-90b-vision-preview"] 
      : ["llama-3.3-70b-versatile"];
    
    let groqResponse: Response | undefined;
    for (const model of groqModels) {
      const currentTry = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${cleanKey}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: improvementImage ? 2048 : 8192,
            response_format: { type: "json_object" }
          }),
        }
      );
      groqResponse = currentTry;
      if (currentTry.ok) break;
      const errData = await currentTry.json().catch(() => ({}));
      if (improvementImage && (currentTry.status === 400 || errData?.error?.message?.includes("decommissioned") || errData?.error?.code === "model_not_found")) {
        console.log(`Groq: model ${model} failed, trying next fallback...`);
        continue;
      }
      break;
    }
    if (!groqResponse) throw new Error("Falha ao conectar com Groq");
    response = groqResponse;
  } else if (aiProvider === 'deepseek') {
    const deepseekKey = useSettingsStore.getState().deepseekKey;
    if (!deepseekKey) throw new Error('NO_API_KEY');
    const cleanKey = deepseekKey.trim().replace(/[^\x20-\x7E]/g, "");

    response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: fullPrompt + (improvementImage ? " [IMAGE ATTACHED AND SUPPORTED VIA VISION ANALYST]" : "") }],
          temperature: 0.2,
          max_tokens: 4096,
        }),
      }
    );
  } else if (aiProvider === 'openrouter') {
    const openrouterKey = useSettingsStore.getState().openrouterKey;
    if (!openrouterKey) throw new Error('NO_API_KEY');
    const cleanKey = openrouterKey.trim().replace(/[^\x20-\x7E]/g, "");

    const messages = [];
    if (improvementImage) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          { type: "image_url", image_url: { url: improvementImage } }
        ]
      });
    } else {
      messages.push({ role: "user", content: fullPrompt });
    }

    response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://slicerai.app"
        },
        body: JSON.stringify({
          model: improvementImage ? "google/gemma-3-27b-it:free" : "meta-llama/llama-3.3-70b-instruct:free",
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        }),
      }
    );

    // Automatic fallback for OpenRouter free models if the first one fails
    if (!response.ok && response.status === 404 && !improvementImage) {
      console.log("OpenRouter: primary model not found, trying fallback 1...");
      const fallbacks = ["google/gemma-3-27b-it:free", "mistralai/mistral-7b-instruct:free"];
      
      for (const fallbackModel of fallbacks) {
        response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${cleanKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://slicerai.app"
            },
            body: JSON.stringify({
              model: fallbackModel,
              messages,
              temperature: 0.2,
              max_tokens: 4096,
            }),
          }
        );
        if (response.ok) break;
        console.log(`OpenRouter: fallback ${fallbackModel} failed, checking next...`);
      }
    }

    if (!response.ok && !improvementImage) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 404 || errData?.error?.code === 404) {
        throw {
          code: "OPENROUTER_NO_MODELS",
          provider: "OpenRouter",
          message: "OpenRouter: nenhum modelo gratuito disponível no momento. Tente outro provedor."
        };
      }
    }
  } else if (aiProvider === 'claude') {
    const claudeKey = useSettingsStore.getState().claudeKey;
    if (!claudeKey) throw new Error('NO_API_KEY');
    const cleanKey = claudeKey.trim().replace(/[^\x20-\x7E]/g, "");

    const claudeMessages = [];
    if (improvementImage) {
      claudeMessages.push({
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
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
      claudeMessages.push({ role: "user", content: fullPrompt });
    }

    response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": cleanKey,
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
  } else if (aiProvider === 'openai') {
    const openaiKey = useSettingsStore.getState().openaiKey;
    if (!openaiKey) throw new Error('NO_API_KEY');
    const cleanKey = openaiKey.trim().replace(/[^\x20-\x7E]/g, "");

    const openaiMessages = [];
    if (improvementImage) {
      openaiMessages.push({
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          { type: "image_url", image_url: { url: improvementImage } }
        ]
      });
    } else {
      openaiMessages.push({ role: "user", content: fullPrompt });
    }

    response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${cleanKey}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          temperature: 0.2,
          max_tokens: 2048,
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
          contents: [{ parts: messageContents }],
          generationConfig,
        }),
      }
    );
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errorMessage = errBody?.error?.message || errBody?.error?.status || response.statusText || "Erro desconhecido";
    
    // Model not found or decommissioned (Vision models usually)
    if (improvementImage && (response.status === 404 || response.status === 400 || errorMessage.toLowerCase().includes("not found") || errorMessage.toLowerCase().includes("decommissioned"))) {
      throw {
        code: "VISION_NOT_AVAILABLE",
        provider: aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1),
        message: "O modelo de visão atual não está disponível para este provedor."
      };
    }

    // DeepSeek/Claude/OpenAI balance error
    if (response.status === 402) {
      const providerName = aiProvider === 'claude' ? 'Claude' : aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek';
      const billingUrl = aiProvider === 'claude' ? 'console.anthropic.com' : aiProvider === 'openai' ? 'platform.openai.com' : 'platform.deepseek.com';
      throw { 
        code: "NO_BALANCE", 
        provider: providerName, 
        message: `Saldo insuficiente — seus créditos acabaram. Acesse ${billingUrl} para recarregar ou troque de provedor.` 
      };
    }

    // Gemini/Generic quota error
    if (response.status === 429) {
      const providerName = aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1);
      throw { 
        code: "QUOTA_EXCEEDED", 
        provider: providerName, 
        message: `${providerName}: Cota esgotada ou limite atingido. Tente outro provedor.` 
      };
    }

    // Invalid API key
    if (response.status === 401) {
      const providerName = aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1);
      throw { 
        code: "INVALID_KEY", 
        provider: providerName, 
        message: `Chave de API inválida para ${providerName}. Verifique nas Configurações.` 
      };
    }
    
    const providerName = aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1);
    throw new Error(
      `${providerName} [${response.status}]: ${errorMessage}`
    );
  }


  const data = await response.json();
  let content = "";
  if (aiProvider === 'claude') {
    content = data?.content?.[0]?.text;
  } else if (aiProvider === 'groq' || aiProvider === 'deepseek' || aiProvider === 'openrouter' || aiProvider === 'openai') {
    content = data?.choices?.[0]?.message?.content;
  } else {
    content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }
  
  if (!content) throw new Error(`Empty response from ${aiProvider}`);
  const parsed = parseAIResponse(content);

  const result = AIResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.warn("AI Response partial failure/missing fields:", result.error.format());
    const defaults = AIResponseSchema.parse({});
    // Profundidade 1 de merge manual para os objetos principais
    const merged = { ...defaults, ...parsed };
    // Garante que sub-objetos não sejam sobrescritos por undefined se o spread do parsed tiver a chave mas o conteúdo for parcial
    for (const key of Object.keys(defaults)) {
      if (typeof (defaults as any)[key] === 'object' && (parsed as any)[key]) {
        (merged as any)[key] = { ...(defaults as any)[key], ...(parsed as any)[key] };
      }
    }
    return merged as any;
  }

  return result.data as any;
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

export const testGroqKey = async (apiKey: string): Promise<ConnectionResult> => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/models",
      {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json" 
        }
      }
    );
    return response.ok ? "ok" : "invalid";
  } catch {
    return "error";
  }
};

export const testClaudeKey = async (apiKey: string): Promise<ConnectionResult> => {
  try {
    const response = await fetch(
      "https://lgjbjvauavgtbtfejcwc.supabase.co/functions/v1/ai-proxy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "claude",
          apiKey,
          prompt: "ok"
        })
      }
    );
    if (response.ok) return "ok";
    if (response.status === 401 || response.status === 403) return "invalid";
    return "error";
  } catch {
    return "error";
  }
};

export const testOpenAIKey = async (apiKey: string): Promise<ConnectionResult> => {
  try {
    const response = await fetch(
      "https://lgjbjvauavgtbtfejcwc.supabase.co/functions/v1/ai-proxy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          apiKey,
          prompt: "ok"
        })
      }
    );
    if (response.ok) return "ok";
    if (response.status === 401 || response.status === 403) return "invalid";
    return "error";
  } catch {
    return "error";
  }
};
