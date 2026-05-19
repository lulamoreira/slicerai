import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { X, User, Mail, Calendar, Key, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface AccountModalProps {
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const { user, profile } = useAuthStore();

  if (!user || !profile) return null;

  const getInitials = (name: string, email: string) => {
    const displayName = name || email || 'U';
    if (displayName.includes('@')) {
      return displayName.charAt(0).toUpperCase();
    }
    const parts = displayName.split(' ').filter(n => n.length > 0);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface border border-border rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-destructive opacity-50" />
        
        <button onClick={onClose} className="absolute top-8 right-8 p-1.5 text-muted hover:text-primary transition-all hover:bg-primary-subtle rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-2xl font-black text-[#0d0d14] mb-4 shadow-xl shadow-primary/20 ring-4 ring-primary/10">
            {getInitials(profile.full_name || '', user.email || '')}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">{profile.full_name || 'Usuário SlicerAI'}</h2>
          <p className="text-xs text-muted font-bold tracking-widest uppercase opacity-60 mt-1">{user.email}</p>
        </div>

        <div className="space-y-6">
          <div className="p-5 bg-surface-raised border border-border rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-3 text-muted">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Status de Acesso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  profile.access_status === 'active' ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                )}>
                  {profile.access_status === 'active' ? '✅ Ativo' : 'Pendente'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Acesso Expira em:</span>
              <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                {profile.access_end ? formatDate(profile.access_end) : 'Indefinido'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-raised border border-border rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Membro desde</span>
              </div>
              <p className="text-[10px] font-bold text-foreground">{formatDate(profile.created_at)}</p>
            </div>

            <div className="p-4 bg-surface-raised border border-border rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-muted">
                <Key className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Modo de API</span>
              </div>
              <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                {profile.api_key_mode === 'centralized' ? '🔑 Chave Central' : '🔑 Chave Pessoal'}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-10 h-12 text-[10px] font-black tracking-widest uppercase rounded-2xl">
          Fechar
        </Button>
      </div>
    </div>
  );
};
