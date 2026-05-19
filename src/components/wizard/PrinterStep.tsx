import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { PrinterModel, NozzleDiameter } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Monitor, Cpu, Zap, Radio, Info } from "lucide-react";

interface PrinterCard {
  id: PrinterModel;
  name: string;
  icon: any;
  badges: string[];
}

const PRINTERS: PrinterCard[] = [
  { id: "X1C", name: "X1 Carbon", icon: Cpu, badges: ["AMS Ready", "Carbon Fiber", "Enclosed"] },
  { id: "X1E", name: "X1E", icon: Monitor, badges: ["Industrial", "Enclosed", "High Temp"] },
  { id: "P1S", name: "P1S", icon: Zap, badges: ["AMS Ready", "Enclosed"] },
  { id: "P1P", name: "P1P", icon: Radio, badges: ["Open Frame"] },
  { id: "A1", name: "A1", icon: Radio, badges: ["AMS Lite", "Multi-color"] },
  { id: "A1-Mini", name: "A1 Mini", icon: Radio, badges: ["AMS Lite", "Compact"] },
];

const NOZZLES: NozzleDiameter[] = [0.2, 0.4, 0.6, 0.8];

export const PrinterStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const handleNozzleChange = (n: NozzleDiameter) => {
    // Default layer heights per nozzle
    const defaults: Record<number, number> = { 0.2: 0.12, 0.4: 0.20, 0.6: 0.30, 0.8: 0.40 };
    updateWizard({ nozzle: n, layerHeight: defaults[n] });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-5">
          Selecione sua Impressora
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRINTERS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateWizard({ printer: p.id })}
              className={cn(
                "p-5 rounded-3xl border flex flex-col items-start gap-4 transition-all relative group text-left",
                wizard.printer === p.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg shadow-primary/5"
                  : "border-white/5 bg-surface-raised hover:bg-white/[0.05]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                wizard.printer === p.id ? "bg-primary text-white shadow-lg" : "bg-white/5 text-muted group-hover:text-white"
              )}>
                <p.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className={cn("text-sm font-black italic uppercase tracking-tight", wizard.printer === p.id ? "text-primary" : "text-white")}>
                  {p.name}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.badges.map(b => (
                    <span key={b} className="text-[8px] font-black uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-5">
            Diâmetro do Bocal (Nozzle)
          </h3>
          <div className="flex gap-2 bg-surface-raised p-1.5 rounded-2xl border border-white/5">
            {NOZZLES.map((n) => (
              <button
                key={n}
                onClick={() => handleNozzleChange(n)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                  wizard.nozzle === n
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {n}mm
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-5">
            Tem AMS acoplado?
          </h3>
          <div className="space-y-4">
            <div className="flex bg-surface-raised p-1.5 rounded-2xl border border-white/5">
                <button
                onClick={() => updateWizard({ hasAMS: false })}
                className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                    !wizard.hasAMS ? "bg-white/10 text-white" : "text-muted hover:text-white"
                )}
                >
                NÃO
                </button>
                <button
                onClick={() => updateWizard({ hasAMS: true })}
                className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all",
                    wizard.hasAMS ? "bg-primary text-white shadow-lg" : "text-muted hover:text-white"
                )}
                >
                SIM
                </button>
            </div>
            
            {wizard.hasAMS && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted/50">Quantidade de Slots</p>
                <div className="flex gap-2">
                  {[4, 8, 12, 16].map((count) => {
                    const isLocked = (wizard.printer === 'A1' || wizard.printer === 'A1-Mini') && count > 4;
                    return (
                      <button
                        key={count}
                        disabled={isLocked}
                        onClick={() => updateWizard({ amsSlotCount: count as any })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-black transition-all border",
                          wizard.amsSlotCount === count 
                            ? "border-primary bg-primary/10 text-primary" 
                            : isLocked ? "opacity-20 cursor-not-allowed border-transparent" : "border-white/5 bg-white/5 text-muted hover:text-white"
                        )}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
                {(wizard.printer === 'A1' || wizard.printer === 'A1-Mini') && (
                  <p className="text-[8px] text-muted italic">* A1 utiliza AMS Lite (max 4)</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
