import React, { useState } from "react";
import { useSettingsStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  X, 
  Settings, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { testClaudeKey } from "../../lib/ai";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { 
    claudeKey, setClaudeKey,
    language, 
    defaultPrinter, setDefaultPrinter
  } = useSettingsStore();
  
  const printers = ["X1C", "X1E", "P1S", "P1P", "A1", "A1-Mini"];

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTest = async () => {
    if (!claudeKey) {
      toast.error("Insira uma chave API primeiro");
      return;
    }
    setTesting(true);
    setTestResult('idle');
    
    const result = await testClaudeKey(claudeKey);
    
    setTesting(false);
    if (result === "ok") {
      setTestResult('success');
      toast.success("✅ Claude conectado com sucesso!");
    } else {
      setTestResult('error');
      const msg = result === "invalid" ? "Chave inválida" : "Erro ao conectar";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleClearData = () => {
    const msg = language === 'pt-BR' 
      ? "Tem certeza? Isso remove API key, histórico e preferências."
      : "Are you sure? This removes API key, history and preferences.";
    if (confirm(msg)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0d0d12]/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div className="w-full h-full md:h-auto max-w-lg bg-surface/90 border border-border/50 rounded-none md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 md:h-1.5 bg-gradient-to-r from-primary via-[#33f0dc] to-primary/50 opacity-80" />

        <button onClick={onClose} className="absolute top-6 right-6 p-1.5 text-muted hover:text-primary transition-all hover:bg-primary-subtle rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black tracking-tight mb-10 flex items-center gap-5 text-foreground uppercase">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-[var(--primary-glow)]">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          {language === 'pt-BR' ? 'Configurações' : 'Settings'}
        </h2>

        <div className="space-y-10 custom-scrollbar max-h-[70vh] md:max-h-[60vh] pr-2 overflow-y-auto">
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-warning leading-relaxed font-bold uppercase tracking-wider">
                ⚠️ Este provedor é pago. Você será cobrado diretamente pela Anthropic conforme seu uso. O modelo claude-haiku-4-5 custa cerca de $0.005 por análise.
              </p>
              <a 
                href="https://console.anthropic.com/settings/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] text-warning hover:underline font-bold uppercase tracking-widest flex items-center gap-1"
              >
                Ver Painel de Billing <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                  CLAUDE API KEY (claude-haiku-4-5)
                </label>
            </div>

            {useAuthStore.getState().profile?.api_key_mode === 'centralized' ? (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-success uppercase tracking-wider">Modo Centralizado Ativo</p>
                  <p className="text-[10px] text-success/80 leading-relaxed font-medium">
                    Você está usando a chave mestre do administrador. Nenhuma configuração pessoal é necessária.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <input 
                        type={showKey ? "text" : "password"}
                        value={claudeKey}
                        onChange={(e) => {
                          try {
                            setClaudeKey(e.target.value);
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }}
                        placeholder="sk-ant-..."
                        className="w-full bg-surface-raised border border-border-strong rounded-xl p-3.5 text-xs font-mono font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground pr-12"
                        />
                        <button 
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <button 
                        onClick={handleTest}
                        disabled={testing}
                        className={cn(
                            "px-6 rounded-xl text-[10px] font-bold tracking-widest transition-all shadow-sm border shrink-0",
                            testResult === 'success' 
                                ? "bg-success/10 border-success/20 text-success" 
                                : testResult === 'error'
                                ? "bg-destructive/10 border-destructive/20 text-destructive"
                                : "bg-transparent border-border-strong text-foreground hover:bg-surface-hover hover:border-primary hover:text-primary"
                        )}
                    >
                        {testing ? (
                            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                        ) : testResult === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            language === 'pt-BR' ? 'TESTAR' : 'TEST'
                        )}
                    </button>
                </div>
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary hover:underline px-1"
                >
                  Obter chave em console.anthropic.com <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">
              {language === 'pt-BR' ? 'Impressora Padrão' : 'Default Printer'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {printers.map((p) => (
                <button
                  key={p}
                  onClick={() => setDefaultPrinter(p)}
                  className={cn(
                    "py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all border",
                    defaultPrinter === p 
                      ? "bg-primary/10 border-primary/50 text-primary shadow-[var(--primary-glow-subtle)]" 
                      : "bg-surface-raised border-border-strong text-muted hover:border-primary/30"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex flex-col gap-4">
            <button 
              onClick={handleClearData}
              className="w-full py-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            >
              Resetar todos os dados do App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
