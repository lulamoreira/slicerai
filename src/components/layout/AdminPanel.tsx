import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Users as UsersIcon, 
  FileText, 
  CreditCard, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus,
  Check,
  X,
  AlertCircle,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  Clock,
  Send,
  UserCheck,
  UserX,
  History
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'subs'>('users');
  const [requestCount, setRequestCount] = useState(0);

  const fetchCount = async () => {
    const { count } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setRequestCount(count || 0);
  };

  useEffect(() => {
    fetchCount();
    
    // Realtime subscription for request count
    const channel = supabase
      .channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, () => {
        fetchCount();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-surface flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold tracking-tighter text-foreground uppercase flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Admin Panel
          </h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<UsersIcon className="w-4 h-4" />} 
            label="Usuários" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <NavItem 
            icon={<FileText className="w-4 h-4" />} 
            label="Solicitações" 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')}
            badge={requestCount > 0 ? requestCount : undefined}
          />
          <NavItem 
            icon={<CreditCard className="w-4 h-4" />} 
            label="Assinaturas" 
            active={activeTab === 'subs'} 
            onClick={() => setActiveTab('subs')}
            disabled
          />
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] px-4 opacity-50">SlicerAI Admin v1.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8">
          <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
            {activeTab === 'users' ? 'Gestão de Usuários' : activeTab === 'requests' ? 'Solicitações de Acesso' : 'Assinaturas (Em Breve)'}
          </h1>
          <div className="flex items-center gap-4">
            {activeTab === 'users' && (
              <Button size="sm" className="h-9 px-4 text-[10px] font-bold tracking-widest uppercase">
                <UserPlus className="w-3.5 h-3.5 mr-2" />
                Adicionar Usuário
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'requests' && <RequestsTab />}
          {activeTab === 'subs' && <SubsTab />}
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, badge, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
      disabled ? "opacity-30 cursor-not-allowed" : "",
      active 
        ? "bg-primary text-[#0d0d14] shadow-lg shadow-primary/20" 
        : "text-muted hover:text-foreground hover:bg-surface-raised"
    )}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    {badge && (
      <span className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black",
        active ? "bg-[#0d0d14] text-primary" : "bg-primary text-[#0d0d14]"
      )}>
        {badge}
      </span>
    )}
    {disabled && <Lock className="w-3 h-3 opacity-50" />}
  </button>
);

const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface-raised rounded-xl" />)}
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-surface-raised p-2 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input placeholder="Buscar por nome ou email..." className="pl-12 bg-transparent border-none focus:ring-0 text-xs font-medium" />
        </div>
        <Button variant="ghost" size="sm" className="text-[10px] font-bold tracking-widest uppercase">
          <Filter className="w-3.5 h-3.5 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-[1.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-raised/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acesso</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Gemini</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expira</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-raised/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{user.full_name || '—'}</span>
                    <span className="text-[10px] text-muted font-medium">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.access_status} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{user.access_type}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[8px] font-black uppercase tracking-[0.1em] py-0.5",
                      user.api_key_mode === 'centralized' ? "border-teal-500/50 text-teal-500 bg-teal-500/5" : "border-muted text-muted"
                    )}
                  >
                    {user.api_key_mode === 'centralized' ? 'Chave Central' : 'Chave Pessoal'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold text-foreground">
                    {user.access_end ? new Date(user.access_end).toLocaleDateString() : 'Indefinido'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-primary-subtle text-muted hover:text-primary rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-2 hover:bg-destructive/10 text-muted hover:text-destructive rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onSave={() => {
            setSelectedUser(null);
            fetchUsers();
          }} 
        />
      )}
    </div>
  );
};

const RequestsTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeny = async (id: string) => {
    if (!confirm('Deseja negar esta solicitação?')) return;
    
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'denied', resolved_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      toast.error('Solicitação negada');
      fetchRequests();
    }
  };

  const handleApprove = async (req: any) => {
    // Open a simple prompt for days or set to indefinite
    const days = prompt('Aprovar por quantos dias? (Deixe vazio para Indefinido)', '30');
    let access_end = null;
    if (days) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(days));
      access_end = d.toISOString();
    }

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        access_status: 'active', 
        access_end,
        access_type: 'manual'
      })
      .eq('id', req.user_id);

    if (profileError) {
      toast.error('Erro ao atualizar perfil: ' + profileError.message);
      return;
    }

    // 2. Update Request
    const { error: requestError } = await supabase
      .from('access_requests')
      .update({ 
        status: 'approved', 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', req.id);

    if (!requestError) {
      toast.success('Acesso aprovado com sucesso!');
      fetchRequests();
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      {requests.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <History className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">Nenhuma solicitação encontrada</p>
        </div>
      )}
      {requests.map((req) => (
        <div key={req.id} className="p-6 bg-surface border border-border rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all shadow-sm group animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              req.type === 'renewal' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
            )}>
              {req.type === 'renewal' ? <History className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-foreground">{req.user_email}</span>
                <Badge variant="outline" className={cn(
                  "text-[8px] font-black uppercase tracking-widest py-0.5",
                  req.type === 'renewal' ? "border-accent text-accent" : "border-primary text-primary"
                )}>
                  {req.type === 'renewal' ? 'Renovação' : 'Novo Acesso'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 italic">"{req.message || 'Sem mensagem'}"</p>
              <div className="flex items-center gap-2 mt-2 text-[9px] text-muted font-bold uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                {new Date(req.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {req.status === 'pending' ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDeny(req.id)}
                  className="h-9 text-[10px] font-bold tracking-widest text-destructive border-destructive hover:bg-destructive/10"
                >
                  NEGAR
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(req)}
                  className="h-9 text-[10px] font-bold tracking-widest"
                >
                  APROVAR
                </Button>
              </>
            ) : (
              <Badge 
                variant="secondary" 
                className={cn(
                  "uppercase text-[8px] font-black px-3 py-1",
                  req.status === 'approved' ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
                )}
              >
                {req.status === 'approved' ? 'Aprovado' : 'Negado'}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const SubsTab = () => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
    <div className="w-24 h-24 bg-surface-raised rounded-full flex items-center justify-center border border-border shadow-inner">
      <Lock className="w-10 h-10 text-muted" />
    </div>
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Pagamentos — Em Breve</h2>
      <p className="text-muted-foreground max-w-sm">Esta área permitirá configurar planos de assinatura via Stripe ou Mercado Pago. O acesso é gerenciado manualmente por enquanto.</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    active: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    expired: "bg-destructive/10 text-destructive border-destructive/20",
    blocked: "bg-muted/10 text-muted border-muted/20",
  };
  const labels: any = {
    active: "Ativo",
    pending: "Pendente",
    expired: "Expirado",
    blocked: "Bloqueado",
  };
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
      styles[status] || styles.blocked
    )}>
      {labels[status] || status}
    </span>
  );
};

const ShieldAlert = ({ className }: { className?: string }) => (
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
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

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
