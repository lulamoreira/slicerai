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
      { title: "SlicerAI — Otimização Inteligente para Bambu Studio" },
      { property: "og:title", content: "SlicerAI — Otimização Inteligente para Bambu Studio" },
      { name: "twitter:title", content: "SlicerAI — Otimização Inteligente para Bambu Studio" },
      { name: "description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { name: "twitter:description", content: "AI Print Optimizer generates optimized Bambu Studio slicer settings for 3D prints." },
      { property: "og:image", content: "/slicerai-icon.png" },
      { name: "twitter:image", content: "/slicerai-icon.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: 'icon', type: 'image/png', href: '/slicerai-icon.png' },
      { rel: 'apple-touch-icon', href: '/slicerai-icon.png' },
    ],

  }),
  component: RootComponent,
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

