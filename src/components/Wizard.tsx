import React from "react";
import { useAppStore } from "../store/useAppStore";
import { ChevronRight, ChevronLeft, Sparkles, AlertCircle } from "lucide-react";
import { PrinterStep } from "./wizard/PrinterStep";
import { MaterialStep } from "./wizard/MaterialStep";
import { BuildPlateStep } from "./wizard/BuildPlateStep";
import { PriorityStep } from "./wizard/PriorityStep";
import { ReviewStep } from "./wizard/ReviewStep";
import { cn } from "../lib/utils";

export const Wizard: React.FC = () => {
  const { wizard, updateWizard, status } = useAppStore();
  const step = wizard.step;
  const isGenerating = status === 'generating';

  const nextStep = () => {
    if (step < 5) updateWizard({ step: step + 1 });
  };

  const prevStep = () => {
    if (step > 1) updateWizard({ step: step - 1 });
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <PrinterStep />;
      case 2: return <MaterialStep />;
      case 3: return <BuildPlateStep />;
      case 4: return <PriorityStep />;
      case 5: return <ReviewStep />;
      default: return null;
    }
  };

  const steps = [
    "Impressora",
    "Material",
    "Mesa",
    "Prioridade",
    "Revisão",
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Passo 0{step}</span>
            <h2 className="text-2xl font-bold text-foreground uppercase">{steps[step - 1]}</h2>
          </div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{step} / 5</span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i + 1 <= step ? "bg-primary shadow-[var(--primary-glow)]" : "bg-surface-raised"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-4 custom-scrollbar">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="mt-4 flex gap-4 shrink-0">
        {step > 1 && (
          <button
            onClick={prevStep}
            disabled={isGenerating}
            className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-transparent border border-border-strong text-[10px] font-bold tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            VOLTAR
          </button>
        )}
        
        {step < 5 ? (
          <button
            onClick={nextStep}
            disabled={!wizard.fileName}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-primary text-[#0d0d14] text-[10px] font-bold tracking-widest hover:bg-primary-hover hover:shadow-[var(--primary-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            PRÓXIMO PASSO
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {!wizard.fileName && (
        <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-[10px] font-bold uppercase tracking-widest animate-pulse">
          <AlertCircle className="w-4 h-4" />
          Upload de arquivo necessário para prosseguir
        </div>
      )}
    </div>
  );
};
