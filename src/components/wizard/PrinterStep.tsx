import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { PrinterModel, NozzleDiameter } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Monitor, Cpu, Zap, Radio } from "lucide-react";

const PRINTERS: { id: PrinterModel; name: string; icon: any }[] = [
  { id: "X1C", name: "X1 Carbon", icon: Cpu },
  { id: "X1E", name: "X1E", icon: Monitor },
  { id: "P1S", name: "P1S", icon: Zap },
  { id: "P1P", name: "P1P", icon: Radio },
  { id: "A1", name: "A1", icon: Radio },
  { id: "A1-Mini", name: "A1 Mini", icon: Radio },
];

const NOZZLES: NozzleDiameter[] = [0.2, 0.4, 0.6, 0.8];

export const PrinterStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">
          Selecione sua Impressora
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRINTERS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateWizard({ printer: p.id })}
              className={cn(
                "p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all relative group",
                wizard.printer === p.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-white/5 bg-surface-raised hover:bg-white/[0.05]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                wizard.printer === p.id ? "bg-primary text-white shadow-[0_0_15px_rgba(0,200,180,0.3)]" : "bg-white/5 text-muted group-hover:text-white"
              )}>
                <p.icon className="w-6 h-6" />
              </div>
              <span className={cn("text-xs font-bold", wizard.printer === p.id ? "text-primary" : "text-muted group-hover:text-white")}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">
          Diâmetro do Bocal (Nozzle)
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {NOZZLES.map((n) => (
            <button
              key={n}
              onClick={() => updateWizard({ nozzle: n })}
              className={cn(
                "py-4 rounded-xl border text-xs font-black transition-all",
                wizard.nozzle === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/5 bg-surface-raised hover:bg-white/[0.05] text-muted hover:text-white"
              )}
            >
              {n}mm
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
