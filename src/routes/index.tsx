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
      success: '!bg-[#4caf7d] !border-[#4caf7d] !text-white',
      error: '!bg-[#ff4d6d] !border-[#ff4d6d] !text-white',
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
    orientationAdvice,
    setOrientationAdvice,
  } = useAppStore()
  
  const { language, theme, apiKey } = useSettingsStore()
  
  const [showSettings, setShowSettings] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [sharedBanner, setSharedBanner] = React.useState(false)

  // Apply theme
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
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
        <Toaster {...toasterProps} theme={theme} />
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
      <Toaster {...toasterProps} theme={theme} />
      <Navbar onShowSettings={() => setShowSettings(true)} onShowHistory={() => setShowHistory(true)} />

      {sharedBanner && (
          <div className="bg-primary px-6 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 relative z-50">
              <LinkIcon className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white italic">📎 Configurações carregadas de link compartilhado</span>
          </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Panel: Preview */}
        <div className="w-full md:w-[40%] h-[240px] md:h-auto p-4 md:p-6 flex flex-col gap-4 bg-[#0d0d14] relative border-r border-white/5 shrink-0">
          <div className="flex-1 relative min-h-[160px]">
            <ModelViewer />

            {/* Orientation Advisor Banner — desktop only */}
            {orientationAdvice.suggested && !orientationAdvice.dismissed && (
              <div className="hidden md:block absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500 z-20">
                <div className="p-4 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-xl flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-black text-white italic">💡 Orientação Otimizada</p>
                      <p className="text-xs text-white/70">Rotar 90° no eixo X pode eliminar suportes. Considerar?</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        updateWizard({ shouldRotate90X: true })
                        setOrientationAdvice({ dismissed: true })
                      }}
                      className="px-4 py-1.5 bg-primary text-white text-[10px] font-black tracking-widest rounded-lg hover:bg-primary-hover transition-colors shadow-lg"
                    >
                      SIM
                    </button>
                    <button 
                      onClick={() => setOrientationAdvice({ dismissed: true })}
                      className="px-4 py-1.5 bg-white/10 text-white text-[10px] font-black tracking-widest rounded-lg hover:bg-white/20 transition-colors"
                    >
                      IGNORAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extended Stats Card — desktop only */}
          <div className="hidden md:block animate-in slide-in-from-bottom-4 duration-500">
            <StatsCard />
          </div>
        </div>

        {/* Right Panel: Wizard / Results */}
        <div className="w-full md:w-[60%] p-6 md:p-10 bg-surface overflow-y-auto custom-scrollbar">
          {status === 'result' ? <ResultsPanel /> : <Wizard />}
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
