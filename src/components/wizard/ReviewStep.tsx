import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { generateSettings } from "../../lib/ai";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Sparkles, Printer, Box, Layers, CheckCircle2,
  Package, Grid3x3, Target, Scale, Clock, Loader2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";
import { toast } from "sonner";

export const ReviewStep: React.FC = () => {
  const { wizard, setResults, status, geometry } = useAppStore();
  const { profile } = useAuthStore();
  const { 
    claudeKey, addToHistory, history: printHistory 
  } = useSettingsStore();

  const [lastError, setLastError] = React.useState<{ provider: string; message: string } | null>(null);

  const volume = geometry?.volume ?? wizard.geometryStats?.volume;
  const density = MATERIAL_DENSITIES[wizard.material as keyof typeof MATERIAL_DENSITIES] || 1.24;
  const estimatedWeight = volume != null ? (volume * density).toFixed(1) + "g" : "—";

  const estimatedTime = volume != null
    ? Math.round((volume * 5) / (wizard.layerHeight * 2))
    : 45;

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('slicerai:open-settings'));
  };

  const handleGenerate = async () => {
    const isCentralized = profile?.api_key_mode === 'centralized';
    
    if (!claudeKey && !isCentralized) {
      openSettings();
      return;
    }

    useAppStore.setState({ status: 'generating' });
    try {
      const results = await generateSettings(wizard as any, profile, printHistory);
      setResults(results);

      let thumbnail = "";
      const canvas = document.querySelector('canvas');
      if (canvas) {
        thumbnail = canvas.toDataURL('image/png');
      }

      const newEntry = {
        id: Date.now().toString(),
        fileName: wizard.fileName,
        timestamp: new Date().toISOString(),
        wizard: { ...wizard },
        results: { ...results },
        thumbnail,
      };
      
      addToHistory(newEntry as any);

      useAppStore.setState({ 
        profileVersion: 1,
        profileHistory: [{
          version: 1,
          settings: results,
          results: results,
          downloadedAt: new Date().toISOString()
        }],
        isFinalized: false
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      useAppStore.setState({ status: 'ready' });

      if (error?.code === "NO_BALANCE" || error?.code === "INVALID_KEY") {
        setLastError({
          provider: "Claude",
          message: error.message
        });
        toast.error(error.message);
        return;
      }

      const msg = error?.message || String(error);
      alert("Erro ao gerar configurações:\n\n" + msg);
    }
  };

  const isGenerating = status === 'generating';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="p-4 md:p-8 bg-surface border border-border-strong rounded-xl space-y-6 md:space-y-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="flex items-center justify-between border-b border-border pb-6">
          <h3 className="card-section-title flex items-center gap-3">
            <Box className="w-3.5 h-3.5 text-primary" />
            Resumo da Configuração
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary-subtle rounded-full border border-primary/30">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[0.65rem] font-bold text-primary uppercase">Validado</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10">
          <Row icon={Printer} label="Impressora" value={`${wizard.printer} (${wizard.nozzle}mm)`} />
          <Row icon={Package} label="Material" value={`${wizard.material} ${wizard.variant}`} />
          <Row icon={Grid3x3} label="Build Plate" value={wizard.buildPlate} />
          <Row icon={Layers} label="Camada" value={`${wizard.layerHeight.toFixed(2)}mm`} />
          <Row icon={Target} label="Propósito" value={wizard.purposes.join(', ')} />

          <Row icon={Scale} label="Análise de Geometria" value="Peso/Custo no painel lateral" highlight />
          <Row icon={Clock} label="Tempo estimado" value={volume === undefined ? "—" : `~${Math.floor(estimatedTime / 60)}h ${estimatedTime % 60}min`} mono />
          <div className="col-span-1 sm:col-span-2 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">A IA vai decidir suportes, cores, seam position e ironing com base na geometria</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {(!claudeKey && profile?.api_key_mode !== 'centralized') && (
          <div className="p-3 bg-[rgba(255,180,84,0.1)] border border-[rgba(255,180,84,0.3)] rounded-lg flex items-center justify-between gap-3">
            <span className="text-[0.85rem] font-medium text-warning">
              ⚠️ Configure sua chave Claude nas ⚙️ Configurações para continuar
            </span>
            <button
              onClick={openSettings}
              className="px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest text-warning border border-warning bg-transparent hover:bg-warning/10 transition-all whitespace-nowrap"
            >
              Abrir Configurações →
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          {printHistory.length > 0 ? (
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
              🧠 IA vai considerar seus últimos {Math.min(printHistory.length, 3)} print(s) para calibrar esta recomendação
            </span>
          ) : (
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest text-center">
              ✨ Primeira análise — a IA vai aprender com esta impressão
            </span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            "w-full py-10 rounded-xl flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group",
            isGenerating
              ? "bg-surface-raised cursor-wait"
              : "bg-primary text-[#0d0d14] hover:bg-primary-hover shadow-[var(--primary-glow)]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:animate-shimmer" />

          {isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#0d0d14]" />
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-[#0d0d14]">Analisando Geometria...</p>
                <p className="text-[10px] font-medium opacity-60 text-[#0d0d14]">Isso pode levar alguns segundos</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#0d0d14]/10 rounded-xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner border border-[#0d0d14]/10">
                <Sparkles className="w-8 h-8 fill-[#0d0d14]" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-2xl font-bold tracking-tight uppercase block text-[#0d0d14]">Gerar com SlicerAI</span>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-[0.4em] block pl-1 text-[#0d0d14]">
                  OTIMIZAÇÃO CLAUDE HAIKU 4.5
                </span>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

function Row({ icon: Icon, label, value, highlight, mono }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
        highlight ? "bg-primary/10 border-primary/20" : "bg-surface-raised border-border"
      )}>
        <Icon className={cn("w-4 h-4", highlight ? "text-primary" : "text-muted")} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{label}</p>
        <p className={cn(
          "text-xs font-bold text-foreground",
          mono && "font-mono"
        )}>{value}</p>
      </div>
    </div>
  );
}
