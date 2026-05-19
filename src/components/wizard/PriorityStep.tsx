import React from "react";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import { Zap, Shield, Eye, Settings } from "lucide-react";

const USE_CASES = [
  { id: "Decorative", name: "Decorativo", icon: Eye, desc: "Foco total na estética e acabamento superficial." },
  { id: "Functional", name: "Funcional", icon: Shield, desc: "Peças mecânicas que exigem resistência e precisão." },
  { id: "Prototype", name: "Protótipo Rápido", icon: Zap, desc: "Velocidade máxima para validar forma e encaixe." },
  { id: "Technical", name: "Técnico/Industrial", icon: Settings, desc: "Materiais especiais e tolerâncias rigorosas." },
];

export const PriorityStep: React.FC = () => {
  const { wizard, updateWizard } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Prioridade
          </h3>
          <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">
            {wizard.priority < 40 ? "Qualidade" : wizard.priority > 60 ? "Velocidade" : "Equilibrado"}
          </span>
        </div>
        
        <div className="relative pt-6 pb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={wizard.priority}
            onChange={(e) => updateWizard({ priority: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-4 text-[10px] font-bold text-muted-foreground uppercase">
            <span>Máxima Qualidade</span>
            <span>Máxima Velocidade</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Tipo de Uso
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {USE_CASES.map((uc) => (
            <button
              key={uc.id}
              onClick={() => updateWizard({ useCase: uc.id })}
              className={cn(
                "w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left",
                wizard.useCase === uc.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-white/10 bg-surface hover:bg-surface-raised"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                wizard.useCase === uc.id ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
              )}>
                <uc.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-bold", wizard.useCase === uc.id ? "text-primary" : "text-foreground")}>
                  {uc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uc.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
