import React from "react";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";

const PLATES = [
  { id: "Cool Plate / PEI Plate", name: "Cool Plate / Smooth PEI", desc: "Melhor para PLA, acabamento liso." },
  { id: "Engineering Plate", name: "Engineering Plate", desc: "Para materiais técnicos (PA, PC, TPU)." },
  { id: "High Temperature Plate", name: "High Temperature Plate", desc: "PEI liso para altas temperaturas." },
  { id: "Textured PEI Plate", name: "Textured PEI Plate", desc: "Acabamento texturizado, alta adesão." },
];

export const BuildPlateStep: React.FC = () => {
  const { wizard, updateWizard } = useStore();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Placa de Impressão (Build Plate)
      </h3>
      <div className="space-y-3">
        {PLATES.map((p) => (
          <button
            key={p.id}
            onClick={() => updateWizard({ buildPlate: p.id })}
            className={cn(
              "w-full p-4 rounded-xl border flex flex-col items-start gap-1 transition-all text-left",
              wizard.buildPlate === p.id
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-white/10 bg-surface hover:bg-surface-raised"
            )}
          >
            <span className={cn("text-sm font-bold", wizard.buildPlate === p.id ? "text-primary" : "text-foreground")}>
              {p.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {p.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
