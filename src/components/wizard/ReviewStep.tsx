import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { generateSettings } from "../../lib/ai";
import { Sparkles, Printer, Box, Layers, Play, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";

export const ReviewStep: React.FC = () => {
  const { wizard, setResults, status } = useAppStore();
  const { apiKey, addToHistory } = useSettingsStore();
  
  const estimatedWeight = wizard.geometryStats 
    ? (wizard.geometryStats.volume * (MATERIAL_DENSITIES[wizard.material as keyof typeof MATERIAL_DENSITIES] || 1.24)).toFixed(1)
    : 0;

  // Simple heuristic for print time (min)
  const estimatedTime = wizard.geometryStats 
    ? Math.round((wizard.geometryStats.volume * 5) / (wizard.layerHeight * 2))
    : 45;

  const handleGenerate = async () => {
    if (!apiKey) {
      alert("Por favor, insira sua chave da OpenAI nas configurações.");
      return;
    }

    useAppStore.setState({ status: 'generating' });
    try {
      const results = await generateSettings(apiKey, wizard as any);
      setResults(results);
      
      // Capturar thumbnail (snapshot do canvas)
      let thumbnail = "";
      const canvas = document.querySelector('canvas');
      if (canvas) {
          thumbnail = canvas.toDataURL('image/png');
      }

      const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: wizard.fileName,
        printer: wizard.printer,
        material: wizard.material,
        color: wizard.hasAMS ? wizard.amsSlots[0].color : wizard.baseColor,
        thumbnail,
        results,
        wizardState: wizard as any,
      };
      addToHistory(entry);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar configurações. Verifique sua chave API.");
      useAppStore.setState({ status: 'ready' });
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="p-8 bg-surface-raised border border-white/10 rounded-[2rem] space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted flex items-center gap-3">
                <Box className="w-3.5 h-3.5 text-primary" />
                Resumo da Configuração
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black text-primary uppercase">Validado</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
          <ReviewItem label="Impressora" value={`${wizard.printer} (${wizard.nozzle}mm)`} />
          <ReviewItem label="Material" value={`${wizard.material} ${wizard.variant}`} />
          <ReviewItem label="Mesa" value={wizard.buildPlate.split(' ')[0]} />
          <ReviewItem label="Altura Camada" value={`${wizard.layerHeight.toFixed(2)}mm`} />
          <ReviewItem label="Peso Estimado" value={`${estimatedWeight}g`} />
          <ReviewItem label="Propósitos" value={wizard.purposes.join(', ')} />
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Layers className="w-4 h-4 text-muted/50" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted/50">Tempo est. de Impressão</span>
          </div>
          <span className="text-sm font-mono font-black italic text-white">~{Math.floor(estimatedTime / 60)}h {estimatedTime % 60}min</span>
        </div>
      </div>

      <div className="space-y-4">
        <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
            "w-full py-10 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group",
            isGenerating 
                ? "bg-surface-raised cursor-wait" 
                : "bg-primary text-white hover:bg-primary-hover shadow-[0_0_40px_rgba(0,200,180,0.2)] hover:shadow-[0_0_60px_rgba(0,200,180,0.4)]"
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            
            {isGenerating ? (
            <GeneratingState />
            ) : (
            <>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
                <Sparkles className="w-8 h-8 fill-white" />
                </div>
                <div className="text-center space-y-1">
                    <span className="text-2xl font-black tracking-tighter italic uppercase block">Gerar com SlicerAI</span>
                    <span className="text-[10px] opacity-70 font-black uppercase tracking-[0.4em] block pl-1">Otimização gpt-4o</span>
                </div>
            </>
            )}
        </button>

        {!apiKey && (
            <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-center justify-center gap-3 animate-pulse">
                <span className="text-[10px] text-destructive font-black uppercase tracking-widest">⚠️ Chave OpenAI não configurada nas ⚙️ Configurações</span>
            </div>
        )}
      </div>
    </div>
  );
};

const ReviewItem = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1 group">
    <p className="text-[9px] text-muted uppercase font-black tracking-widest opacity-40 group-hover:opacity-70 transition-opacity">{label}</p>
    <p className="text-sm font-bold text-white truncate italic">{value}</p>
  </div>
);

const GeneratingState = () => {
    const [msgIndex, setMsgIndex] = React.useState(0);
    const messages = [
        "Lendo geometria...",
        "Aplicando perfis de material...",
        "Otimizando suportes...",
        "Calculando velocidades...",
        "Gerando relatório final..."
    ];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % messages.length);
        }, 1500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] animate-pulse text-white/80">{messages[msgIndex]}</span>
        </div>
    );
};
