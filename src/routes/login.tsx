import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '../integrations/supabase/client'
import { lovable } from '../integrations/lovable/index'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Hexagon, Mail, Lock, User, Eye, EyeOff, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [activeTab, setActiveTab] = React.useState<'login' | 'signup'>('login')
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [signedUp, setSignedUp] = React.useState(false)
  
  const navigate = useNavigate()
  const { user } = useAuthStore()

  React.useEffect(() => {
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        throw error
      }
      toast.success('✅ Entrando...')
      // Small delay to show the success toast before redirecting
      setTimeout(() => {
        navigate({ to: '/' })
      }, 1000)
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('Este email já tem uma conta. Tente fazer login.')
        }
        throw error
      }

      if (data.user) {
        // Initial request will be handled by the trigger in DB
        // But we explicitly call notify-admin for UX
        await supabase.functions.invoke('notify-admin', {
          body: {
            user_email: email,
            user_name: fullName,
            type: 'new_access',
            message: 'Novo cadastro realizado pelo formulário.'
          }
        })
        
        // Auto-login since email confirmation is disabled
        toast.success('✅ Conta criada! Entrando...')
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1500)
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      })
      if (result.error) throw result.error
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Digite seu email primeiro')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Link de recuperação enviado para seu email!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (signedUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <CheckCircle2 className="w-20 h-20 text-success" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground uppercase">Conta Criada!</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seu acesso está pendente de aprovação pelo administrador.
              Você receberá um email quando for liberado.
            </p>
          </div>
          <Button variant="outline" onClick={() => setSignedUp(false)} className="w-full">
            Voltar ao Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md bg-surface border border-border rounded-[2rem] p-10 shadow-2xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-destructive" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 group hover:rotate-12 transition-transform duration-500">
            <Hexagon className="w-10 h-10 text-[#0d0d14] fill-[#0d0d14]/20" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">
            SlicerAI <span className="text-primary italic font-normal">for Bambu</span>
          </h1>
          <p className="text-xs font-bold text-muted uppercase tracking-[0.3em] mt-3 opacity-60">Otimização Profissional com IA</p>
        </div>

        <div className="flex p-1 bg-surface-raised rounded-xl border border-border-strong mb-8">
          <button 
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-bold tracking-widest transition-all ${activeTab === 'login' ? 'bg-primary text-[#0d0d14] shadow-md' : 'text-muted hover:text-foreground'}`}
          >
            ENTRAR
          </button>
          <button 
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-bold tracking-widest transition-all ${activeTab === 'signup' ? 'bg-primary text-[#0d0d14] shadow-md' : 'text-muted hover:text-foreground'}`}
          >
            CRIAR CONTA
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-12 h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha</Label>
                <button type="button" onClick={handleResetPassword} className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest">Esqueci a senha</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary text-[#0d0d14] font-black tracking-widest uppercase hover:bg-primary-hover shadow-lg shadow-primary/20 rounded-xl flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <Input
                  id="fullName"
                  placeholder="Seu nome"
                  className="pl-12 h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-12 h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</Label>
                <Input
                  id="pass"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmar</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary text-[#0d0d14] font-black tracking-widest uppercase hover:bg-primary-hover shadow-lg shadow-primary/20 rounded-xl mt-2 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Criando Conta...' : 'Criar Conta'}
            </Button>
          </form>
        )}

        <div className="mt-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-strong"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-surface px-4 text-muted font-bold">Ou continue com</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 flex items-center justify-center gap-3 bg-transparent border-border-strong rounded-xl hover:bg-surface-raised transition-all font-bold group" 
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-8 text-center text-[9px] text-muted font-bold uppercase tracking-widest opacity-40 leading-relaxed italic">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </div>
  )
}
