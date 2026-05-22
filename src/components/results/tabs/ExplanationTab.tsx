import React from "react";
import { useAppStore } from "../../../store/useAppStore";
import { AIResponse } from "../../../lib/types";
import { cn } from "../../../lib/utils";
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
    { icon: Layers, label: "Estratégia Geral", text: results.decisions.overall, isOverall: true },
    { icon: Layers, label: "Layer Height", text: results.decisions.layerHeight },
    { icon: Shield, label: "Infill", text: `${results.decisions.infillDensity} ${results.decisions.infillPattern}` },
    { icon: Box, label: "Suporte", text: results.decisions.support },
    { icon: Sparkles, label: "Pós-processamento", text: results.explanation.postprocessing_tips },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      {results.improvements && Object.keys(results.improvements).length > 0 && (
        <div className="p-5 bg-success/5 border border-success/30 border-l-[3px] border-l-success rounded-xl shadow-sm animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 mb-4 text-success">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">O que melhorei nesta versão:</span>
          </div>
          <div className="grid gap-3">
            {Object.entries(results.improvements).map(([field, reason], i) => (
              <div key={i} className="space-y-1">
                <p className="text-[10px] font-black text-success uppercase">{field}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.map((card, i) => (
        <div key={i} className={cn(
          "p-5 bg-surface border border-border border-l-[3px] rounded-xl shadow-sm transition-all hover:border-border-strong group",
          card.isOverall ? "border-l-primary bg-primary/5" : "border-l-primary"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                <card.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{card.label}</span>
          </div>
          <p className={cn(
            "text-sm leading-relaxed pl-1",
            card.isOverall ? "text-foreground font-medium italic" : "text-foreground-soft"
          )}>{card.text}</p>
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
