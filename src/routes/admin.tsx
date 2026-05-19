import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AdminPanel } from '../components/layout/AdminPanel'
import { useAuthStore } from '../store/useAuthStore'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin')({
  component: AdminComponent,
})

function AdminComponent() {
  const { profile, loading, initialized } = useAuthStore()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (initialized && !loading) {
      if (!profile || profile.role !== 'admin') {
        toast.error('Acesso não autorizado');
        navigate({ to: '/' })
      }
    }
  }, [profile, loading, initialized, navigate])

  if (loading || !initialized) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return null
  }

  return <AdminPanel />
}
