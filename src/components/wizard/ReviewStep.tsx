import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { generateSettings } from "../../lib/ai";
import { 
  Sparkles, Printer, Box, Layers, Play, CheckCircle2,
  Package, Grid3x3, Target, Scale, Clock, Triangle, Palette, Wrench, Settings as SettingsIcon
} from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";

export const ReviewStep: React.FC = () => {
  const { wizard, setResults, status, geometry } = useAppStore();
  const { apiKey, addToHistory } = useSettingsStore();

  // Reactive weight: prefer live geometry from store; fallback to PLA density placeholder.
  const volume = geometry?.volume ?? wizard.geometryStats?.volume;
  const density = MATERIAL_DENSITIES[wizard.material as keyof typeof MATERIAL_DENSITIES] || 1.24;
  const estimatedWeight = volume != null ? (volume * density).toFixed(1) + "g" : "—";

  // Simple heuristic for print time (min)
  const estimatedTime = volume != null
    ? Math.round((volume * 5) / (wizard.layerHeight * 2))
    : 45;

  const reviewColor = wizard.hasAMS && wizard.amsSlots[0]?.color
    ? wizard.amsSlots[0].color
    : wizard.baseColor;

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('slicerai:open-settings'));
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      openSettings();
      return;
    }

    useAppStore.setState({ status: 'generating' });
    try {
      const results = await generateSettings(apiKey, wizard as any);
      setResults(results);

      let thumbnail = "";
      const canvas = document.querySelector('canvas');
      if (canvas) {
        thumbnail = canvas.toDataURL('image/png');
      }

      addToHistory({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: wizard.fileName,
        printer: wizard.printer,
        material: wizard.material,
        color: reviewColor,
        thumbnail,
        results,
        wizardState: wizard as any,
      });
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-10">
          <Row icon={Printer} label="Impressora" value={`${wizard.printer} (${wizard.nozzle}mm)`} />
          <Row icon={Package} label="Material" value={`${wizard.material} ${wizard.variant}`} />
          <Row icon={Grid3x3} label="Build Plate" value={wizard.buildPlate} />
          <Row icon={Layers} label="Layer Height" value={`${wizard.layerHeight.toFixed(2)}mm`} />
          <Row icon={Target} label="Propósito" value={wizard.purposes.join(', ')} />
          <Row icon={Scale} label="Peso estimado" value={estimatedWeight} highlight />
          <Row icon={Clock} label="Tempo estimado" value={`~${Math.floor(estimatedTime / 60)}h ${estimatedTime % 60}min`} />
          <Row icon={Triangle} label="Suporte" value={wizard.supportEnabled ? wizard.supportType : "Sem suporte"} />
          <Row icon={Wrench} label="Nozzle" value={`${wizard.nozzle}mm`} />
          <div className="flex items-center gap-3 min-w-0">
            <Palette className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] text-muted uppercase font-black tracking-widest opacity-60">Cor</span>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded-full border border-white/20 shadow-inner shrink-0"
                  style={{ backgroundColor: reviewColor }}
                />
                <span className="text-xs font-mono font-bold text-white uppercase truncate">{reviewColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!apiKey && (
          <div className="p-4 rounded-2xl flex items-center justify-between gap-3 border" style={{ backgroundColor: 'color-mix(in oklab, var(--warning) 12%, transparent)', borderColor: 'color-mix(in oklab, var(--warning) 30%, transparent)' }}>
            <span className="text-[11px] font-black tracking-wide" style={{ color: 'var(--warning)' }}>
              ⚠️ Configure sua chave Gemini nas ⚙️ Configurações para continuar
            </span>
            <button
              onClick={openSettings}
              className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-white whitespace-nowrap shadow"
              style={{ backgroundColor: 'var(--warning)' }}
            >
              Abrir Configurações →
            </button>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
          className={cn(
            "w-full py-10 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group",
            isGenerating
              ? "bg-surface-raised cursor-wait"
              : !apiKey
                ? "bg-surface-raised opacity-50 cursor-not-allowed"
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
                <span className="text-[10px] opacity-70 font-black uppercase tracking-[0.4em] block pl-1">Otimização Gemini 1.5 Flash</span>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Icon className={cn("w-4 h-4 shrink-0", highlight ? "text-primary" : "text-primary/80")} />
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[9px] text-muted uppercase font-black tracking-widest opacity-60">{label}</span>
      <span className={cn("text-sm font-bold truncate italic", highlight ? "text-primary" : "text-white")}>{value}</span>
    </div>
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
