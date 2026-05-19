import React from "react";
import { AIResponse } from "../../../lib/types";
import { 
  Layers, 
  Shield, 
  Box, 
  Palette, 
  Sparkles, 
  AlertTriangle 
} from "lucide-react";

export const ExplanationTab = ({ results }: { results: AIResponse }) => {
  const cards = [
    { icon: Layers, label: "Layer Height", text: results.explanation.layer_height_reason },
    { icon: Shield, label: "Infill", text: results.explanation.infill_reason },
    { icon: Box, label: "Suporte", text: results.explanation.support_reason },
    { icon: Palette, label: "Material & Plate", text: results.explanation.material_plate_tips },
    { icon: Sparkles, label: "Pós-processamento", text: results.explanation.postprocessing_tips },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      {cards.map((card, i) => (
        <div key={i} className="p-5 bg-surface-raised border border-white/5 rounded-2xl shadow-xl transition-all hover:border-primary/20 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <card.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{card.label}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground italic pl-1">{card.text}</p>
        </div>
      ))}

      {results.explanation.warnings.length > 0 && (
        <div className="p-5 bg-destructive/5 border border-destructive/10 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Alertas Importantes</span>
          </div>
          <ul className="space-y-3">
            {results.explanation.warnings.map((w, i) => (
              <li key={i} className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="text-destructive font-black mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
