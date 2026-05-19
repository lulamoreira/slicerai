import React from "react";
import { useAppStore, useSettingsStore } from "../store/useAppStore";
import { useTranslation } from "../lib/i18n";
import { 
  Settings as SettingsIcon, 
  History as HistoryIcon, 
  Moon, 
  Sun, 
  Languages, 
  Github,
  Hexagon
} from "lucide-react";
import { cn } from "../lib/utils";

interface NavbarProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onShowSettings, onShowHistory }) => {
  const { theme, setTheme, language, setLanguage, apiKey, history } = useSettingsStore();
  const t = useTranslation(language);

  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,200,180,0.3)]">
          <Hexagon className="w-5 h-5 text-white fill-white/20" />
        </div>
        <h1 className="font-black italic tracking-tighter text-xl text-white">
          SlicerAI <span className="text-primary">for Bambu</span>
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onShowHistory}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-white relative"
        >
          <HistoryIcon className="w-5 h-5" />
          {history.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#00c8b4]" />
          )}
        </button>
        
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-white"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-white text-[10px] font-black tracking-widest"
        >
          <Languages className="w-4 h-4" />
          {language === 'pt-BR' ? 'PT-BR' : 'EN'}
        </button>

        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted hover:text-white hidden sm:block"
        >
          <Github className="w-5 h-5" />
        </a>

        <div className="w-px h-6 bg-white/10 mx-1 sm:mx-2" />

        <button 
          onClick={onShowSettings}
          className={cn(
            "p-2 hover:bg-white/5 rounded-lg transition-colors",
            !apiKey ? "text-destructive animate-pulse" : "text-muted hover:text-white"
          )}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
