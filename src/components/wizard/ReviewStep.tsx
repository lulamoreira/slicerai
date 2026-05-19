import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { generateSettings } from "../../lib/ai";
import { Sparkles, Printer, Box, Layers, Play } from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";

export const ReviewStep: React.FC = () => {
  const { wizard, setResults, setStatus, status } = useAppStore();
  const { apiKey } = useSettingsStore();
  
  const estimatedWeight = wizard.geometryStats 
    ? (wizard.geometryStats.volume * (MATERIAL_DENSITIES[wizard.material] || 1.24)).toFixed(1)
    : 0;

  const handleGenerate = async () => {
    if (!apiKey) {
      alert("Por favor, insira sua chave da OpenAI nas configurações.");
      return;
    }

    useAppStore.setState({ status: 'generating' });
    try {
      const results = await generateSettings(apiKey, wizard);
      setResults(results);
      
      // Save to history
      const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: wizard.fileName,
        printer: wizard.printer,
        material: wizard.material,
        color: wizard.hasAMS ? wizard.amsSlots[0].color : wizard.baseColor,
        thumbnail: "",
        results,
        wizardState: wizard,
      };
      useSettingsStore.getState().addToHistory(entry);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar configurações. Verifique sua chave API.");
      useAppStore.setState({ status: 'ready' });
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-6 bg-surface-raised border border-white/10 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
        
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
          <Box className="w-3 h-3 text-primary" />
          Resumo Final
        </h3>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
          <ReviewItem label="Impressora" value={`${wizard.printer} (${wizard.nozzle}mm)`} />
          <ReviewItem label="Material" value={`${wizard.material} ${wizard.variant}`} />
          <ReviewItem label="Mesa" value={wizard.buildPlate} />
          <ReviewItem label="Peso Est." value={`${estimatedWeight}g`} />
          <ReviewItem label="Prioridade" value={wizard.priority < 40 ? "Qualidade" : wizard.priority > 60 ? "Velocidade" : "Equilibrado"} />
          <ReviewItem label="Uso" value={wizard.useCase} />
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted/50">Tempo est. de fatiamento</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">~45 segundos</span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "w-full py-8 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group",
          isGenerating 
            ? "bg-surface-raised cursor-wait" 
            : "bg-primary text-white hover:bg-primary-hover shadow-[0_0_30px_rgba(0,200,180,0.3)] hover:shadow-[0_0_50px_rgba(0,200,180,0.5)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
        
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest animate-pulse">SlicerAI está pensando...</span>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner">
              <Sparkles className="w-7 h-7 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tighter italic uppercase">Gerar Configurações com IA</span>
            <span className="text-[9px] opacity-70 font-black uppercase tracking-[0.3em]">Bambu Studio Optimized</span>
          </>
        )}
      </button>

      {!apiKey && (
        <p className="text-center text-[10px] text-destructive font-black uppercase tracking-widest bg-destructive/5 py-3 rounded-xl border border-destructive/10">
          ⚠️ Chave OpenAI não configurada
        </p>
      )}
    </div>
  );
};

const ReviewItem = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <p className="text-[9px] text-muted uppercase font-black tracking-widest opacity-50">{label}</p>
    <p className="text-sm font-bold text-white truncate">{value}</p>
  </div>
);
