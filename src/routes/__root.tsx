import { createRootRouteWithContext, Outlet, ScrollRestoration, HeadContent, Scripts, useNavigate, useLocation } from '@tanstack/react-router'
import * as React from 'react'
import { useSettingsStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../integrations/supabase/client'
import { AccessStatusScreen } from '../components/AccessScreens'
import '../styles.css'

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SlicerAI — Otimização Inteligente para Bambu Studio',
      },
      { property: "og:title", content: "SlicerAI — Otimização Inteligente para Bambu Studio" },
      { name: "twitter:title", content: "SlicerAI — Otimização Inteligente para Bambu Studio" },
      { name: "description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { name: "twitter:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:image", content: "/slicerai-icon.svg" },
      { name: "twitter:image", content: "/slicerai-icon.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/slicerai-icon.svg' },
      { rel: 'apple-touch-icon', href: '/slicerai-icon.svg' },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error }) => {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full space-y-6 text-center">
          <div className="inline-flex p-4 bg-destructive/10 rounded-2xl">
            <svg className="w-12 h-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">ALGO DEU ERRADO</h1>
            <p className="text-muted-foreground italic">Ocorreu um erro inesperado no SlicerAI.</p>
          </div>
          
          <div className="bg-surface-raised border border-border rounded-xl p-4 text-left overflow-auto max-h-[400px]">
            <p className="text-destructive font-mono text-sm font-bold mb-2">{(error as any).message || 'Erro desconhecido'}</p>
            <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
              {(error as any).stack}
            </pre>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-[#0d0d14] font-bold rounded-xl hover:scale-105 active:scale-95 transition-all"
          >
            RECARREGAR APLICAÇÃO
          </button>
        </div>
      </div>
    )
  }
})

function RootComponent() {
  const theme = useSettingsStore((state) => state.theme)
  const { user, profile, loading, initialized, setSession } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  React.useEffect(() => {
    if (initialized && !loading) {
      if (!user && location.pathname !== '/login') {
        navigate({ to: '/login' })
      }
    }
  }, [user, initialized, loading, location.pathname, navigate])

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  // Auth Guard Screen Overlay
  const showStatusScreen = user && profile && profile.access_status !== 'active' && location.pathname !== '/login';

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground transition-colors duration-300">
        {loading && !initialized ? (
          <div className="fixed inset-0 bg-background flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {showStatusScreen ? <AccessStatusScreen /> : <Outlet />}
          </>
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

