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
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <h3 className="card-section-title mb-3 text-xs">
          Selecione sua Impressora
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRINTERS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateWizard({ printer: p.id })}
              className={cn(
                "p-3 rounded-xl border-2 cursor-pointer transition-all text-left flex flex-col items-start gap-2",
                wizard.printer === p.id
                  ? "border-primary bg-primary-subtle shadow-[var(--primary-glow)]"
                  : "border-border bg-surface hover:bg-surface-hover hover:border-border-strong"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg mb-2 flex items-center justify-center transition-all",
                wizard.printer === p.id ? "bg-primary text-[#0d0d14]" : "bg-surface-raised text-muted group-hover:text-foreground"
              )}>
                <p.icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className={cn("font-bold text-sm uppercase tracking-tight", wizard.printer === p.id ? "text-primary" : "text-foreground")}>
                  {p.name}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.badges.slice(0, 1).map(b => (
                    <span key={b} className="text-[0.6rem] font-medium tracking-tight bg-primary-subtle px-1.5 py-0.5 rounded-full text-primary border border-primary/30">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div 
          onClick={() => useAppStore.setState({ status: 'idle', file: null, geometry: null, results: null })}
          className="text-[10px] text-muted hover:text-primary cursor-pointer underline inline-block"
        >
          ← Trocar arquivo
        </div>
      </section>

      <section className="flex flex-col gap-3 mt-2">
        <div>
          <h3 className="card-section-title mb-2 text-xs">
            Diâmetro do Bocal (Nozzle)
          </h3>
          <div className="flex gap-2 bg-surface-raised p-1 rounded-xl border border-border">
            {NOZZLES.map((n) => (
              <button
                key={n}
                onClick={() => handleNozzleChange(n)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                  wizard.nozzle === n
                    ? "bg-primary text-[#0d0d14] shadow-md"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                )}
              >
                {n}mm
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="card-section-title mb-2 text-xs">
            Tem AMS acoplado?
          </h3>
          <div className="space-y-4">
            <div className="flex bg-surface-raised p-1 rounded-xl border border-border">
                <button
                onClick={() => updateWizard({ hasAMS: false })}
                className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                    !wizard.hasAMS ? "bg-primary text-[#0d0d14]" : "text-muted hover:text-foreground"
                )}
                >
                NÃO
                </button>
                <button
                onClick={() => updateWizard({ hasAMS: true })}
                className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all",
                    wizard.hasAMS ? "bg-primary text-[#0d0d14]" : "text-muted hover:text-foreground"
                )}
                >
                SIM
                </button>
            </div>
            
            {wizard.hasAMS && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted">Quantidade de Slots</p>
                <div className="flex gap-2">
                  {[4, 8, 12, 16].map((count) => {
                    const isLocked = (wizard.printer === 'A1' || wizard.printer === 'A1-Mini') && count > 4;
                    return (
                      <button
                        key={count}
                        disabled={isLocked}
                        onClick={() => updateWizard({ amsSlotCount: count as any })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border",
                          wizard.amsSlotCount === count 
                            ? "border-primary bg-primary-subtle text-primary" 
                            : isLocked ? "opacity-20 cursor-not-allowed border-transparent" : "border-border bg-surface-raised text-muted hover:text-foreground"
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
