import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { 
  Clock, 
  Lock, 
  ShieldAlert, 
  LogOut, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export const AccessStatusScreen: React.FC = () => {
  const { profile, logout } = useAuthStore();
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!profile) return null;

  const handleRequest = async (type: 'new_access' | 'renewal') => {
    setLoading(true);
    try {
      // Insert access request
      const { error: requestError } = await supabase
        .from('access_requests')
        .insert({
          user_id: profile.id,
          user_email: profile.email,
          type,
          message: type === 'renewal' ? 'Solicitação de renovação de acesso.' : 'Solicitação de novo acesso.',
        });

      if (requestError) throw requestError;

      // Call notify-admin edge function
      await supabase.functions.invoke('notify-admin', {
        body: {
          user_email: profile.email,
          user_name: profile.full_name || profile.email,
          type,
          message: type === 'renewal' ? 'Solicitação de renovação.' : 'Novo usuário aguardando.',
        }
      });

      setRequested(true);
      toast.success('Solicitação enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (profile.access_status) {
      case 'pending':
        return {
          icon: <Clock className="w-20 h-20 text-warning animate-pulse" />,
          title: "Acesso Pendente",
          text: "Sua conta foi criada e está aguardando aprovação do administrador. Você receberá um email quando seu acesso for liberado.",
          primaryAction: (
            <Button 
              variant="outline" 
              onClick={() => handleRequest('new_access')} 
              disabled={requested || loading}
              className="w-full flex items-center gap-2"
            >
              {requested ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {requested ? 'Solicitação Enviada' : 'Reenviar Solicitação'}
            </Button>
          )
        };
      case 'expired':
        return {
          icon: <Lock className="w-20 h-20 text-destructive" />,
          title: "Acesso Expirado",
          text: `Seu período de acesso terminou em ${profile.access_end ? new Date(profile.access_end).toLocaleDateString() : '—'}. Um email foi enviado ao administrador solicitando renovação.`,
          primaryAction: (
            <Button 
              variant="default" 
              onClick={() => handleRequest('renewal')} 
              disabled={requested || loading}
              className="w-full bg-destructive hover:bg-destructive/90 text-white flex items-center gap-2"
            >
              {requested ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              {requested ? 'Solicitação Enviada' : 'Solicitar Renovação'}
            </Button>
          )
        };
      case 'blocked':
        return {
          icon: <ShieldAlert className="w-20 h-20 text-destructive" />,
          title: "Acesso Bloqueado",
          text: "Seu acesso foi bloqueado. Entre em contato com o administrador para mais informações.",
          primaryAction: null
        };
      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-background flex items-center justify-center p-6 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)] opacity-20 pointer-events-none" />
      
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">{content.icon}</div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground uppercase">{content.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{content.text}</p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {content.primaryAction}
          <Button variant="ghost" onClick={logout} className="w-full flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

const RotateCcw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
