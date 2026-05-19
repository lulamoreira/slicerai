import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { Eye, Shield, Zap, Settings, Target, Info, Sparkles, Layers } from "lucide-react";
import { Purpose } from "../../lib/types";

const USE_CASES: { id: Purpose; name: string; icon: any; desc: string }[] = [
  { id: "Decorativo", name: "Decorativo", icon: Eye, desc: "Foco total na estética e acabamento superficial." },
  { id: "Funcional", name: "Funcional", icon: Shield, desc: "Peças mecânicas que exigem resistência e precisão." },
  { id: "Flexível", name: "Flexível", icon: Droplets, desc: "Configurações otimizadas para TPU e similares." },
  { id: "Alta Resistência", name: "Alta Resistência", icon: Target, desc: "Máximo infill e paredes grossas para uso extremo." },
  { id: "Velocidade", name: "Velocidade", icon: Zap, desc: "Prioriza tempo e eficiência em protótipos rápidos." },
];

const Droplets = (props: any) => <Zap {...props} />; // Placeholder

export const PriorityStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const layerPresets: Record<number, number[]> = {
    0.2: [0.08, 0.10, 0.12, 0.15],
    0.4: [0.08, 0.12, 0.15, 0.20, 0.28, 0.35],
    0.6: [0.15, 0.20, 0.30, 0.45],
    0.8: [0.20, 0.30, 0.40, 0.60]
  };

  const currentPresets = layerPresets[wizard.nozzle] || layerPresets[0.4];

  const togglePurpose = (p: Purpose) => {
    const current = wizard.purposes || [];
    if (current.includes(p)) {
      updateWizard({ purposes: current.filter(x => x !== p) });
    } else {
      updateWizard({ purposes: [...current, p] });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <section>
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Altura de Camada</h3>
            <p className="text-[9px] text-muted/50 uppercase font-black italic">
                {wizard.layerHeight < 0.12 ? "Qualidade Extrema" : wizard.layerHeight > 0.25 ? "Super Veloz" : "Equilibrado"}
            </p>
          </div>
          <span className="text-xl font-black italic text-primary font-mono">{wizard.layerHeight.toFixed(2)}mm</span>
        </div>
        
        <div className="relative pt-6 px-2">
          <input
            type="range"
            min="0"
            max={currentPresets.length - 1}
            step="1"
            value={currentPresets.indexOf(wizard.layerHeight) === -1 ? 1 : currentPresets.indexOf(wizard.layerHeight)}
            onChange={(e) => updateWizard({ layerHeight: currentPresets[parseInt(e.target.value)] })}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-4">
            {currentPresets.map((v, i) => (
              <span key={i} className={cn("text-[9px] font-black font-mono transition-colors", wizard.layerHeight === v ? "text-primary" : "text-muted/30")}>
                {v}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-6 text-[9px] text-muted italic flex items-center gap-2">
            <Info className="w-3 h-3" />
            Camadas menores = superfície melhor, mais tempo de impressão
        </p>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-5">
          Propósito do Projeto
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {USE_CASES.map((uc) => {
            const isTpuRequired = uc.id === "Flexível" && !wizard.material.includes("TPU");
            const isSelected = wizard.purposes.includes(uc.id);
            return (
                <button
                key={uc.id}
                disabled={isTpuRequired}
                onClick={() => togglePurpose(uc.id)}
                className={cn(
                    "w-full p-5 rounded-2xl border flex flex-col items-start gap-4 transition-all text-left relative overflow-hidden",
                    isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg"
                    : "border-white/5 bg-surface-raised hover:bg-white/[0.05]",
                    isTpuRequired && "opacity-20 cursor-not-allowed grayscale"
                )}
                >
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isSelected ? "bg-primary text-white shadow-lg" : "bg-white/5 text-muted"
                )}>
                    <uc.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                    <p className={cn("text-xs font-black uppercase italic tracking-tight", isSelected ? "text-primary" : "text-white")}>
                    {uc.name}
                    </p>
                    <p className="text-[9px] leading-tight text-muted/70 font-bold uppercase tracking-tighter">
                    {uc.desc}
                    </p>
                </div>
                </button>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
        <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Acabamento Externo</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Ironing (Topo Plano)</span>
                        <Info className="w-3 h-3 text-muted/30" title="Alisamento térmico da camada superior" />
                    </div>
                    <button
                        onClick={() => updateWizard({ ironing: !wizard.ironing })}
                        className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            wizard.ironing ? "bg-primary" : "bg-white/5"
                        )}
                        >
                        <div className={cn(
                            "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                            wizard.ironing ? "left-6" : "left-1"
                        )} />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted/50">Posição da Costura (Seam)</label>
                    <div className="flex flex-wrap gap-2">
                        {["Alinhada", "Aleatória", "Traseira", "Arestas"].map(s => (
                            <button
                                key={s}
                                onClick={() => updateWizard({ seamPosition: s as any })}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-[9px] font-black transition-all border",
                                    wizard.seamPosition === s ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted hover:text-white"
                                )}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Suporte</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Ativar Suportes</span>
                    <button
                        onClick={() => updateWizard({ supportEnabled: !wizard.supportEnabled })}
                        className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            wizard.supportEnabled ? "bg-primary" : "bg-white/5"
                        )}
                        >
                        <div className={cn(
                            "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                            wizard.supportEnabled ? "left-6" : "left-1"
                        )} />
                    </button>
                </div>

                {wizard.supportEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted/50">Tipo de Suporte</label>
                             <div className="flex gap-2">
                                {["Tree (Auto)", "Normal (Grid)"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => updateWizard({ supportType: t as any })}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-[9px] font-black transition-all border",
                                            wizard.supportType === t ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted hover:text-white"
                                        )}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted/50">Material de Interface</label>
                             <div className="flex gap-2">
                                {["Mesmo material", "PVA solúvel"].map(i => {
                                    const pvaAvailable = wizard.hasAMS && wizard.amsSlots.some(s => s.material === "PVA");
                                    const isDisabled = i === "PVA solúvel" && !pvaAvailable;
                                    return (
                                        <button
                                            key={i}
                                            disabled={isDisabled}
                                            onClick={() => updateWizard({ supportInterface: i as any })}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-[9px] font-black transition-all border",
                                                wizard.supportInterface === i ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted hover:text-white",
                                                isDisabled && "opacity-20 cursor-not-allowed"
                                            )}
                                        >
                                            {i.toUpperCase()}
                                        </button>
                                    )
                                })}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </section>
    </div>
  );
};
