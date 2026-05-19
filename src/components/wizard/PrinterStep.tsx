import React from "react";
import { useStore } from "../../lib/store";
import { PrinterModel, NozzleDiameter } from "../../lib/types";
import { cn } from "../../lib/utils";

const PRINTERS: { id: PrinterModel; name: string; image: string }[] = [
  { id: "X1C", name: "X1 Carbon", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
  { id: "X1E", name: "X1E", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
  { id: "P1S", name: "P1S", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
  { id: "P1P", name: "P1P", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
  { id: "A1", name: "A1", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
  { id: "A1-Mini", name: "A1 Mini", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop" },
];

const NOZZLES: NozzleDiameter[] = [0.2, 0.4, 0.6, 0.8];

export const PrinterStep: React.FC = () => {
  const { wizard, updateWizard } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Selecione sua Impressora
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRINTERS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateWizard({ printer: p.id })}
              className={cn(
                "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                wizard.printer === p.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-white/10 bg-surface hover:bg-surface-raised"
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                <img src={p.image} alt={p.name} className="opacity-50 grayscale hover:grayscale-0" />
              </div>
              <span className={cn("text-sm font-medium", wizard.printer === p.id ? "text-primary" : "text-foreground")}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Diâmetro do Bocal (Nozzle)
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {NOZZLES.map((n) => (
            <button
              key={n}
              onClick={() => updateWizard({ nozzle: n })}
              className={cn(
                "py-3 rounded-lg border text-sm font-medium transition-all",
                wizard.nozzle === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-surface hover:bg-surface-raised"
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
