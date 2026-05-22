import React, { useState } from "react";
import { useSettingsStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  X, 
  Settings, 
  Eye, 
  EyeOff, 
  Wifi, 
  Languages, 
  Moon, 
  Sun, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { testConnectionDetailed } from "../../lib/ai";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { 
    apiKey, setApiKey,
    aiProvider, setAiProvider,
    groqApiKey, setGroqApiKey,
    deepseekKey, setDeepseekKey,
    openrouterKey, setOpenrouterKey,
    costPerKg, setCostPerKg, 
    language, setLanguage,
    theme, setTheme,
    defaultPrinter, setDefaultPrinter
  } = useSettingsStore();
  
  const printers = ["X1C", "X1E", "P1S", "P1P", "A1", "A1-Mini"];

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function testGeminiConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 20) {
      return { ok: false, message: 'Chave inválida — deve começar com "AIza..."' }
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'hi' }] }],
            generationConfig: { maxOutputTokens: 1 }
          })
        }
      )

      if (response.ok) {
        return { ok: true, message: '✅ Conectado com sucesso!' }
      }

      const errorBody = await response.json().catch(() => ({}));
      return { 
        ok: false, 
        message: `Gemini [${response.status}]: ${errorBody?.error?.message || errorBody?.error?.status || response.statusText || "Erro desconhecido"}` 
      };

    } catch (e: any) {
      if (e?.message?.includes('fetch')) {
        return { ok: false, message: 'Sem conexão com a internet ou CORS bloqueado' }
      }
      return { ok: false, message: `Erro inesperado: ${e?.message}` }
    }
  }

  const handleTest = async () => {
    const currentKey = 
      aiProvider === 'gemini' ? apiKey : 
      aiProvider === 'groq' ? groqApiKey : 
      aiProvider === 'deepseek' ? deepseekKey : 
      openrouterKey;
    if (!currentKey) {
      toast.error("Insira uma chave API primeiro");
      return;
    }
    setTesting(true);
    setTestResult('idle');
    
    let result;
    if (aiProvider === 'gemini') {
      result = await testGeminiConnection(currentKey);
    } else {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/models",
          {
            method: "GET",
            headers: { 
              "Authorization": `Bearer ${currentKey}`,
              "Content-Type": "application/json" 
            }
          }
        );
        if (response.ok) {
          result = { ok: true, message: '✅ Groq conectado com sucesso!' };
        } else {
          const err = await response.json().catch(() => ({}));
          result = { ok: false, message: `Erro Groq: ${err?.error?.message || response.statusText}` };
        }
      } catch (e: any) {
        result = { ok: false, message: `Erro de rede: ${e.message}` };
      }
    }
    
    setTesting(false);
    if (result.ok) {
      setTestResult('success');
      toast.success(result.message);
    } else {
      setTestResult('error');
      setErrorMessage(result.message);
      toast.error(result.message);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface border border-border rounded-[1.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-destructive opacity-50" />
        
        <button onClick={onClose} className="absolute top-6 right-6 p-1.5 text-muted hover:text-primary transition-all hover:bg-primary-subtle rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight mb-8 flex items-center gap-4 text-foreground uppercase">
          <div className="w-10 h-10 rounded-xl bg-primary-subtle flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          {language === 'pt-BR' ? 'Configurações' : 'Settings'}
        </h2>

        <div className="space-y-10 custom-scrollbar max-h-[60vh] pr-2 overflow-y-auto">
          {/* AI Provider Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">
              PROVEDOR DE IA
            </label>
            <div className="flex p-1 bg-surface-raised rounded-xl border border-border-strong gap-1 shadow-inner max-w-sm">
              <button 
                onClick={() => {
                  setAiProvider('gemini');
                  setTestResult('idle');
                }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                  aiProvider === 'gemini' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                )}
              >
                GEMINI
              </button>
              <button 
                onClick={() => {
                  setAiProvider('groq');
                  setTestResult('idle');
                }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                  aiProvider === 'groq' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                )}
              >
                GROQ
              </button>
            </div>
          </div>

          {/* AI Key Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                  {aiProvider === 'gemini' ? 'Google Gemini 2.0 Flash API Key' : 'GROQ API KEY'}
                </label>
                <div className="flex items-center gap-1 opacity-50">
                    <Wifi className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Conexão Segura</span>
                </div>
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
                        value={aiProvider === 'gemini' ? apiKey : groqApiKey}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          if (aiProvider === 'gemini') setApiKey(newKey);
                          else setGroqApiKey(newKey);
                        }}
                        placeholder={aiProvider === 'gemini' ? "AIza..." : "gsk_..."}
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
                  href={aiProvider === 'gemini' ? "https://aistudio.google.com/apikey" : "https://console.groq.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-primary hover:underline px-1"
                >
                  {language === 'pt-BR' 
                    ? (aiProvider === 'gemini' ? 'OBTER CHAVE GRÁTIS' : 'Obter chave grátis em console.groq.com') 
                    : (aiProvider === 'gemini' ? 'GET FREE KEY' : 'Get free key at console.groq.com')} <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest px-2 leading-relaxed italic opacity-50">
                    {language === 'pt-BR' 
                        ? (aiProvider === 'gemini' 
                            ? "Obtenha sua chave gratuita em aistudio.google.com/apikey. Não é necessário cartão de crédito." 
                            : "Obtenha sua chave gratuita em console.groq.com. Sua chave é salva localmente.")
                        : (aiProvider === 'gemini'
                            ? "Get your free key at aistudio.google.com/apikey. No credit card required."
                            : "Get your free key at console.groq.com. Your key is saved locally.")}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Default Printer */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">Impressora Padrão</label>
                <select 
                    value={defaultPrinter}
                    onChange={(e) => setDefaultPrinter(e.target.value)}
                    className="w-full bg-surface-raised border border-border-strong rounded-xl p-3.5 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                >
                    {printers.map(p => (
                        <option key={p} value={p}>{p.replace('X1C', 'X1 Carbon').replace('A1-Mini', 'A1 Mini')}</option>
                    ))}
                </select>
            </div>
             {/* Filament Cost */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">Custo do Filamento (R$/kg)</label>
                <input 
                    type="number"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-raised border border-border-strong rounded-xl p-3.5 text-sm font-mono font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
            </div>

            {/* Language */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">{language === 'pt-BR' ? 'Idioma' : 'Language'}</label>
                <div className="flex p-1 bg-surface-raised rounded-xl border border-border-strong gap-1 shadow-inner">
                    <button 
                        onClick={() => setLanguage('pt-BR')}
                        className={cn(
                            "flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                            language === 'pt-BR' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                        )}
                    >
                        PT-BR
                    </button>
                    <button 
                        onClick={() => setLanguage('en')}
                        className={cn(
                            "flex-1 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                            language === 'en' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                        )}
                    >
                        EN
                    </button>
                </div>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted px-1">{language === 'pt-BR' ? 'Interface' : 'Interface'}</label>
            <div className="flex p-1 bg-surface-raised rounded-xl border border-border-strong gap-1 shadow-inner max-w-sm">
                <button 
                    onClick={() => setTheme('dark')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                        theme === 'dark' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                    )}
                >
                    <Moon className="w-3.5 h-3.5" />
                    DARK
                </button>
                <button 
                    onClick={() => setTheme('light')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all",
                        theme === 'light' ? "bg-primary text-[#0d0d14] shadow-md" : "text-muted hover:text-primary hover:bg-primary-subtle"
                    )}
                >
                    <Sun className="w-3.5 h-3.5" />
                    LIGHT
                </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
            <button 
                onClick={handleClearData}
                className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-transparent border border-destructive text-destructive text-[10px] font-bold tracking-widest rounded-xl hover:bg-destructive/10 transition-all shadow-sm group"
            >
                <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {language === 'pt-BR' ? 'LIMPAR TUDO' : 'WIPE ALL DATA'}
            </button>
            <button 
                onClick={onClose}
                className="flex-1 py-3.5 bg-primary text-[#0d0d14] text-[10px] font-bold tracking-widest rounded-xl hover:bg-primary-hover hover:shadow-[var(--primary-glow)] transition-all shadow-lg uppercase"
            >
                {language === 'pt-BR' ? 'Salvar Alterações' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};
