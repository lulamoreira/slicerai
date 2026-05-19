import React from "react";
import { AIResponse, PrinterModel } from "../../../lib/types";
import { Check } from "lucide-react";
import { cn } from "../../../lib/utils";

export const ChecklistTab = ({ results, printer }: { results: AIResponse, printer: PrinterModel }) => {
  const baseItems = [
    "Filamento seco (especialmente PA, PC, PETG, Nylon)",
    "Nozzle limpo e sem entupimento",
    "Build plate limpa com IPA 99%",
    "Calibração de fluxo (flow calibration) recente",
    ...(printer === "X1C" || printer === "X1E" ? ["Lidar calibration executada"] : []),
    "Modelo orientado corretamente no slicer",
    "Primeira camada verificada na prévia do Bambu Studio"
  ];

  const fullItems = [...baseItems, ...results.explanation.pre_print_checklist_extra];

  return (
    <div className="space-y-3 animate-in fade-in duration-500 pb-10">
      {fullItems.map((item, i) => (
        <ChecklistItem key={i} text={item} />
      ))}
    </div>
  );
};

const ChecklistItem = ({ text }: { text: string }) => {
  const [checked, setChecked] = React.useState(false);

  return (
    <button 
      onClick={() => setChecked(!checked)}
      className={cn(
        "w-full flex items-center gap-5 p-5 bg-surface-raised border rounded-2xl transition-all text-left shadow-lg group",
        checked ? "border-primary/40 bg-primary/[0.03]" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-xl border flex items-center justify-center transition-all shadow-inner",
        checked ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-surface border-white/10 group-hover:border-white/20"
      )}>
        <Check className={cn("w-4 h-4 text-white transition-all scale-50 opacity-0", checked && "scale-100 opacity-100")} />
      </div>
      <span className={cn(
        "text-sm font-bold transition-colors leading-relaxed truncate-2-lines",
        checked ? "text-white italic line-through opacity-50" : "text-muted-foreground group-hover:text-white"
      )}>
        {text}
      </span>
    </button>
  );
};
