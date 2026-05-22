import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { generateSettings } from "../../lib/ai";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  Sparkles, Printer, Box, Layers, Play, CheckCircle2,
  Package, Grid3x3, Target, Scale, Clock, Triangle, Palette, Wrench, Settings as SettingsIcon,
  Cpu, AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { MATERIAL_DENSITIES } from "../../lib/geometry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ReviewStep: React.FC = () => {
  const { wizard, setResults, status, geometry } = useAppStore();
  const { profile } = useAuthStore();
  const { 
    apiKey, groqApiKey, deepseekKey, openrouterKey, aiProvider, 
    setAiProvider, addToHistory, history: printHistory 
  } = useSettingsStore();

  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState(aiProvider);



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

  const handleGenerateClick = () => {
    setSelectedProvider(aiProvider);
    setIsAiModalOpen(true);
  };

  const handleConfirmGeneration = async () => {
    setIsAiModalOpen(false);
    
    // Update provider in store if it changed
    if (selectedProvider !== aiProvider) {
      setAiProvider(selectedProvider);
    }

    const isCentralized = profile?.api_key_mode === 'centralized';
    const currentApiKey = 
      selectedProvider === 'gemini' ? apiKey : 
      selectedProvider === 'groq' ? groqApiKey :
      selectedProvider === 'deepseek' ? deepseekKey :
      openrouterKey;

    if (!currentApiKey && !isCentralized) {
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
    } catch (error: any) {
      console.error('Generation error:', error);
      
      if (error?.code === "QUOTA_EXCEEDED") {
        setIsQuotaModalOpen(true);
        useAppStore.setState({ status: 'ready' });
        return;
      }

      const msg = error?.message || String(error);
      alert("Erro ao gerar configurações:\n\n" + msg);
      useAppStore.setState({ status: 'ready' });
    }

  };


  const isGenerating = status === 'generating';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="p-8 bg-surface border border-border-strong rounded-xl space-y-8 shadow-sm relative overflow-hidden">
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
          <Row icon={Layers} label="Layer Height" value={`${wizard.layerHeight.toFixed(2)}mm`} />
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
        {(!(aiProvider === 'gemini' ? apiKey : 
           aiProvider === 'groq' ? groqApiKey : 
           aiProvider === 'deepseek' ? deepseekKey : 
           openrouterKey) && profile?.api_key_mode !== 'centralized') && (
          <div className="p-3 bg-[rgba(255,180,84,0.1)] border border-[rgba(255,180,84,0.3)] rounded-lg flex items-center justify-between gap-3">
            <span className="text-[0.85rem] font-medium text-warning">
              ⚠️ Configure sua chave {
                aiProvider === 'gemini' ? 'Gemini 2.0 Flash' : 
                aiProvider === 'groq' ? 'Groq Llama 3.3' :
                aiProvider === 'deepseek' ? 'DeepSeek V3' :
                'OpenRouter'
              } nas ⚙️ Configurações para continuar
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
          onClick={handleGenerateClick}
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
            <GeneratingState />
          ) : (
            <>
              <div className="w-16 h-16 bg-[#0d0d14]/10 rounded-xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner border border-[#0d0d14]/10">
                <Sparkles className="w-8 h-8 fill-[#0d0d14]" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-2xl font-bold tracking-tight uppercase block text-[#0d0d14]">Gerar com SlicerAI</span>
                <span className="text-[10px] opacity-70 font-bold uppercase tracking-[0.4em] block pl-1 text-[#0d0d14]">
                  {aiProvider === 'gemini' ? "OTIMIZAÇÃO GOOGLE GEMINI 2.0" : 
                   aiProvider === 'groq' ? "OTIMIZAÇÃO GROQ LLAMA 3.3" :
                   aiProvider === 'deepseek' ? "OTIMIZAÇÃO DEEPSEEK V3" :
                   "OTIMIZAÇÃO OPENROUTER"}
                </span>
              </div>
            </>
          )}
        </button>
      </div>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-md bg-[#1e2127] text-white border-border/50 p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Escolha a IA para gerar
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Você pode trocar a qualquer momento nas Configurações.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 my-6">
            <ProviderButton 
              id="gemini" 
              name="Google Gemini 2.0" 
              hasKey={!!apiKey || profile?.api_key_mode === 'centralized'} 
              isSelected={selectedProvider === 'gemini'} 
              onClick={() => setSelectedProvider('gemini')} 
            />
            <ProviderButton 
              id="groq" 
              name="Groq Llama 3.3" 
              hasKey={!!groqApiKey || profile?.api_key_mode === 'centralized'} 
              isSelected={selectedProvider === 'groq'} 
              onClick={() => setSelectedProvider('groq')} 
            />
            <ProviderButton 
              id="deepseek" 
              name="DeepSeek V3" 
              hasKey={!!deepseekKey || profile?.api_key_mode === 'centralized'} 
              isSelected={selectedProvider === 'deepseek'} 
              onClick={() => setSelectedProvider('deepseek')} 
            />
            <ProviderButton 
              id="openrouter" 
              name="OpenRouter" 
              hasKey={!!openrouterKey || profile?.api_key_mode === 'centralized'} 
              isSelected={selectedProvider === 'openrouter'} 
              onClick={() => setSelectedProvider('openrouter')} 
            />
          </div>

          <DialogFooter className="flex gap-3 mt-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsAiModalOpen(false)}
              className="bg-transparent border-border/50 text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmGeneration}
              disabled={!(
                selectedProvider === 'gemini' ? (!!apiKey || profile?.api_key_mode === 'centralized') :
                selectedProvider === 'groq' ? (!!groqApiKey || profile?.api_key_mode === 'centralized') :
                selectedProvider === 'deepseek' ? (!!deepseekKey || profile?.api_key_mode === 'centralized') :
                (!!openrouterKey || profile?.api_key_mode === 'centralized')
              )}
              className="bg-[#00AE42] hover:bg-[#009938] text-white font-bold"
            >
              Gerar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuotaModalOpen} onOpenChange={setIsQuotaModalOpen}>
        <DialogContent className="max-w-md bg-[#1e2127] text-white border-border/50 p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Cota do Gemini esgotada
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Seu limite gratuito do Gemini foi atingido. Deseja gerar agora usando o DeepSeek ou Groq?
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 my-6">
            <button
              disabled={!deepseekKey && profile?.api_key_mode !== 'centralized'}
              onClick={() => {
                setAiProvider('deepseek');
                setIsQuotaModalOpen(false);
                setTimeout(() => handleConfirmGeneration(), 100);
              }}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border transition-all text-left relative overflow-hidden group",
                (!deepseekKey && profile?.api_key_mode !== 'centralized')
                  ? "bg-black/20 border-border/20 opacity-50 cursor-not-allowed"
                  : "bg-surface-raised border-border/30 hover:border-primary/50 hover:bg-surface-raised/80"
              )}
            >
              <span className="font-bold text-sm text-white">Usar DeepSeek V3</span>
              {(!deepseekKey && profile?.api_key_mode !== 'centralized') && (
                <span className="text-[10px] text-warning flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Sem chave cadastrada
                </span>
              )}
            </button>

            <button
              disabled={!groqApiKey && profile?.api_key_mode !== 'centralized'}
              onClick={() => {
                setAiProvider('groq');
                setIsQuotaModalOpen(false);
                setTimeout(() => handleConfirmGeneration(), 100);
              }}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border transition-all text-left relative overflow-hidden group",
                (!groqApiKey && profile?.api_key_mode !== 'centralized')
                  ? "bg-black/20 border-border/20 opacity-50 cursor-not-allowed"
                  : "bg-surface-raised border-border/30 hover:border-primary/50 hover:bg-surface-raised/80"
              )}
            >
              <span className="font-bold text-sm text-white">Usar Groq Llama 3.3</span>
              {(!groqApiKey && profile?.api_key_mode !== 'centralized') && (
                <span className="text-[10px] text-warning flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Sem chave cadastrada
                </span>
              )}
            </button>
          </div>

          <DialogFooter className="flex gap-3 mt-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsQuotaModalOpen(false)}
              className="bg-transparent border-border/50 text-white hover:bg-white/5"
            >
              Agora não
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>

  );
};

