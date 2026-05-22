import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download } from "lucide-react";
import { downloadBambuProfile, BambuSettings } from "@/lib/bambuExport";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: BambuSettings & { 
    decisions?: any;
    improvements?: Record<string, string>;
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
    <div className="py-2 border-b border-border/10">
      <div className="flex items-center justify-between group">
        <span className="text-sm text-white/90 font-medium">{label}</span>
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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 bg-[#1a1a1a] text-white border-white/10">
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
          <div className="flex mt-3 border-b border-white/10 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? "border-green-400 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                {tabLabel[tab]}
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
                <p className="text-[11px] text-muted-foreground italic mb-2 -mt-1 px-1">
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
              <Row label={t.enableSupport} value={settings.enableSupport ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableSupport ? "1" : "0")} decision={settings.decisions?.support} />
              {settings.supportReason && (
                <p className="text-[11px] text-muted-foreground italic mb-2 -mt-1 px-1">
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
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t.strategyTitle}
                </h3>
                <p className="text-sm leading-relaxed text-foreground bg-white/5 p-4 rounded-xl border border-white/10 italic">
                  "{settings.decisions?.overall || "A IA está processando a melhor estratégia para este modelo..."}"
                </p>
              </div>

              {settings.improvements && Object.keys(settings.improvements).length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <h3 className="text-sm font-bold text-[#00AE42] flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00AE42]" />
                    {t.improvementsTitle}
                  </h3>
                  <div className="grid gap-2">
                    {Object.entries(settings.improvements).map(([field, reason]) => (
                      <div key={field} className="p-3 bg-[#00AE42]/5 border border-[#00AE42]/20 rounded-lg">
                        <p className="text-xs font-bold text-[#00AE42] uppercase mb-1">{field}</p>
                        <p className="text-xs text-foreground/80">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-[0.2em] font-bold">Filament</p>
            <Row label={t.filament} value={settings.filamentType} onCopy={() => copy(settings.filamentType)} />
            <Row label={t.nozzleTemp} value={`${settings.nozzleTemp}°C`} onCopy={() => copy(String(settings.nozzleTemp))} decision={settings.decisions?.temperatures} />
            <Row label={t.bedTemp} value={`${settings.bedTemp}°C`} onCopy={() => copy(String(settings.bedTemp))} />
          </div>
        </div>

        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-white/10 flex flex-col gap-2 bg-[#1a1a1a]">
          <p className="text-[10px] text-gray-400 text-center font-medium italic mb-1">{t.howToImport}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyAll} className="flex-1 text-xs gap-1 border-gray-500 text-white hover:bg-gray-700 bg-transparent">
              <Copy className="w-3 h-3" /> {t.copyAll}
            </Button>
            <Button size="sm" onClick={() => downloadBambuProfile(settings)}
              className="flex-1 text-xs gap-1 bg-[#00AE42] hover:bg-[#009938] text-white font-bold">
              <Download className="w-3 h-3" /> {lang === "PT" ? "Baixar .bbscfg" : "Download .bbscfg"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
