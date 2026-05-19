import React from "react";
import { useStore } from "../lib/store";
import { ChevronRight, ChevronLeft, Sparkles, AlertCircle } from "lucide-react";
import { PrinterStep } from "./wizard/PrinterStep";
import { MaterialStep } from "./wizard/MaterialStep";
import { BuildPlateStep } from "./wizard/BuildPlateStep";
import { PriorityStep } from "./wizard/PriorityStep";
import { ReviewStep } from "./wizard/ReviewStep";
import { cn } from "../lib/utils";

export const Wizard: React.FC = () => {
  const { wizard, setStep, isGenerating, app } = useStore();
  const step = wizard.step;

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PrinterStep />;
      case 2:
        return <MaterialStep />;
      case 3:
        return <BuildPlateStep />;
      case 4:
        return <PriorityStep />;
      case 5:
        return <ReviewStep />;
      default:
        return null;
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
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{steps[step - 1]}</h2>
          <span className="text-sm text-muted-foreground">Passo {step} de 5</span>
        </div>
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i + 1 <= step ? "bg-primary" : "bg-white/5"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="mt-8 flex gap-4">
        {step > 1 && (
          <button
            onClick={prevStep}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-surface border border-white/10 hover:bg-surface-raised transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
        
        {step < 5 ? (
          <button
            onClick={nextStep}
            disabled={!wizard.fileName}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {!wizard.fileName && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          Faça upload de um arquivo para continuar
        </div>
      )}
    </div>
  );
};
