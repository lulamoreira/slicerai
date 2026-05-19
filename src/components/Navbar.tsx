import React, { useEffect, useState } from "react";
import { useAppStore, useSettingsStore } from "../store/useAppStore";
import { useTranslation } from "../lib/i18n";
import { 
  Settings as SettingsIcon, 
  History as HistoryIcon, 
  Moon, 
  Sun, 
  Languages, 
  Github,
  Hexagon,
  User as UserIcon,
  LogOut
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../integrations/supabase/client";
import { AuthModal } from "./AuthModal";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onShowSettings, onShowHistory }) => {
  const { theme, setTheme, language, setLanguage, apiKey, history } = useSettingsStore();
  const t = useTranslation(language);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Deslogado com sucesso');
  };

  return (
    <header className="h-[52px] border-b border-border bg-surface sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-[#0d0d14] fill-[#0d0d14]/20" />
        </div>
        <h1 className="font-extrabold tracking-tight text-lg text-foreground hidden sm:block">
          SlicerAI <span className="text-primary font-normal italic">for Bambu</span>
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onShowHistory}
          className="p-1.5 hover:bg-primary-subtle rounded-lg transition-all text-muted hover:text-primary relative"
        >
          <HistoryIcon className="w-5 h-5" />
          {history.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
        
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 hover:bg-primary-subtle rounded-lg transition-all text-muted hover:text-primary"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
          className="flex items-center gap-2 px-1.5 py-0.5 border border-border-strong hover:bg-primary-subtle rounded-md transition-all text-foreground-soft hover:text-primary text-[0.7rem]"
        >
          <Languages className="w-3.5 h-3.5" />
          {language === 'pt-BR' ? 'PT-BR' : 'EN'}
        </button>

        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer"
          className="p-1.5 hover:bg-primary-subtle rounded-lg transition-all text-muted hover:text-primary hidden sm:block"
        >
          <Github className="w-5 h-5" />
        </a>

        <div className="w-px h-6 bg-border mx-1 sm:mx-2" />

        <button 
          onClick={onShowSettings}
          className={cn(
            "p-1.5 hover:bg-primary-subtle rounded-lg transition-all",
            !apiKey ? "text-destructive animate-pulse" : "text-muted hover:text-primary"
          )}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
