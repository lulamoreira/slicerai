import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ModelViewer } from '../components/viewer/ModelViewer'
import { Dropzone } from '../components/Dropzone'
import { Wizard } from '../components/Wizard'
import { ResultsPanel } from '../components/ResultsPanel'
import { Navbar } from '../components/Navbar'
import { StatsCard } from '../components/StatsCard'
import { useAppStore, useSettingsStore } from '../store/useAppStore'
import { useTranslation } from '../lib/i18n'
import { 
  Info,
  X,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Box,
  Link as LinkIcon
} from 'lucide-react'
import { Toaster } from 'sonner'

const toasterProps = {
  position: 'top-center' as const,
  duration: 2500,
  toastOptions: {
    classNames: {
      success: '!bg-[var(--surface-raised)] !border-l-3 !border-l-[var(--success)] !text-[var(--foreground)]',
      error: '!bg-[var(--surface-raised)] !border-l-3 !border-l-[var(--destructive)] !text-[var(--foreground)]',
      warning: '!bg-[var(--surface-raised)] !border-l-3 !border-l-[var(--warning)] !text-[var(--foreground)]',
    },
  },
}
import { cn } from '../lib/utils'
import { SettingsDialog } from '../components/layout/SettingsDialog'
import { HistorySidebar } from '../components/layout/HistorySidebar'

export const Route = createFileRoute('/')({
  component: HomeComponent,
  ssr: false,
})

function HomeComponent() {
  const { 
    status, 
    wizard, 
    results, 
    updateWizard, 
    geometry,
  } = useAppStore()
  
  const { language, theme, apiKey } = useSettingsStore()
  
  const [showSettings, setShowSettings] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [sharedBanner, setSharedBanner] = React.useState(false)

  // Apply theme
  React.useEffect(() => {
    // Remove all possible theme classes
    document.documentElement.classList.remove('dark', 'light', 'theme-contrast', 'theme-rainbow');
    
    // Add active theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else if (theme === 'contrast') {
      document.documentElement.classList.add('theme-contrast')
    } else if (theme === 'rainbow') {
      document.documentElement.classList.add('theme-rainbow')
    }
  }, [theme])


  // Allow children to open Settings via a custom event
  React.useEffect(() => {
    const open = () => setShowSettings(true)
    window.addEventListener('slicerai:open-settings', open)
    return () => window.removeEventListener('slicerai:open-settings', open)
  }, [])

  // Rehydrate from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cfg = params.get('cfg')
    if (!cfg) return
    try {
      const decoded = JSON.parse(atob(cfg))
      if (!decoded || typeof decoded !== 'object' || !decoded.wizard || !decoded.results) return
      useAppStore.setState({ 
        wizard: decoded.wizard, 
        results: decoded.results,
        status: 'result'
      })
      setSharedBanner(true)
      setTimeout(() => setSharedBanner(false), 5000)
    } catch {
      // Silently ignore malformed cfg
    }
  }, [])

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Toaster {...toasterProps} theme={theme === 'contrast' || theme === 'rainbow' ? 'dark' : theme} />

        <Navbar onShowSettings={() => setShowSettings(true)} onShowHistory={() => setShowHistory(true)} />
        <main className="flex-1 flex items-center justify-center p-6">
          <Dropzone />
        </main>
        {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
        {showHistory && (
            <div className="fixed inset-0 z-[110] flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHistory(false)}>
                <div className="w-full max-w-md h-full" onClick={e => e.stopPropagation()}>
                    <HistorySidebar onClose={() => setShowHistory(false)} />
                </div>
            </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <Toaster {...toasterProps} theme={theme === 'contrast' || theme === 'rainbow' ? 'dark' : theme} />
      <Navbar onShowSettings={() => setShowSettings(true)} onShowHistory={() => setShowHistory(true)} />

      {sharedBanner && (
          <div className="bg-primary px-6 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 relative z-50">
              <LinkIcon className="w-4 h-4 text-[#0d0d14]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0d0d14]">📎 Configurações carregadas de link compartilhado</span>
          </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row h-full md:h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden">
        {/* Left Panel: Preview */}
        <div className="w-full md:w-[40%] h-[300px] sm:h-[400px] md:h-auto p-4 md:p-6 flex flex-col gap-4 bg-[var(--background)] relative border-b md:border-b-0 md:border-r border-border shrink-0">

          <div className="flex-1 relative min-h-[160px]">
            <ModelViewer />

            {/* Orientation Advisor Banner */}
            {orientationAdvice.suggested && !orientationAdvice.dismissed && (
              <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500 z-20">

                <div className="p-3 md:p-4 bg-[var(--primary-subtle)] backdrop-blur-md border border-[var(--primary-glow)] rounded-xl flex items-center justify-between shadow-2xl gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-[11px] md:text-sm font-bold text-foreground">💡 Orientação</p>
                      <p className="text-[9px] md:text-xs text-foreground-soft leading-tight">Rotar 90° X pode otimizar suportes.</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        updateWizard({ shouldRotate90X: true })
                        setOrientationAdvice({ dismissed: true })
                      }}
                      className="px-3 md:px-4 py-1.5 bg-primary text-[#0d0d14] text-[9px] md:text-[10px] font-bold tracking-widest rounded-lg hover:bg-primary-hover transition-colors shadow-lg"
                    >
                      SIM
                    </button>
                    <button 
                      onClick={() => setOrientationAdvice({ dismissed: true })}
                      className="px-3 md:px-4 py-1.5 bg-surface-raised text-foreground text-[9px] md:text-[10px] font-bold tracking-widest rounded-lg hover:bg-surface-hover transition-colors border border-border"
                    >
                      NÃO
                    </button>

                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extended Stats Card */}
          <div className="animate-in slide-in-from-bottom-4 duration-500 mb-20 md:mb-0">
            <StatsCard />
          </div>

        </div>

        {/* Right Panel: Wizard / Results */}
        <div className="w-full md:w-[60%] flex flex-col bg-surface overflow-hidden">
          {status === 'result'
            ? <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10"><ResultsPanel /></div>
            : <Wizard />
          }
        </div>
      </main>

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showHistory && (
          <div className="fixed inset-0 z-[110] flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHistory(false)}>
              <div className="w-full max-w-md h-full" onClick={e => e.stopPropagation()}>
                  <HistorySidebar onClose={() => setShowHistory(false)} />
              </div>
          </div>
      )}
    </div>
  )
}
