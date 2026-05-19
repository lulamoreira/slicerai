import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { AMSSlot, FlushStrategy } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Plus, Minus, Info, Palette } from "lucide-react";

const MATERIALS = ["PLA", "PETG", "ABS", "ASA", "PA", "PC", "TPU"];
const VARIANTS = ["Basic", "Matte", "Tough", "CF (Carbon Fiber)", "Silk"];

export const MaterialStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const handleAMSToggle = (val: boolean) => {
    updateWizard({ hasAMS: val });
  };

  const updateAMSSlot = (index: number, updates: Partial<AMSSlot>) => {
    const newSlots = [...wizard.amsSlots];
    newSlots[index] = { ...newSlots[index], ...updates };
    updateWizard({ amsSlots: newSlots });
  };

  const maxSlots = (wizard.printer === "A1" || wizard.printer === "A1-Mini") ? 4 : 16;
  const currentSlotCount = wizard.amsSlots.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Tem AMS acoplado?
          </h3>
          <div className="flex bg-surface-raised rounded-xl p-1 border border-white/5 shadow-inner">
            <button
              onClick={() => handleAMSToggle(false)}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all",
                !wizard.hasAMS ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
              )}
            >
              NÃO
            </button>
            <button
              onClick={() => handleAMSToggle(true)}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all",
                wizard.hasAMS ? "bg-primary text-white shadow-lg" : "text-muted hover:text-white"
              )}
            >
              SIM
            </button>
          </div>
        </div>

        {!wizard.hasAMS ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Material</label>
              <select
                value={wizard.material}
                onChange={(e) => updateWizard({ material: e.target.value })}
                className="w-full bg-surface-raised border border-white/5 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary/50 transition-colors"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Variante</label>
              <select
                value={wizard.variant}
                onChange={(e) => updateWizard({ variant: e.target.value })}
                className="w-full bg-surface-raised border border-white/5 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary/50 transition-colors"
              >
                {VARIANTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted/50">Cor do Filamento</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={wizard.baseColor}
                  onChange={(e) => updateWizard({ baseColor: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-surface-raised border border-white/5 p-1 transition-transform hover:scale-105"
                />
                <input
                  type="text"
                  value={wizard.baseColor}
                  onChange={(e) => updateWizard({ baseColor: e.target.value })}
                  className="flex-1 bg-surface-raised border border-white/5 rounded-xl p-3 text-xs font-mono font-bold outline-none focus:border-primary/50 transition-colors uppercase"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {wizard.amsSlots.map((slot, i) => (
                <div key={i} className="p-4 bg-surface-raised border border-white/5 rounded-2xl space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Slot {i + 1}</span>
                    <input
                      type="color"
                      value={slot.color}
                      onChange={(e) => updateAMSSlot(i, { color: e.target.value })}
                      className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                    />
                  </div>
                  <select
                    value={slot.material}
                    onChange={(e) => updateAMSSlot(i, { material: e.target.value })}
                    className="w-full bg-surface border border-white/5 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-primary/50"
                  >
                    {MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              ))}
              {currentSlotCount < maxSlots && (
                <button
                  onClick={() => updateWizard({ amsSlots: [...wizard.amsSlots, { material: "PLA", color: "#00c8b4" }] })}
                  className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-white/10 rounded-2xl hover:border-primary/50 hover:bg-white/[0.02] transition-all text-muted hover:text-primary group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Slot</span>
                </button>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Estratégia de Flush</span>
                  <Info className="w-3 h-3 text-muted/30" />
                </div>
                <select
                  value={wizard.flushStrategy}
                  onChange={(e) => updateWizard({ flushStrategy: e.target.value as FlushStrategy })}
                  className="bg-surface-raised border border-white/5 rounded-lg p-2 text-[10px] font-bold outline-none"
                >
                  <option value="Automático">Automático</option>
                  <option value="Conservador">Conservador</option>
                  <option value="Agressivo">Agressivo</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Torre de Limpeza (Wipe Tower)</span>
                <button
                  onClick={() => updateWizard({ wipeTower: !wizard.wipeTower })}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    wizard.wipeTower ? "bg-primary shadow-[0_0_10px_rgba(0,200,180,0.3)]" : "bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 bg-white rounded-full absolute top-1 transition-all",
                    wizard.wipeTower ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
