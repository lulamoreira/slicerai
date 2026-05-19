import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ModelViewer } from '../components/viewer/ModelViewer'
import { Dropzone } from '../components/Dropzone'
import { Wizard } from '../components/Wizard'
import { ResultsPanel } from '../components/ResultsPanel'
import { Navbar } from '../components/Navbar'
import { StatsCard } from '../components/StatsCard'
import { useAppStore, useSettingsStore } from '../store/useAppStore'
import { translations, useTranslation } from '../lib/i18n'
import { 
  Info,
  ChevronDown,
  X
} from 'lucide-react'
import { Toaster } from 'sonner'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { 
    status, 
    wizard, 
    currentResults, 
    updateWizard, 
    geometry,
    orientationAdvice,
    setOrientationAdvice,
    resetApp
  } = useAppStore()
  
  const { language, theme, apiKey, setApiKey, costPerKg, setCostPerKg } = useSettingsStore()
  const t = useTranslation(language)
  
  const [showSettings, setShowSettings] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [uploadedFile, setUploadedFile] = React.useState<File | undefined>()

  // Rehydrate from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cfg = params.get('cfg')
    if (cfg) {
      try {
        const decoded = JSON.parse(atob(cfg))
        useAppStore.setState({ 
          wizard: decoded.wizard, 
          results: decoded.results 
        })
      } catch (e) {
        console.error('Failed to rehydrate from URL', e)
      }
    }
  }, [])

  const handleFileDrop = (file: File) => {
    // This is handled by useAppStore's logic in Dropzone/ModelViewer now
  }

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster position="top-center" theme={theme} />
        <Navbar onShowSettings={() => setShowSettings(true)} onShowHistory={() => setShowHistory(true)} />
        <main className="flex-1 flex items-center justify-center p-6">
          <Dropzone />
        </main>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <Toaster position="top-center" theme={theme} />
      <Navbar onShowSettings={() => setShowSettings(true)} onShowHistory={() => setShowHistory(true)} />

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Panel: Preview */}
        <div className="w-full md:w-[40%] p-4 md:p-6 flex flex-col gap-4 bg-[#0d0d14] relative border-r border-white/5">
          <div className="flex-1 relative min-h-[300px]">
            <ModelViewer />

            {/* Orientation Advisor Banner */}
            {orientationAdvice.suggested && !orientationAdvice.dismissed && (
              <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500 z-20">
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

          {/* Extended Stats Card */}
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <StatsCard />
          </div>
        </div>

        {/* Right Panel: Wizard / Results */}
        <div className="w-full md:w-[60%] p-6 md:p-10 bg-surface overflow-y-auto custom-scrollbar">
          {status === 'result' ? <ResultsPanel /> : <Wizard />}
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} />}
    </div>
  )
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey, costPerKg, setCostPerKg } = useSettingsStore()
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface-raised border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-black italic tracking-tighter mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-primary" />
          </div>
          Configurações
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">OpenAI API Key</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-surface border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-primary/50 transition-colors font-mono"
            />
            <p className="text-[10px] text-muted/50">Sua chave é salva apenas no seu navegador (localStorage).</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Custo por KG (R$)</label>
            <input 
              type="number"
              value={costPerKg}
              onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary text-white text-[12px] font-black tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-lg"
          >
            SALVAR E FECHAR
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const { history } = useSettingsStore()
  const { setResults, updateWizard } = useAppStore()

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm h-full bg-surface border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right-full duration-500 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black italic tracking-tighter mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <HistoryIcon className="w-4 h-4 text-primary" />
          </div>
          Histórico
        </h2>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <Box className="w-8 h-8 text-muted/30" />
              </div>
              <p className="text-muted text-xs italic">Nenhum projeto recente</p>
            </div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  useAppStore.setState({ 
                    wizard: entry.wizardState, 
                    results: entry.results,
                    status: 'result'
                  })
                  onClose()
                }}
                className="w-full p-4 bg-surface-raised border border-white/5 rounded-2xl hover:border-primary/50 transition-all text-left flex items-center gap-4 group hover:bg-white/[0.02]"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/5">
                  <Box className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{entry.fileName}</p>
                  <p className="text-[10px] text-muted font-black uppercase tracking-tighter flex items-center gap-2">
                    {entry.printer} <span className="w-1 h-1 bg-white/20 rounded-full" /> {entry.material}
                  </p>
                  <p className="text-[9px] text-muted/50 mt-1">{new Date(entry.timestamp).toLocaleDateString()}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const SettingsIconComp = (props: any) => <SettingsIcon {...props} />;
const HistoryIconComp = (props: any) => <HistoryIcon {...props} />;
const BoxIconComp = (props: any) => <Box {...props} />;
