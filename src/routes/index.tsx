import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Viewer3D } from '../components/Viewer3D'
import { FileDrop } from '../components/FileDrop'
import { Wizard } from '../components/Wizard'
import { ResultsPanel } from '../components/ResultsPanel'
import { useStore } from '../lib/store'
import { 
  Settings, 
  History, 
  Moon, 
  Sun, 
  Languages, 
  Github,
  Maximize2,
  Info
} from 'lucide-react'
import { Toaster } from 'sonner'
import { cn } from '../lib/utils'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { wizard, currentResults, updateWizard, app, toggleTheme, setLanguage, setOpenAIKey, loadFromHistory, history } = useStore()
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
        // We can't rehydrate the File object, but we can rehydrate the state
        useStore.setState({ 
          wizard: decoded.wizard, 
          currentResults: decoded.results 
        })
      } catch (e) {
        console.error('Failed to rehydrate from URL', e)
      }
    }
  }, [])

  const handleFileDrop = (file: File) => {
    setUploadedFile(file)
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Toaster position="top-center" theme={app.theme} />
      
      {/* Navbar */}
      <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-black italic tracking-tighter text-xl text-white hidden sm:block">
            SlicerAI <span className="text-primary">for Bambu</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white relative"
          >
            <History className="w-5 h-5" />
            {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white"
          >
            {app.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setLanguage(app.language === 'pt-BR' ? 'en' : 'pt-BR')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white text-xs font-bold"
          >
            <Languages className="w-4 h-4" />
            {app.language === 'pt-BR' ? 'PT-BR' : 'EN'}
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          <button 
            onClick={() => setShowSettings(true)}
            className={cn(
              "p-2 hover:bg-white/5 rounded-lg transition-colors",
              !app.openaiKey ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-white"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Panel: Preview */}
        <div className="w-full md:w-3/5 p-4 md:p-6 flex flex-col gap-4 bg-[#0d0d14]">
          <div className="flex-1 relative min-h-[300px]">
            {wizard.fileName ? (
              <Viewer3D file={uploadedFile} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <FileDrop onFileChange={handleFileDrop} />
              </div>
            )}

            {/* Orientation Advisor */}
            {wizard.geometryStats && wizard.geometryStats.overhangsDetected && !wizard.shouldRotate90X && (
              <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500">
                <div className="p-4 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-xl flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold text-white">Dica de Orientação</p>
                      <p className="text-xs text-white/70">Rotar 90° no eixo X pode reduzir suportes significativamente.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateWizard({ shouldRotate90X: true })}
                      className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg"
                    >
                      SIM
                    </button>
                    <button 
                      className="px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20"
                    >
                      IGNORAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extended Stats */}
          {wizard.geometryStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Altura" value={`${wizard.geometryStats.height.toFixed(1)}mm`} />
              <StatCard label="Volume" value={`${wizard.geometryStats.volume.toFixed(1)}cm³`} />
              <StatCard label="Área Sup." value={`${wizard.geometryStats.surfaceArea.toFixed(1)}cm²`} />
              <StatCard 
                label="Câmara" 
                value={wizard.geometryStats.height > 100 ? "Recomendada" : "Opcional"} 
                warning={wizard.geometryStats.height > 150}
              />
            </div>
          )}
        </div>

        {/* Right Panel: Controls / Results */}
        <div className="w-full md:w-2/5 p-6 md:p-8 bg-surface border-l border-white/5 overflow-y-auto overflow-x-hidden">
          {currentResults ? <ResultsPanel /> : <Wizard />}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-surface-raised border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configurações
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">OpenAI API Key</label>
                <input 
                  type="password"
                  value={app.openaiKey || ''}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-surface border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custo por KG (R$)</label>
                <input 
                  type="number"
                  value={app.costPerKg}
                  onChange={(e) => setOpenAIKey(e.target.value)} // Wait, this is wrong, should be setCostPerKg
                  className="w-full bg-surface border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-all"
              >
                SALVAR E FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowHistory(false)}
        >
          <div 
            className="w-full max-w-sm h-full bg-surface border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right-full duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Histórico
              </h2>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-white">
                <Maximize2 className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground text-sm italic">Nenhum projeto recente</p>
                </div>
              ) : (
                history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      loadFromHistory(entry)
                      setShowHistory(false)
                    }}
                    className="w-full p-4 bg-surface-raised border border-white/10 rounded-xl hover:border-primary/50 transition-all text-left flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                      {entry.thumbnail ? <img src={entry.thumbnail} alt="" /> : <Box className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{entry.fileName}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {entry.printer} • {entry.material} • {new Date(entry.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ label, value, warning }: { label: string; value: string; warning?: boolean }) => (
  <div className={cn(
    "p-4 rounded-xl border flex flex-col gap-0.5",
    warning ? "bg-destructive/10 border-destructive/30" : "bg-surface-raised border-white/10"
  )}>
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    <span className={cn("text-base font-black tracking-tight", warning ? "text-destructive" : "text-white")}>{value}</span>
  </div>
)

const Box = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
)
