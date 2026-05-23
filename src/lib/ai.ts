import { z } from "zod";
import { WizardState, AIResponse } from "./types";
import { supabase } from "../integrations/supabase/client";
import { useSettingsStore } from "../store/useAppStore";
import { detectModelType, getSupportProfile } from "./supportProfiles";


const aiResponseSchema = z.object({
  quality: z.object({
    layer_height: z.number(),
    first_layer_height: z.number(),
    seam_position: z.string(),
    seamReason: z.string().optional(),
    improveReason: z.string().optional(),
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
    needed: z.boolean().optional().default(false),
    type: z.string().optional().default("tree(auto)"),
    style: z.string().optional().default("tree_organic"),
    threshold_angle: z.number().optional().default(45),
    top_z_distance: z.number().optional().default(0.2),
    bottom_z_distance: z.number().optional().default(0.2),
    xy_distance: z.number().optional().default(0.35),
    interface_layers: z.number().optional().default(2),
    interface_pattern: z.string().optional().default("concentric"),
    tree_support_angle: z.number().optional().default(45),
    on_build_plate_only: z.boolean().optional().default(true),
    supportReason: z.string().optional().default("Calculado com base na geometria")
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
  profile_name_suggestion: z.string(),
  decisions: z.object({
    layerHeight: z.string(),
    wallLoops: z.string(),
    infillDensity: z.string(),
    infillPattern: z.string(),
    printSpeed: z.string(),
    support: z.string(),
    seam: z.string(),
    ironing: z.string(),
    temperatures: z.string(),
    overall: z.string()
  }),
  improvements: z.record(z.string()).optional()
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
  userProfile: any,
  history: any[] = [],
  improvementImage?: string,
  currentVersion?: number,
  previousResults?: AIResponse
): Promise<AIResponse> => {
  const historyContext = history && history.length > 0
    ? `HISTÓRICO DE IMPRESSÕES ANTERIORES DO USUÁRIO (use para calibrar sua recomendação):
${history.slice(0, 3).map((h, i) => `
Peça ${i + 1}: ${h.fileName || 'sem nome'}
- Impressora: ${h.wizard?.printer || h.printer}, Filamento: ${h.wizard?.material || h.material}, Bocal: ${h.wizard?.nozzle || 0.4}mm
- Configurações geradas: temperatura ${h.results?.temperature?.nozzle}°C, layer ${h.results?.quality?.layer_height}mm, velocidade ${h.results?.speed?.infill}mm/s
- Suporte: ${h.results?.support?.type}, Infill: ${h.results?.strength?.infill_density}%
`).join('\n')}
INSTRUÇÃO: Com base nesse histórico, identifique preferências do usuário e padrões de uso. Se o usuário imprime frequentemente peças funcionais, priorize resistência. Se imprime peças decorativas, priorize acabamento.`
    : '';

  const systemPrompt = `
    Você é o SlicerAI, especialista sênior em impressão 3D FDM com domínio completo do Bambu Studio (versão mais recente, 2024-2025). Conhece todos os perfis, materiais, build plates, configurações AMS, suporte, velocidade, temperatura e nuances de cada impressora Bambu Lab. Responda sempre em português do Brasil (ou inglês se o usuário selecionou EN). Seja preciso, técnico e acessível. Justifique cada recomendação com base nos dados de geometria e escolhas do usuário. Respond ONLY with valid JSON. No markdown, no explanation. Retorne APENAS JSON válido conforme o schema solicitado, sem markdown, sem texto extra.

    INSTRUÇÕES CRÍTICAS:
    1. O campo support.type é OBRIGATÓRIO e NUNCA pode ser omitido na resposta JSON. Use 'tree(auto)' para figuras orgânicas, personagens e animais. Use 'normal(auto)' para peças técnicas e mecânicas. Use 'tree(organic)' para figuras muito detalhadas onde a remoção do suporte precisa ser fácil.
    2. Os campos de suporte já foram calculados automaticamente com base na geometria. Não inclua support_type, support_style, support_interface_pattern nem nenhum campo support_ na sua resposta JSON. Justifique a necessidade de suporte em supportReason se necessário, mas não defina os parâmetros técnicos de suporte.

    2. Escolha o seam_position mais adequado para a peça usando estes critérios:
       - Use "back" para figuras humanas, personagens e animais pois esconde a costura na parte traseira.
       - Use "aligned" para peças técnicas e mecânicas onde a costura alinhada facilita pós-processamento.
       - Use "nearest" para peças com geometria complexa e muitas curvas onde velocidade importa mais.
       - Use "random" apenas para peças decorativas orgânicas onde nenhuma face é preferível.
    3. Adicione o campo seamReason no objeto quality com uma frase curta explicando a escolha, por exemplo "Figura humana — costura posicionada na parte traseira para ficar invisível".
    4. Decida AUTOMATICAMENTE se o ironing (alisamento) é benéfico baseado no propósito e geometria da peça.
    5. Escolha uma cor de filamento funcional e apropriada para o propósito do objeto.
    6. O usuário NÃO fornece estas escolhas (incluindo suportes e seam position) - VOCÊ decide baseado na sua expertise técnica.

    8. Você tem acesso ao histórico de impressões do usuário acima. Use-o para: 1) Identificar as preferências de impressora e material do usuário, 2) Calibrar as recomendações de temperatura e velocidade com base no que funcionou anteriormente, 3) Melhorar as decisões de suporte e qualidade ao longo do tempo. Se esta for a primeira impressão (sem histórico), use padrões seguros.
    9. SE FOR FORNECIDA UMA IMAGEM DE MELHORIA: Analise o print screen do fatiamento, identifique problemas visíveis como stringing excessivo, má adesão, suportes desnecessários, qualidade de superfície ruim, ou tempo de impressão muito alto, e gere um perfil melhorado corrigindo esses problemas. Explique em quality.improveReason o que foi identificado e o que foi ajustado. O novo perfil gerado deve ter o número da versão incrementado. Inclua também o campo improvements no JSON de resposta, contendo um objeto onde as chaves são os nomes das configurações alteradas e os valores explicam especificamente o que foi visto no print screen que motivou o ajuste.
    10. EXPLICAÇÕES DIDÁTICAS (Campo decisions): Para cada configuração principal escolhida, você DEVE explicar em português em 1 ou 2 frases curtas e didáticas o MOTIVO da sua escolha no campo decisions do JSON. Imagine que está ensinando um iniciante. Mencione características da geometria da peça que influenciaram a decisão. 
        Exemplos de tom e conteúdo:
        - layerHeight: "Escolhi 0.20mm pois a peça tem detalhes finos no rosto e capacete — camadas mais finas capturam melhor as curvas sem perder muito tempo."
        - support: "Ativei suporte do tipo tree pois os braços formam ângulos de 70° — sem suporte essas partes colapsariam durante a impressão."
        - ironing: "Desatvei o ironing pois a peça é uma figura com superfícies curvas — o ironing só beneficia superfícies planas e adicionaria 40 minutos desnecessários."
  `;

  const improvementContext = improvementImage 
    ? `
ALERTA DE MELHORIA (Versão v${currentVersion}):
O usuário enviou um print screen do fatiamento no Bambu Studio usando as configurações da versão v${currentVersion} (fornecidas abaixo).
Analise a imagem em anexo e melhore os parâmetros.

CONFIGURAÇÕES v${currentVersion} ATUAIS:
${JSON.stringify(previousResults, null, 2)}

INSTRUÇÃO ADICIONAL: "O usuário aplicou o perfil v${currentVersion} e fatiou o modelo. Analise o print screen do fatiamento, identifique problemas visíveis como stringing excessivo, má adesão, suportes desnecessários, qualidade de superfície ruim, ou tempo de impressão muito alto, e gere um perfil melhorado corrigindo esses problemas. Explique em \`improveReason\` o que foi identificado e o que foi ajustado."
` : '';

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
- Material: ${wizard.material} (${wizard.variant})
${wizard.hasAMS ? wizard.amsSlots.slice(0, wizard.amsSlotCount).map(s => `- Slot ${s.slot}: ${s.material}`).join('\n') : ''}
- Flush AMS: ${wizard.flushStrategy} | Wipe tower: ${wizard.wipeTower ? "Sim" : "Não"}
- Build plate: ${wizard.buildPlate}
- Layer height: ${wizard.layerHeight}mm
- Propósitos: ${wizard.purposes.join(', ')}

- Custo filamento: R$120/kg

Retorne este JSON exato (todos os campos obrigatórios):
{
  "quality": { "layer_height": number, "first_layer_height": number, "seam_position": string, "seamReason": string, "improveReason": string, "ironing": boolean, "ironing_flow": number, "ironing_speed": number },
  "strength": { "infill_density": number, "infill_pattern": string, "wall_loops": number, "top_layers": number, "bottom_layers": number, "top_surface_pattern": string, "bottom_surface_pattern": string },
  "support": { "needed": boolean, "type": string, "style": string, "threshold_angle": number, "top_z_distance": number, "bottom_z_distance": number, "xy_distance": number, "interface_layers": number, "interface_pattern": string, "tree_support_angle": number, "on_build_plate_only": boolean, "supportReason": string },
  "temperature": { "nozzle": number, "nozzle_first_layer": number, "bed": number, "bed_first_layer": number, "chamber": number, "chamber_required": boolean, "part_cooling_fan": number, "part_cooling_first_layer": number },
  "speed": { "mode": string, "outer_wall": number, "inner_wall": number, "top_surface": number, "bottom_surface": number, "infill": number, "travel": number, "first_layer": number, "bridge": number, "overhang_slow": number },
  "ams": { "wipe_tower_enabled": boolean, "wipe_tower_width": number, "flush_multiplier": number, "flush_into_infill": boolean, "flush_into_objects": boolean, "prime_all_extruders": boolean },
  "adhesion": { "brim_type": string, "brim_width": number, "skirt_loops": number },
  "advanced": { "elephant_foot_compensation": number, "enable_overhang_speed": boolean, "bridge_flow": number, "precise_outer_wall": boolean, "thick_bridges": boolean, "small_perimeter_speed": number },
  "estimates": { "print_time_minutes": number, "filament_grams": number, "filament_meters": number, "filament_per_color": [{ "slot": number, "color": string, "grams": number, "meters": number }], "estimated_cost_brl": number },
  "explanation": { "layer_height_reason": string, "infill_reason": string, "support_reason": string, "material_plate_tips": string, "postprocessing_tips": string, "warnings": [string], "pre_print_checklist_extra": [string] },
  "profile_name_suggestion": string,
  "decisions": { "layerHeight": string, "wallLoops": string, "infillDensity": string, "infillPattern": string, "printSpeed": string, "support": string, "seam": string, "ironing": string, "temperatures": string, "overall": string },
  "improvements": { "campo": "o que foi visto no print e por que mudou" }
}
  `;

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

    response = await fetch(
      "https://lgjbjvauavgtbtfejcwc.supabase.co/functions/v1/ai-proxy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "claude",
          apiKey: cleanKey,
          prompt: fullPrompt,
          imageBase64: improvementImage ? improvementImage.split(',')[1] : undefined
        }),
      }
    );
  } else if (aiProvider === 'openai') {
    const openaiKey = useSettingsStore.getState().openaiKey;
    if (!openaiKey) throw new Error('NO_API_KEY');
    const cleanKey = openaiKey.trim().replace(/[^\x20-\x7E]/g, "");

    response = await fetch(
      "https://lgjbjvauavgtbtfejcwc.supabase.co/functions/v1/ai-proxy",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          apiKey: cleanKey,
          prompt: fullPrompt,
          imageBase64: improvementImage ? improvementImage.split(',')[1] : undefined
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
  const repaired = repairJSON(content);
  const parsed = JSON.parse(repaired);

  // Fallback for support fields from geometric profiles if AI didn't provide them
  if (parsed.support && wizard.geometryStats) {
    const modelType = detectModelType({
      width: wizard.geometryStats.boundingBox.x,
      depth: wizard.geometryStats.boundingBox.y,
      height: wizard.geometryStats.boundingBox.z,
      volume: wizard.geometryStats.volume,
      triangleCount: wizard.geometryStats.triangleCount || 10000 // Default if missing
    });
    
    const geometricSupport = getSupportProfile(modelType);
    
    // Fill in missing fields from geometric profile
    parsed.support.type = parsed.support.type || geometricSupport.support_type;
    parsed.support.style = parsed.support.style || geometricSupport.support_style;
    parsed.support.threshold_angle = parsed.support.threshold_angle || Number(geometricSupport.support_threshold_angle);
    parsed.support.top_z_distance = parsed.support.top_z_distance || Number(geometricSupport.support_top_z_distance);
    parsed.support.bottom_z_distance = parsed.support.bottom_z_distance || Number(geometricSupport.support_bottom_z_distance);
    parsed.support.xy_distance = parsed.support.xy_distance || Number(geometricSupport.support_object_xy_distance);
    parsed.support.interface_layers = parsed.support.interface_layers || Number(geometricSupport.support_interface_top_layers);
    parsed.support.interface_pattern = parsed.support.interface_pattern || geometricSupport.support_interface_pattern;
    parsed.support.tree_support_angle = parsed.support.tree_support_angle || Number(geometricSupport.tree_support_branch_angle);
    
    // Explicitly set needed based on geometry if not specified
    if (parsed.support.needed === undefined) {
      parsed.support.needed = wizard.geometryStats.overhangsDetected;
    }
  }

  return aiResponseSchema.parse(parsed);
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
