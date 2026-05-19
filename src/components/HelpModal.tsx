import React from "react";
import { X, HelpCircle, Package, Wand2, Bot, ClipboardCheck, Key, MessageSquareQuestion } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-destructive opacity-50" />
        
        <button onClick={onClose} className="absolute top-6 right-6 p-1.5 text-muted hover:text-primary transition-all hover:bg-primary-subtle rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight mb-8 flex items-center gap-4 text-foreground uppercase">
          <div className="w-10 h-10 rounded-xl bg-primary-subtle flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          Como usar o SlicerAI
        </h2>

        <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {/* Steps */}
          <div className="space-y-6">
            <StepItem 
              icon={<Package className="w-4 h-4" />}
              step="PASSO 1"
              title="Carregue seu modelo"
              description="Arraste um arquivo .STL ou .3MF para a área de upload. O app analisa a geometria automaticamente."
            />
            <StepItem 
              icon={<Wand2 className="w-4 h-4" />}
              step="PASSO 2"
              title="Configure o wizard"
              description="Escolha sua impressora Bambu, material, build plate e qualidade desejada em 5 passos simples."
            />
            <StepItem 
              icon={<Bot className="w-4 h-4" />}
              step="PASSO 3"
              title="Gere as configurações"
              description="A IA analisa seu modelo e retorna as melhores configurações para o Bambu Studio."
            />
            <StepItem 
              icon={<ClipboardCheck className="w-4 h-4" />}
              step="PASSO 4"
              title="Use no Bambu Studio"
              description="Copie as configurações ou baixe o arquivo .txt e aplique no seu slicer."
            />
          </div>

          {/* Gemini Key */}
          <div className="p-6 bg-primary/5 border-l-4 border-primary rounded-r-2xl space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Key className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Como obter a chave Gemini (Grátis)</h3>
            </div>
            <ol className="space-y-2">
              {[
                "Acesse aistudio.google.com/apikey",
                "Faça login com sua conta Google",
                "Clique em \"Create API Key\"",
                "Cole a chave em ⚙️ Configurações"
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-[11px] font-medium text-foreground/80">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  {text}
                </li>
              ))}
            </ol>
            <p className="text-[9px] font-bold text-muted uppercase tracking-widest pt-1">
              Não precisa de cartão de crédito.
            </p>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted px-1">
              <MessageSquareQuestion className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-widest">Perguntas Frequentes</h3>
            </div>
            <div className="space-y-2">
              <FAQItem 
                question="Quais impressoras são suportadas?"
                answer="X1 Carbon, X1E, P1S, P1P, A1, A1 Mini."
              />
              <FAQItem 
                question="Minha chave fica salva com segurança?"
                answer="Sim, apenas no seu navegador. Nunca é enviada para nossos servidores."
              />
              <FAQItem 
                question="O app faz o fatiamento do modelo?"
                answer="Não — ele gera as configurações ideais para você aplicar no Bambu Studio."
              />
              <FAQItem 
                question="Funciona com AMS multi-color?"
                answer="Sim! Configure os slots no Passo 2."
              />
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-8 h-12 text-[10px] font-black tracking-widest uppercase rounded-2xl">
          Fechar
        </Button>
      </div>
    </div>
  );
};

const StepItem = ({ icon, step, title, description }: any) => (
  <div className="flex gap-5 group">
    <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-colors">
      <div className="text-primary">{icon}</div>
    </div>
    <div className="space-y-1">
      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{step}</span>
      <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">{title}</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: any) => (
  <div className="p-4 bg-surface-raised border border-border rounded-2xl space-y-1.5 hover:border-primary/30 transition-all cursor-default group">
    <p className="text-[10px] font-black text-foreground uppercase tracking-tight flex items-center gap-2">
      <span className="text-primary group-hover:translate-x-0.5 transition-transform">▸</span>
      {question}
    </p>
    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed pl-3.5">
      {answer}
    </p>
  </div>
);
