import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileArchive } from "lucide-react";
import { downloadBambuProfile, BambuSettings } from "@/lib/bambuExport";
import { downloadThreeMfProject, MeshData } from "@/lib/threeMfExport";
import { detectModelType } from "@/lib/supportProfiles";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";




interface Props {
  open: boolean;
  onClose: () => void;
  settings: BambuSettings & { 
    decisions?: any;
    improvements?: Record<string, string>;
    orientation?: {
      rotation: string;
      reason: string;
      supportReduction: string;
    };
  };
}

type Tab = "Quality" | "Strength" | "Speed" | "Support" | "Analysis";
type Lang = "EN" | "PT";

const LABELS: Record<Lang, Record<string, string>> = {
  EN: {
    quality: "Quality", strength: "Strength", speed: "Speed", support: "Support", analysis: "Analysis",
    layerHeight: "Layer height", initialLayer: "Initial layer height",
    topLayers: "Top shell layers", bottomLayers: "Bottom shell layers",
    wallLoops: "Wall loops", infillDensity: "Sparse infill density",
    infillPattern: "Sparse infill pattern", ironing: "Enable ironing",
    printSpeed: "Inner wall speed", outerWallSpeed: "Outer wall speed",
    travelSpeed: "Travel speed", infillSpeed: "Sparse infill speed",
    topSpeed: "Top surface speed", initSpeed: "Initial layer speed",
    enableSupport: "Enable support", supportType: "Support type",
    supportStyle: "Support style", supportInterface: "Interface pattern",
    supportAngle: "Support threshold angle", brimWidth: "Brim width",
    nozzleTemp: "Nozzle temperature", bedTemp: "Bed temperature",
    filament: "Filament type", printer: "Printer", nozzle: "Nozzle diameter",
    howToImport: "How to import: File → Import → Import Configs",
    copyAll: "Copy all", copied: "Copied!",
    seamPosition: "Seam position",
    strategyTitle: "Print Strategy",
    improvementsTitle: "Improvements in this version:",
  },
  PT: {
    quality: "Qualidade", strength: "Resistência", speed: "Velocidade", support: "Suporte", analysis: "Análise",
    layerHeight: "Altura da camada", initialLayer: "Altura camada inicial",
    topLayers: "Camadas superiores", bottomLayers: "Camadas inferiores",
    wallLoops: "Paredes", infillDensity: "Densidade do preenchimento",
    infillPattern: "Padrão do preenchimento", ironing: "Ativar ironing",
    printSpeed: "Velocidade parede interna", outerWallSpeed: "Velocidade parede externa",
    travelSpeed: "Velocidade de deslocamento", infillSpeed: "Velocidade preenchimento",
    topSpeed: "Velocidade superfície topo", initSpeed: "Velocidade camada inicial",
    enableSupport: "Ativar suporte", supportType: "Tipo de suporte",
    supportStyle: "Estilo do suporte", supportInterface: "Padrão da interface",
    supportAngle: "Ângulo do suporte", brimWidth: "Largura do brim",
    nozzleTemp: "Temperatura do bico", bedTemp: "Temperatura da mesa",
    filament: "Tipo de filamento", printer: "Impressora", nozzle: "Diâmetro do bico",
    howToImport: "Como importar: Arquivo → Importar → Importar Configurações",
    copyAll: "Copiar tudo", copied: "Copiado!",
    seamPosition: "Posição da costura",
    strategyTitle: "Estratégia de Impressão",
    improvementsTitle: "O que melhorei nesta versão:",
  },
};

function DecisionNote({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="text-xs text-gray-400 italic mb-2 mt-0.5 flex items-start gap-1.5 px-1 opacity-100">
      <span className="shrink-0 mt-0.5">💡</span>
      <span>{text}</span>
    </p>
  );

}

function Row({ label, value, onCopy, decision }: { label: string; value: string; onCopy: () => void; decision?: string }) {
  return (
    <div className="py-2 border-b border-gray-700">
      <div className="flex items-center justify-between group">
        <span className="text-sm text-gray-200 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-white">{value}</span>
          <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
      <DecisionNote text={decision} />
    </div>
  );

}

