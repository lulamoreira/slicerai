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
        <div key={i} className="p-5 bg-surface border border-border border-l-[3px] border-l-primary rounded-xl shadow-sm transition-all hover:border-border-strong group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                <card.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{card.label}</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground-soft pl-1">{card.text}</p>
        </div>
      ))}

      {results.explanation.warnings.length > 0 && (
        <div className="p-5 bg-[rgba(255,180,84,0.07)] border border-border-strong border-l-[3px] border-l-warning rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-warning">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Alertas Importantes</span>
          </div>
          <ul className="space-y-3">
            {results.explanation.warnings.map((w, i) => (
              <li key={i} className="flex gap-3 text-sm text-warning leading-relaxed">
                <span className="text-warning font-bold mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
