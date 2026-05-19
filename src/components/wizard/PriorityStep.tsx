import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { Eye, Shield, Zap, Settings, Target, Info, Sparkles, Layers, Droplets, Box } from "lucide-react";
import { Purpose } from "../../lib/types";

const USE_CASES: { id: Purpose; name: string; icon: any; desc: string }[] = [
  { id: "Decorativo", name: "Decorativo", icon: Eye, desc: "Foco total na estética e acabamento superficial." },
  { id: "Funcional", name: "Funcional", icon: Shield, desc: "Peças mecânicas que exigem resistência e precisão." },
  { id: "Flexível", name: "Flexível", icon: Droplets, desc: "Configurações otimizadas para TPU e similares." },
  { id: "Alta Resistência", name: "Alta Resistência", icon: Target, desc: "Máximo infill e paredes grossas para uso extremo." },
  { id: "Velocidade", name: "Velocidade", icon: Zap, desc: "Prioriza tempo e eficiência em protótipos rápidos." },
];

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
            <h3 className="card-section-title">Altura de Camada</h3>
            <p className="text-[9px] text-muted uppercase font-bold">
                {wizard.layerHeight < 0.12 ? "Qualidade Extrema" : wizard.layerHeight > 0.25 ? "Super Veloz" : "Equilibrado"}
            </p>
          </div>
          <span className="text-xl font-bold text-primary mono">{wizard.layerHeight.toFixed(2)}mm</span>
        </div>
        
        <div className="relative pt-6 px-2">
          <input
            type="range"
            min="0"
            max={currentPresets.length - 1}
            step="1"
            value={currentPresets.indexOf(wizard.layerHeight) === -1 ? 1 : currentPresets.indexOf(wizard.layerHeight)}
            onChange={(e) => updateWizard({ layerHeight: currentPresets[parseInt(e.target.value)] })}
            className="w-full h-1 bg-surface-raised rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-4">
            {currentPresets.map((v, i) => (
              <span key={i} className={cn("text-[0.7rem] font-medium transition-colors", wizard.layerHeight === v ? "text-primary" : "text-muted")}>
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
        <h3 className="card-section-title mb-5">
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
                    "w-full p-5 rounded-xl border flex flex-col items-start gap-4 transition-all text-left relative overflow-hidden",
                    isSelected
                    ? "border-primary bg-primary-subtle shadow-[var(--primary-glow)]"
                    : "border-border bg-surface hover:bg-surface-hover hover:border-border-strong",
                    isTpuRequired && "opacity-[0.35] cursor-not-allowed grayscale pointer-events-none"
                )}
                >
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isSelected ? "bg-primary text-[#0d0d14]" : "bg-surface-raised text-muted"
                )}>
                    <uc.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                    <p className={cn("text-xs font-bold uppercase tracking-tight", isSelected ? "text-primary" : "text-foreground")}>
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
        <div className="space-y-6">
            <h3 className="card-section-title">Acabamento Externo</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Ironing (Topo Plano)</span>
                        <Info className="w-3 h-3 text-muted/50" />
                    </div>
                    <button
                        onClick={() => updateWizard({ ironing: !wizard.ironing })}
                        className={cn(
                            "w-10 h-5 rounded-full relative transition-colors border border-transparent",
                            wizard.ironing ? "bg-primary" : "bg-surface-raised border-border"
                        )}
                        >
                        <div className={cn(
                            "w-3 h-3 bg-[#0d0d14] rounded-full absolute top-0.5 transition-all",
                            wizard.ironing ? "left-6" : "left-1 bg-muted"
                        )} />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Posição da Costura (Seam)</label>
                    <div className="flex flex-wrap gap-2">
                        {["Alinhada", "Aleatória", "Traseira", "Arestas"].map(s => (
                            <button
                                key={s}
                                onClick={() => updateWizard({ seamPosition: s as any })}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-[9px] font-black transition-all border",
                                    wizard.seamPosition === s ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface-raised text-muted hover:text-foreground hover:border-border-strong"
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
            <h3 className="card-section-title">Suporte</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Ativar Suportes</span>
                    <button
                        onClick={() => updateWizard({ supportEnabled: !wizard.supportEnabled })}
                        className={cn(
                            "w-10 h-5 rounded-full relative transition-colors border border-transparent",
                            wizard.supportEnabled ? "bg-primary" : "bg-surface-raised border-border"
                        )}
                        >
                        <div className={cn(
                            "w-3 h-3 bg-[#0d0d14] rounded-full absolute top-0.5 transition-all",
                            wizard.supportEnabled ? "left-6" : "left-1 bg-muted"
                        )} />
                    </button>
                </div>

                {wizard.supportEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Tipo de Suporte</label>
                             <div className="flex gap-2">
                                {["Tree (Auto)", "Normal (Grid)"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => updateWizard({ supportType: t as any })}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-[9px] font-black transition-all border",
                                            wizard.supportType === t ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface-raised text-muted hover:text-foreground"
                                        )}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-widest text-muted">Material de Interface</label>
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
                                                "flex-1 py-2 rounded-lg text-[9px] font-bold transition-all border",
                                                wizard.supportInterface === i ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface-raised text-muted hover:text-foreground",
                                                isDisabled && "opacity-[0.35] cursor-not-allowed grayscale pointer-events-none"
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
