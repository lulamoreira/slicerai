import React from "react";
import { useStore } from "../../lib/store";
import { generateSettings } from "../../lib/ai";
import { Sparkles, Printer, Box, Layers, Play } from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";

export const ReviewStep: React.FC = () => {
  const { wizard, app, setResults, setGenerating, isGenerating, addToHistory } = useStore();
  
  const estimatedWeight = wizard.geometryStats 
    ? (wizard.geometryStats.volume * (MATERIAL_DENSITIES[wizard.material] || 1.24)).toFixed(1)
    : 0;

  const handleGenerate = async () => {
    if (!app.openaiKey) {
      alert("Por favor, insira sua chave da OpenAI nas configurações.");
      return;
    }

    setGenerating(true);
    try {
      const results = await generateSettings(app.openaiKey, wizard);
      setResults(results);
      
      // Save to history
      addToHistory({
        fileName: wizard.fileName,
        printer: wizard.printer,
        material: wizard.material,
        color: wizard.hasAMS ? wizard.amsSlots[0].color : wizard.baseColor,
        thumbnail: "", // Will be updated by viewer if possible
        results,
        wizardState: wizard,
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar configurações. Verifique sua chave API.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-5 bg-surface-raised border border-white/10 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Box className="w-4 h-4 text-primary" />
          Resumo da Configuração
        </h3>

        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Impressora</p>
            <p className="text-sm font-medium">{wizard.printer} ({wizard.nozzle}mm)</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Material</p>
            <p className="text-sm font-medium">{wizard.material} {wizard.variant}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Mesa</p>
            <p className="text-sm font-medium truncate">{wizard.buildPlate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Peso Est.</p>
            <p className="text-sm font-medium">{estimatedWeight}g</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tempo est. de fatiamento</span>
          </div>
          <span className="text-xs font-bold text-white">~45 segundos</span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group",
          isGenerating 
            ? "bg-surface-raised cursor-wait" 
            : "bg-primary text-white hover:bg-primary-glow shadow-[0_0_20px_rgba(0,173,181,0.3)] hover:shadow-[0_0_30px_rgba(0,173,181,0.5)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
        
        {isGenerating ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-bold animate-pulse">Consultando SlicerAI...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 fill-white" />
            </div>
            <span className="text-lg font-black tracking-tight uppercase">Gerar Configurações com IA</span>
            <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Gasta ~1.000 tokens</span>
          </>
        )}
      </button>

      {!app.openaiKey && (
        <p className="text-center text-xs text-destructive font-medium">
          ⚠️ Chave OpenAI não configurada. Clique no ícone de engrenagem.
        </p>
      )}
    </div>
  );
};
