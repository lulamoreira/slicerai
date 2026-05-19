import React, { useEffect, useState } from "react";
import { useSettingsStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { 
  Settings as SettingsIcon, 
  History as HistoryIcon, 
  Moon, 
  Sun, 
  Languages, 
  Github,
  Hexagon,
  HelpCircle,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCircle
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { AccountModal } from "./AccountModal";
import { HelpModal } from "./HelpModal";

interface NavbarProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onShowSettings, onShowHistory }) => {
  const { theme, setTheme, language, setLanguage, apiKey, history } = useSettingsStore();
  const { user, profile, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Deslogado com sucesso');
    navigate({ to: '/login' });
  };

  const getInitials = (name: string, email: string) => {
    const displayName = name || email || 'U';
    if (displayName.includes('@')) {
      return displayName.charAt(0).toUpperCase();
    }
    const parts = displayName.split(' ').filter(n => n.length > 0);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Status Chip logic
  const renderStatusChip = () => {
    if (!profile || profile.access_status !== 'active') return null;
    
    if (!profile.access_end) return null; // Indefinite

    const expiry = new Date(profile.access_end);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return (
        <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 border border-warning/20 text-warning text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
          ⚠️ Expira em {diffDays} dias
        </span>
      );
    }

    return (
      <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-success/10 border border-success/20 text-success text-[8px] font-black uppercase tracking-widest rounded-full">
        Ativo até {expiry.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </span>
    );
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
          className="flex items-center gap-2 px-1.5 py-0.5 border border-border-strong hover:bg-primary-subtle rounded-md transition-all text-foreground-soft hover:text-primary text-[0.7rem] hidden sm:flex"
        >
          <Languages className="w-3.5 h-3.5" />
          {language === 'pt-BR' ? 'PT-BR' : 'EN'}
        </button>

        <div className="w-px h-6 bg-border mx-1 sm:mx-2" />

        <button 
          onClick={() => setShowHelpModal(true)}
          className="p-1.5 hover:bg-primary-subtle rounded-lg transition-all text-muted hover:text-primary"
          title="Ajuda"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {renderStatusChip()}

        <button 
          onClick={onShowSettings}
          className={cn(
            "p-1.5 hover:bg-primary-subtle rounded-lg transition-all",
            !apiKey ? "text-destructive animate-pulse" : "text-muted hover:text-primary"
          )}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-surface-raised rounded-full border border-border transition-all"
            >
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-[#0d0d14]">
                {getInitials(profile?.full_name || '', user.email || '')}
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", showDropdown && "rotate-180")} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-3 w-64 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-4 py-3 border-b border-border mb-2">
                    <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || user.email}</p>
                    {profile?.full_name && (
                      <p className="text-[10px] text-muted font-medium truncate mt-0.5">{user.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        setShowAccountModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-raised rounded-xl text-[10px] font-bold text-foreground-soft hover:text-foreground transition-all uppercase tracking-widest text-left"
                    >
                      <UserCircle className="w-4 h-4 text-primary" />
                      Minha Conta
                    </button>
                    
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setShowDropdown(false);
                          navigate({ to: '/admin' });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/10 rounded-xl text-[10px] font-bold text-primary transition-all uppercase tracking-widest text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Painel Admin
                      </button>
                    )}
                    
                    <div className="h-px bg-border my-2 mx-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 rounded-xl text-[10px] font-bold text-destructive transition-all uppercase tracking-widest"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Button 
            size="sm" 
            onClick={() => navigate({ to: '/login' })}
            className="h-8 px-4 text-[10px] font-bold tracking-widest uppercase"
          >
            ENTRAR
          </Button>
        )}
      </div>

      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </header>
  );
};
