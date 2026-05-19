import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '../integrations/supabase/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Hexagon, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordComponent,
})

function ResetPasswordComponent() {
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState('')
  
  const navigate = useNavigate()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(`Erro: ${updateError.message}`)
        return
      }

      toast.success('Senha redefinida com sucesso!')
      setTimeout(() => {
        navigate({ to: '/' })
      }, 1500)
    } catch (e: any) {
      setError(`Erro inesperado: ${e.message}`)
    } finally {
      setLoading(false)
    }
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
          <p className="text-xs font-bold text-muted uppercase tracking-[0.3em] mt-3 opacity-60">Redefinir Senha</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold text-center animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password" title="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" title="confirmPassword" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-12 pr-12 h-12 bg-surface-raised border-border-strong rounded-xl focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary text-[#0d0d14] font-black tracking-widest uppercase hover:bg-primary-hover shadow-lg shadow-primary/20 rounded-xl flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>

        <p className="mt-8 text-center text-[9px] text-muted font-bold uppercase tracking-widest opacity-40 leading-relaxed italic">
          Após salvar, você será redirecionado para o aplicativo.
        </p>
      </div>
    </div>
  )
}
