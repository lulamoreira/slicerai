import React, { useState } from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { AMSSlot, FlushStrategy } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Plus, Minus, Info, Palette, ShieldAlert } from "lucide-react";
import { MATERIALS, MaterialName } from "../../lib/materials";

const MATERIAL_LIST = Object.keys(MATERIALS);

export const MaterialStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const updateAMSSlot = (index: number, updates: Partial<AMSSlot>) => {
    const newSlots = [...wizard.amsSlots];
    newSlots[index] = { ...newSlots[index], ...updates };
    updateWizard({ amsSlots: newSlots });
  };

  const currentSlots = wizard.amsSlots.slice(0, wizard.amsSlotCount);

  // Check compatibility with plate if plate was already chosen or use default logic
  const isMaterialCompatible = (mat: string) => {
      // Logic for Step 3 could be previewed here
      return true;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        {!wizard.hasAMS ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Material</label>
                <select
                  value={wizard.material}
                  onChange={(e) => updateWizard({ material: e.target.value })}
                  className="w-full bg-surface-raised border border-border-strong rounded-xl p-4 text-xs font-bold outline-none focus:border-primary transition-all text-foreground"
                >
                  {MATERIAL_LIST.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Peso do Carretel (g)</label>
                <div className="flex gap-2">
                  {[250, 500, 1000].map(w => (
                    <button
                      key={w}
                      onClick={() => updateWizard({ spoolWeight: w })}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all border",
                        wizard.spoolWeight === w ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface-raised text-muted hover:text-foreground"
                      )}
                    >
                      {w}g
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Cor do Filamento</label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={wizard.baseColor}
                    onChange={(e) => updateWizard({ baseColor: e.target.value })}
                    className="w-14 h-14 rounded-xl cursor-pointer bg-surface-raised border border-border p-1 transition-transform hover:scale-105"
                  />
                  <input
                    type="text"
                    value={wizard.baseColor}
                    onChange={(e) => updateWizard({ baseColor: e.target.value })}
                    className="flex-1 bg-surface-raised border border-border-strong rounded-xl p-3 text-xs font-mono font-bold outline-none focus:border-primary transition-all text-foreground uppercase"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nome da cor (ex: Bambu Green)"
                  className="w-full bg-surface-raised border border-border-strong rounded-xl p-4 text-xs font-bold outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             <h3 className="card-section-title mb-4">
              Configurador de Bandejas AMS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentSlots.map((slot, i) => (
                <div key={i} className="p-4 bg-surface-raised border border-border rounded-xl space-y-4 relative group shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-primary text-[#0d0d14] px-2 py-0.5 rounded-md">Slot {i + 1}</span>
                    <input
                      type="color"
                      value={slot.color}
                      onChange={(e) => updateAMSSlot(i, { color: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden shadow-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold uppercase text-muted">Material</label>
                    <select
                      value={slot.material}
                      onChange={(e) => updateAMSSlot(i, { material: e.target.value })}
                      className="w-full bg-surface border border-border-strong rounded-lg p-2.5 text-[10px] font-bold outline-none focus:border-primary text-foreground"
                    >
                      {MATERIAL_LIST.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Estratégia de Flush</span>
                  <Info className="w-3 h-3 text-muted/50" />
                </div>
                <div className="flex gap-1 bg-surface-raised p-1 rounded-xl border border-border">
                  {["Automático", "Conservador", "Agressivo"].map(s => (
                    <button
                      key={s}
                      onClick={() => updateWizard({ flushStrategy: s as any })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
                        wizard.flushStrategy === s ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-foreground hover:bg-surface-hover"
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Torre de Limpeza</span>
                        <p className="text-[8px] text-muted uppercase font-bold">Recomendado para multi-color</p>
                    </div>
                    <button
                    onClick={() => updateWizard({ wipeTower: !wizard.wipeTower })}
                    className={cn(
                        "w-12 h-6 rounded-full relative transition-colors border border-transparent",
                        wizard.wipeTower ? "bg-primary" : "bg-surface-raised border-border"
                    )}
                    >
                    <div className={cn(
                        "w-4 h-4 bg-[#0d0d14] rounded-full absolute top-0.5 transition-all shadow-sm",
                        wizard.wipeTower ? "left-7" : "left-1 bg-muted"
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