const ProviderButton = ({ id, name, hasKey, isSelected, onClick }: { 
  id: string; 
  name: string; 
  hasKey: boolean; 
  isSelected: boolean; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    disabled={!hasKey}
    className={cn(
      "flex flex-col items-start p-4 rounded-xl border transition-all text-left relative overflow-hidden group",
      !hasKey 
        ? "bg-black/20 border-border/20 opacity-50 cursor-not-allowed" 
        : isSelected
          ? "bg-primary/10 border-primary ring-1 ring-primary"
          : "bg-surface-raised border-border/30 hover:border-primary/50 hover:bg-surface-raised/80"
    )}
  >
    <div className="flex items-center justify-between w-full">
      <span className={cn("font-bold text-sm", isSelected ? "text-primary" : "text-white")}>
        {name}
      </span>
      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
    </div>
    {!hasKey && (
      <span className="text-[10px] text-warning flex items-center gap-1 mt-1 font-medium">
        <AlertCircle className="w-3 h-3" />
        Sem chave cadastrada
      </span>
    )}
  </button>
);


const Row = ({ icon: Icon, label, value, highlight, mono }: { icon: any; label: string; value: string; highlight?: boolean; mono?: boolean }) => (
  <div className="flex items-center gap-3 min-w-0">
    <Icon className={cn("w-4 h-4 shrink-0", highlight ? "text-primary" : "text-primary/70")} />
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[0.8rem] text-muted font-medium opacity-60">{label}</span>
      <span className={cn("text-sm font-bold truncate", highlight ? "text-primary" : "text-foreground", mono && "mono")}>{value}</span>
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
        <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
        <Sparkles className="w-5 h-5 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse text-foreground/80">{messages[msgIndex]}</span>
    </div>
  );
};
