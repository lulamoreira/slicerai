import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { AMSSlot, FlushStrategy } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Plus, Minus, Info, Palette } from "lucide-react";

const MATERIALS = [
  "PLA", "PLA Matte", "PLA Silk", "PLA Galaxy", "PLA Glow", "PLA High Speed",
  "PETG", "PETG-CF", "ABS", "ASA", "TPU 95A", "TPU 87A",
  "PA (Nylon)", "PA-CF", "PC", "PLA-CF", "PVA", "HIPS"
];

export const MaterialStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const updateAMSSlot = (index: number, updates: Partial<AMSSlot>) => {
    const newSlots = [...wizard.amsSlots];
    newSlots[index] = { ...newSlots[index], ...updates };
    updateWizard({ amsSlots: newSlots });
  };

  const currentSlots = wizard.amsSlots.slice(0, wizard.amsSlotCount);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        {!wizard.hasAMS ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Material</label>
                <select
                  value={wizard.material}
                  onChange={(e) => updateWizard({ material: e.target.value })}
                  className="w-full bg-surface-raised border border-white/5 rounded-xl p-4 text-xs font-bold outline-none focus:border-primary/50 transition-colors"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Peso do Carretel (g)</label>
                <div className="flex gap-2">
                  {[250, 500, 1000].map(w => (
                    <button
                      key={w}
                      onClick={() => updateWizard({ spoolWeight: w })}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black transition-all border",
                        wizard.spoolWeight === w ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted hover:text-white"
                      )}
                    >
                      {w}g
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Cor do Filamento</label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={wizard.baseColor}
                    onChange={(e) => updateWizard({ baseColor: e.target.value })}
                    className="w-14 h-14 rounded-xl cursor-pointer bg-surface-raised border border-white/5 p-1 transition-transform hover:scale-105"
                  />
                  <input
                    type="text"
                    value={wizard.baseColor}
                    onChange={(e) => updateWizard({ baseColor: e.target.value })}
                    className="flex-1 bg-surface-raised border border-white/5 rounded-xl p-3 text-xs font-mono font-bold outline-none focus:border-primary/50 transition-colors uppercase"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nome da cor (ex: Bambu Green)"
                  className="w-full bg-surface-raised border border-white/5 rounded-xl p-4 text-xs font-bold outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">
              Configurador de Bandejas AMS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentSlots.map((slot, i) => (
                <div key={i} className="p-5 bg-surface-raised border border-white/5 rounded-2xl space-y-4 relative group shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Tray {i + 1}</span>
                    <input
                      type="color"
                      value={slot.color}
                      onChange={(e) => updateAMSSlot(i, { color: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden shadow-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-muted/30">Material</label>
                    <select
                      value={slot.material}
                      onChange={(e) => updateAMSSlot(i, { material: e.target.value })}
                      className="w-full bg-surface border border-white/5 rounded-lg p-2.5 text-[10px] font-bold outline-none focus:border-primary/50"
                    >
                      {MATERIALS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Estratégia de Flush</span>
                  <Info className="w-3 h-3 text-muted/30" />
                </div>
                <div className="flex gap-2 bg-surface-raised p-1 rounded-xl border border-white/5">
                  {["Automático", "Conservador", "Agressivo"].map(s => (
                    <button
                      key={s}
                      onClick={() => updateWizard({ flushStrategy: s as any })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                        wizard.flushStrategy === s ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
                      )}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between h-full py-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Torre de Limpeza</span>
                        <p className="text-[8px] text-muted/50 uppercase font-black">Recomendado para multi-color</p>
                    </div>
                    <button
                    onClick={() => updateWizard({ wipeTower: !wizard.wipeTower })}
                    className={cn(
                        "w-12 h-6 rounded-full relative transition-colors",
                        wizard.wipeTower ? "bg-primary shadow-[0_0_15px_rgba(0,200,180,0.4)]" : "bg-white/5"
                    )}
                    >
                    <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                        wizard.wipeTower ? "left-7" : "left-1"
                    )} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
