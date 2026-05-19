import React from "react";
import { useStore } from "../../lib/store";
import { AMSSlot, FlushStrategy } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Plus, Minus, Info } from "lucide-react";

const MATERIALS = ["PLA", "PETG", "ABS", "ASA", "PA", "PC", "TPU"];
const VARIANTS = ["Basic", "Matte", "Tough", "CF (Carbon Fiber)", "Silk"];

export const MaterialStep: React.FC = () => {
  const { wizard, updateWizard } = useStore();

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tem AMS acoplado?
          </h3>
          <div className="flex bg-surface rounded-lg p-1 border border-white/10">
            <button
              onClick={() => handleAMSToggle(false)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                !wizard.hasAMS ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              NÃO
            </button>
            <button
              onClick={() => handleAMSToggle(true)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                wizard.hasAMS ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              SIM
            </button>
          </div>
        </div>

        {!wizard.hasAMS ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Material</label>
              <select
                value={wizard.material}
                onChange={(e) => updateWizard({ material: e.target.value })}
                className="w-full bg-surface-raised border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Variante</label>
              <select
                value={wizard.variant}
                onChange={(e) => updateWizard({ variant: e.target.value })}
                className="w-full bg-surface-raised border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary"
              >
                {VARIANTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs text-muted-foreground">Cor Base</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={wizard.baseColor}
                  onChange={(e) => updateWizard({ baseColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                />
                <input
                  type="text"
                  value={wizard.baseColor}
                  onChange={(e) => updateWizard({ baseColor: e.target.value })}
                  className="flex-1 bg-surface-raised border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary uppercase"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {wizard.amsSlots.map((slot, i) => (
                <div key={i} className="p-3 bg-surface-raised border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Slot {i + 1}</span>
                    <input
                      type="color"
                      value={slot.color}
                      onChange={(e) => updateAMSSlot(i, { color: e.target.value })}
                      className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                    />
                  </div>
                  <select
                    value={slot.material}
                    onChange={(e) => updateAMSSlot(i, { material: e.target.value })}
                    className="w-full bg-surface border border-white/5 rounded-md p-1.5 text-xs outline-none"
                  >
                    {MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              ))}
              {currentSlotCount < maxSlots && (
                <button
                  onClick={() => updateWizard({ amsSlots: [...wizard.amsSlots, { material: "PLA", color: "#00ADB5" }] })}
                  className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Adicionar Unidade</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Estratégia de Flush</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <select
                  value={wizard.flushStrategy}
                  onChange={(e) => updateWizard({ flushStrategy: e.target.value as FlushStrategy })}
                  className="bg-surface border border-white/10 rounded-md p-1.5 text-xs outline-none"
                >
                  <option value="Automático">Automático</option>
                  <option value="Conservador">Conservador</option>
                  <option value="Agressivo">Agressivo</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Torre de Limpeza (Wipe Tower)</span>
                <button
                  onClick={() => updateWizard({ wipeTower: !wizard.wipeTower })}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    wizard.wipeTower ? "bg-primary" : "bg-white/10"
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