export function BambuSettingsModal({ open, onClose, settings }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Quality");
  const [lang, setLang] = useState<Lang>("PT");
  const meshData = useAppStore(s => s.meshData);
  const results = useAppStore(s => s.results);
  const t = LABELS[lang];


  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success(t.copied);
  };

  const copyAll = () => {
    const all = [
      `${t.printer}: ${settings.printer}`,
      `${t.nozzle}: ${settings.nozzle}mm`,
      `${t.filament}: ${settings.filamentType}`,
      `${t.layerHeight}: ${settings.layerHeight}mm`,
      `${t.wallLoops}: ${settings.wallLoops}`,
      `${t.topLayers}: ${settings.topLayers}`,
      `${t.bottomLayers}: ${settings.bottomLayers}`,
      `${t.infillDensity}: ${settings.infillDensity}%`,
      `${t.infillPattern}: ${settings.infillPattern}`,
      `${t.ironing}: ${settings.enableIroning ? "On" : "Off"}`,
      `${t.printSpeed}: ${settings.printSpeed}mm/s`,
      `${t.travelSpeed}: ${settings.travelSpeed}mm/s`,
      `${t.enableSupport}: ${settings.enableSupport ? "On" : "Off"}`,
      `${t.supportType}: ${settings.supportType}`,
      `${t.nozzleTemp}: ${settings.nozzleTemp}°C`,
      `${t.bedTemp}: ${settings.bedTemp}°C`,
    ].join("\n");
    navigator.clipboard.writeText(all);
    toast.success(t.copied);
  };

  const tabs: Tab[] = ["Quality", "Strength", "Speed", "Support", "Analysis"];
  const tabLabel: Record<Tab, string> = {
    Quality: t.quality, Strength: t.strength, Speed: t.speed, Support: t.support, Analysis: t.analysis,
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-full md:h-auto max-w-lg md:max-h-[90vh] flex flex-col p-0 gap-0 bg-[#1c1c1e] text-white border-white/10 rounded-none md:rounded-[2.5rem]">
        <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-white">Process — SlicerAI</DialogTitle>
            <div className="flex items-center gap-1 bg-white/5 rounded p-0.5 border border-white/10">
              {(["EN", "PT"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-0.5 rounded text-[10px] font-bold transition-all ${lang === l ? "bg-green-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-gray-700 text-white border-gray-600 px-2 py-0.5">{settings.printer}</Badge>
            <Badge variant="outline" className="text-xs bg-gray-700 text-white border-gray-600 px-2 py-0.5">⌀ {settings.nozzle}mm</Badge>
            <Badge variant="outline" className="text-xs bg-gray-700 text-white border-gray-600 px-2 py-0.5">{settings.filamentType}</Badge>
          </div>
          <div className="flex mt-3 border-b border-gray-700 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px whitespace-nowrap group ${activeTab === tab ? "border-green-400 text-white" : "border-transparent"}`}>
                <div className="flex items-center gap-1.5">
                  <span className={activeTab === tab ? "text-white" : "text-gray-500 group-hover:text-gray-200"}>{tabLabel[tab]}</span>
                  {tab === "Support" && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] px-1 py-0 h-3.5 uppercase tracking-tighter">
                      📐 {lang === "PT" ? "Geometria" : "Geometry"}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {activeTab === "Quality" && (
            <div>
              <Row label={t.layerHeight} value={`${settings.layerHeight} mm`} onCopy={() => copy(String(settings.layerHeight))} decision={settings.decisions?.layerHeight} />
              <Row label={t.initialLayer} value={`${Math.max(settings.layerHeight, 0.2)} mm`} onCopy={() => copy(String(Math.max(settings.layerHeight, 0.2)))} />
              <Row label={t.topLayers} value={String(settings.topLayers)} onCopy={() => copy(String(settings.topLayers))} />
              <Row label={t.bottomLayers} value={String(settings.bottomLayers)} onCopy={() => copy(String(settings.bottomLayers))} />
              <Row label={t.ironing} value={settings.enableIroning ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableIroning ? "1" : "0")} decision={settings.decisions?.ironing} />
              <Row label={t.seamPosition} value={settings.seamPosition || "aligned"} onCopy={() => copy(settings.seamPosition || "aligned")} decision={settings.decisions?.seam} />
              {settings.seamReason && (
                <p className="text-[11px] text-gray-400 italic mb-2 -mt-1 px-1">
                  {settings.seamReason}
                </p>
              )}

            </div>
          )}
          {activeTab === "Strength" && (
            <div>
              <Row label={t.wallLoops} value={String(settings.wallLoops)} onCopy={() => copy(String(settings.wallLoops))} decision={settings.decisions?.wallLoops} />
              <Row label={t.infillDensity} value={`${settings.infillDensity}%`} onCopy={() => copy(`${settings.infillDensity}%`)} decision={settings.decisions?.infillDensity} />
              <Row label={t.infillPattern} value={settings.infillPattern || "grid"} onCopy={() => copy(settings.infillPattern || "grid")} decision={settings.decisions?.infillPattern} />
              <Row label={t.brimWidth} value={`${settings.brimWidth ?? 0} mm`} onCopy={() => copy(String(settings.brimWidth ?? 0))} />
            </div>
          )}
          {activeTab === "Speed" && (
            <div>
              <Row label={t.printSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} decision={settings.decisions?.printSpeed} />
              <Row label={t.outerWallSpeed} value={`${Math.round(settings.printSpeed * 0.6)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.6)))} />
              <Row label={t.infillSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} />
              <Row label={t.topSpeed} value={`${Math.round(settings.printSpeed * 0.5)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.5)))} />
              <Row label={t.travelSpeed} value={`${settings.travelSpeed} mm/s`} onCopy={() => copy(String(settings.travelSpeed))} />
              <Row label={t.initSpeed} value="30 mm/s" onCopy={() => copy("30")} />
            </div>
          )}
          {activeTab === "Support" && (
            <div>
              {settings.geometryStats && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">
                    {lang === "PT" ? "Análise Geométrica" : "Geometric Analysis"}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {detectModelType({
                      width: settings.geometryStats.boundingBox.x,
                      depth: settings.geometryStats.boundingBox.y,
                      height: settings.geometryStats.boundingBox.z,
                      volume: settings.geometryStats.volume,
                      triangleCount: settings.geometryStats.triangleCount
                    }) === "organic" 
                        ? (lang === "PT" ? "Modelo orgânico — Tree Organic" : "Organic Model — Tree Organic")
                        : (lang === "PT" ? "Modelo técnico — Normal Grid" : "Technical Model — Normal Grid")}
                    </p>
                  </div>
                )}

              <Row label={t.enableSupport} value={settings.enableSupport ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableSupport ? "1" : "0")} decision={settings.decisions?.support} />

              {settings.supportReason && (
                <p className="text-[11px] text-gray-400 italic mb-2 -mt-1 px-1">
                  {settings.supportReason}
                </p>
              )}

              {settings.enableSupport && (
                <>
                  <Row label={t.supportType} value={settings.supportType || "normal(auto)"} onCopy={() => copy(settings.supportType || "normal(auto)")} />
                  <Row label={t.supportStyle} value={settings.supportStyle || "snug"} onCopy={() => copy(settings.supportStyle || "snug")} />
                  <Row label={t.supportInterface} value={settings.supportInterfacePattern || "concentric"} onCopy={() => copy(settings.supportInterfacePattern || "concentric")} />
                  <Row label={t.supportAngle} value={`${settings.supportThreshold ?? 45}°`} onCopy={() => copy(String(settings.supportThreshold ?? 45))} />
                </>
              )}
            </div>
          )}
          {activeTab === "Analysis" && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {t.strategyTitle}
                </h3>
                <p className="text-sm leading-relaxed text-gray-200 bg-white/5 p-4 rounded-xl border border-border/10 italic">
                  "{settings.decisions?.overall || "A IA está processando a melhor estratégia para este modelo..."}"
                </p>
              </div>

              {settings.improvements && Object.keys(settings.improvements).length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <h3 className="text-sm font-bold text-green-500 flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {t.improvementsTitle}
                  </h3>
                  <div className="grid gap-2">
                    {Object.entries(settings.improvements).map(([field, reason]) => (
                      <div key={field} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <p className="text-xs font-bold text-green-500 uppercase mb-1">{field}</p>

                        <p className="text-xs text-gray-200">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="mt-4 pt-3 border-t border-gray-700 px-4">
          <p className="text-[10px] text-gray-300 mb-2 uppercase tracking-[0.2em] font-bold">🧵 FILAMENTO</p>
          <Row label={t.filament} value={settings.filamentType} onCopy={() => copy(settings.filamentType)} />
          <Row label={t.nozzleTemp} value={`${settings.nozzleTemp}°C`} onCopy={() => copy(String(settings.nozzleTemp))} decision={settings.decisions?.temperatures} />
          <Row label={t.bedTemp} value={`${settings.bedTemp}°C`} onCopy={() => copy(String(settings.bedTemp))} />
          
          <div className="mt-4 bg-amber-950/40 border border-amber-600/50 rounded-lg p-3 space-y-2">
            <p className="text-[11px] leading-relaxed text-gray-200 font-medium">
              <span className="mr-1">⚠️</span>
              Este perfil exporta 2 arquivos no mesmo .bbscfg: o perfil de impressão e o perfil de filamento. Para aplicar no Bambu Studio:
            </p>
            <ol className="text-[10px] space-y-1 text-gray-300 list-decimal list-inside">
              <li>Clique em Arquivo → Importar → Importar Configurações e selecione o arquivo .bbscfg baixado.</li>
              <li>No painel esquerdo, clique no dropdown de Processo e em 'Predefinições do usuário' selecione <span className="text-white font-semibold">[{settings.profileName || "SlicerAI_Profile"}]</span>.</li>
              <li>No mesmo painel, clique no dropdown de Filamento e em 'Predefinições do usuário' selecione <span className="text-white font-semibold">[{settings.profileName || "SlicerAI_Profile"}]_filament</span>.</li>
              <li>As temperaturas e configurações estarão aplicadas automaticamente.</li>
            </ol>
          </div>
        </div>

        <div className="px-4 py-3 bg-blue-950/30 border-y border-blue-500/30 my-4">
          <p className="text-[10px] text-blue-400 mb-2 uppercase tracking-[0.2em] font-bold flex items-center justify-between">
            <span>📐 ORIENTAÇÃO RECOMENDADA</span>
            {settings.orientation?.supportReduction && (
              <Badge className="bg-green-500 text-white border-none text-[9px] px-1.5 py-0 h-4 font-black">
                ⬇️ {settings.orientation.supportReduction} de suportes
              </Badge>
            )}
          </p>
          <p className="text-white font-semibold text-sm">{settings.orientation?.rotation || "Orientação padrão detectada"}</p>
          <p className="text-gray-300 text-sm mt-1 leading-relaxed">
            {settings.orientation?.reason || "A geometria base sugere que esta é a melhor posição para garantir estabilidade e acabamento."}
          </p>
        </div>

        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-gray-700 flex flex-col gap-2 bg-[#1c1c1e]">
          <p className="text-[10px] text-gray-400 text-center font-medium italic mb-1">{t.howToImport}</p>
          <div className="flex flex-col gap-2">
            <Button size="lg" disabled={!meshData}
              onClick={() => meshData && downloadThreeMfProject(meshData, settings, settings.profileName || "SlicerAI_Project", results?.orientation)}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-sm">
              <FileArchive className="w-5 h-5" />
              {lang === "PT" ? "📦 BAIXAR PROJETO .3MF (PRONTO PARA IMPRIMIR)" : "📦 DOWNLOAD .3MF PROJECT (READY TO PRINT)"}
            </Button>
            {!meshData && <p className="text-xs text-amber-400 text-center mt-1">⚠️ Recarregue o modelo 3D para ativar o download .3mf</p>}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll} className="flex-1 text-xs gap-1 border-gray-600 text-gray-300 hover:bg-gray-800 text-xs">
                <Copy className="w-3 h-3" /> {t.copyAll}
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadBambuProfile(settings)}
                className="flex-1 text-xs gap-1 border-gray-600 text-gray-300 hover:bg-gray-800 text-xs">
                <Download className="w-3 h-3" /> {lang === "PT" ? "Baixar só configurações (.bbscfg)" : "Settings only (.bbscfg)"}
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
