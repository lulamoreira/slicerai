import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { MATERIALS } from "../../lib/materials";

const PLATES = [
  { 
    id: "Cool Plate / PEI", 
    name: "Cool Plate / Smooth PEI", 
    temp: "35–55°C",
    mats: ["PLA", "PLA Silk", "PLA Matte", "PVA"],
    desc: "Melhor para PLA, acabamento liso." 
  },
  { 
    id: "Engineering Plate", 
    name: "Engineering Plate", 
    temp: "90–110°C",
    mats: ["ABS", "ASA", "PC", "PETG", "PA", "HIPS"],
    desc: "Para materiais técnicos (PA, PC, TPU)." 
  },
  { 
    id: "High Temperature Plate", 
    name: "High Temperature Plate", 
    temp: "100–120°C",
    mats: ["PA-CF", "PC", "ABS", "ASA"],
    desc: "PEI liso para altas temperaturas." 
  },
  { 
    id: "Textured PEI Plate", 
    name: "Textured PEI Plate", 
    temp: "35–110°C",
    mats: ["PLA", "PETG", "ABS", "ASA", "PA", "TPU"],
    desc: "Acabamento texturizado, universal (alta adesão)." 
  },
];

export const BuildPlateStep: React.FC = () => {
  const { wizard, updateWizard } = useAppStore();

  const isCompatible = (plateMats: string[]) => {
    if (wizard.hasAMS) {
        return wizard.amsSlots.slice(0, wizard.amsSlotCount).every(s => plateMats.some(m => s.material.includes(m)));
    }
    return plateMats.some(m => wizard.material.includes(m));
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">
        Placa de Impressão (Build Plate)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
        {PLATES.map((p) => {
          const compatible = isCompatible(p.mats);
          const isSelected = wizard.buildPlate === p.id;
          return (
            <button
              key={p.id}
              onClick={() => updateWizard({ buildPlate: p.id })}
              className={cn(
                "w-full p-6 rounded-3xl border flex flex-col items-start gap-4 transition-all text-left relative overflow-hidden group",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg shadow-primary/10"
                  : "border-white/5 bg-surface-raised hover:bg-white/[0.05]"
              )}
            >
              <div className="flex justify-between w-full items-start">
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5", isSelected ? "text-primary" : "text-muted/50")}>
                    {p.temp}
                </span>
                <div className="flex gap-1">
                    {compatible ? (
                         <span className="text-[8px] font-black uppercase tracking-tighter bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">Recomendado</span>
                    ) : (
                         <span className="text-[8px] font-black uppercase tracking-tighter bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">Incompatível</span>
                    )}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className={cn("text-xs font-black uppercase italic tracking-tight", isSelected ? "text-primary" : "text-white")}>
                  {p.name}
                </span>
                <p className="text-[9px] leading-tight text-muted/70 font-bold uppercase tracking-tighter">
                  {p.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {p.mats.slice(0, 5).map(m => (
                    <span key={m} className="text-[7px] font-black uppercase text-muted/30 border border-white/5 px-1.5 py-0.5 rounded">
                        {m}
                    </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};
