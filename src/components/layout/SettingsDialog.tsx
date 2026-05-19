import React, { useState } from "react";
import { useSettingsStore } from "../../store/useAppStore";
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
import { testConnection } from "../../lib/ai";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { 
    apiKey, setApiKey, 
    costPerKg, setCostPerKg, 
    language, setLanguage,
    theme, setTheme,
    defaultPrinter, setDefaultPrinter
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTest = async () => {
    if (!apiKey) {
        toast.error("Insira uma chave API primeiro");
        return;
    }
    setTesting(true);
    setTestResult('idle');
    const ok = await testConnection(apiKey);
    setTesting(false);
    if (ok) {
      setTestResult('success');
      toast.success("Conexão estabelecida!");
    } else {
      setTestResult('error');
      setErrorMessage("Chave inválida ou erro de rede");
      toast.error("Erro na conexão");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-surface-raised border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-destructive opacity-50" />
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-muted hover:text-white transition-colors bg-white/5 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black italic tracking-tighter mb-10 flex items-center gap-4 text-white uppercase">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          {language === 'pt-BR' ? 'Configurações' : 'Settings'}
        </h2>

        <div className="space-y-10 custom-scrollbar max-h-[60vh] pr-2 overflow-y-auto">
          {/* OpenAI Key */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">OpenAI API Key</label>
                <div className="flex items-center gap-1 opacity-50">
                    <Wifi className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Conexão Segura</span>
                </div>
            </div>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input 
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-xs font-mono font-bold outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-white pr-12"
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <button 
                    onClick={handleTest}
                    disabled={testing}
                    className={cn(
                        "px-6 rounded-2xl text-[10px] font-black tracking-widest transition-all shadow-lg border shrink-0",
                        testResult === 'success' 
                            ? "bg-green-500/10 border-green-500/20 text-green-500" 
                            : testResult === 'error'
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                    )}
                >
                    {testing ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                    ) : testResult === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        language === 'pt-BR' ? 'TESTAR' : 'TEST'
                    )}
                </button>
            </div>
            <p className="text-[9px] text-muted/40 font-bold uppercase tracking-widest px-2 leading-relaxed italic">
                {language === 'pt-BR' 
                    ? "* Sua chave é salva localmente e nunca enviada para nossos servidores." 
                    : "* Your key is saved locally and never sent to our servers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Filament Cost */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted px-1">Custo do Filamento (R$/kg)</label>
                <input 
                    type="number"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-sm font-mono font-bold outline-none focus:border-primary/40 transition-all text-white"
                />
            </div>

            {/* Language */}
            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted px-1">{language === 'pt-BR' ? 'Idioma' : 'Language'}</label>
                <div className="flex p-1.5 bg-surface rounded-2xl border border-white/5 gap-1 shadow-inner">
                    <button 
                        onClick={() => setLanguage('pt-BR')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all",
                            language === 'pt-BR' ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
                        )}
                    >
                        PT-BR
                    </button>
                    <button 
                        onClick={() => setLanguage('en')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all",
                            language === 'en' ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
                        )}
                    >
                        EN
                    </button>
                </div>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted px-1">{language === 'pt-BR' ? 'Interface' : 'Interface'}</label>
            <div className="flex p-1.5 bg-surface rounded-2xl border border-white/5 gap-1 shadow-inner max-w-sm">
                <button 
                    onClick={() => setTheme('dark')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all",
                        theme === 'dark' ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
                    )}
                >
                    <Moon className="w-3.5 h-3.5" />
                    DARK
                </button>
                <button 
                    onClick={() => setTheme('light')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all",
                        theme === 'light' ? "bg-white/10 text-white shadow-lg" : "text-muted hover:text-white"
                    )}
                >
                    <Sun className="w-3.5 h-3.5" />
                    LIGHT
                </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-4">
            <button 
                onClick={handleClearData}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black tracking-widest rounded-2xl hover:bg-destructive hover:text-white transition-all shadow-lg group"
            >
                <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {language === 'pt-BR' ? 'LIMPAR TUDO' : 'WIPE ALL DATA'}
            </button>
            <button 
                onClick={onClose}
                className="flex-1 py-4 bg-primary text-white text-[10px] font-black tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-[0_10px_25px_rgba(0,200,180,0.3)] uppercase italic"
            >
                {language === 'pt-BR' ? 'Salvar Alterações' : 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};
