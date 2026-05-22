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
  settings: BambuSettings;
}

type Tab = "Quality" | "Strength" | "Speed" | "Support" | "Analysis";
type Lang = "EN" | "PT";

const LABELS: Record<Lang, Record<string, string>> = {
  EN: {
    quality: "Quality", strength: "Strength", speed: "Speed", support: "Support",
    layerHeight: "Layer height", initialLayer: "Initial layer height",
    topLayers: "Top shell layers", bottomLayers: "Bottom shell layers",
    wallLoops: "Wall loops", infillDensity: "Sparse infill density",
    infillPattern: "Sparse infill pattern", ironing: "Enable ironing",
    printSpeed: "Inner wall speed", outerWallSpeed: "Outer wall speed",
    travelSpeed: "Travel speed", infillSpeed: "Sparse infill speed",
    topSpeed: "Top surface speed", initSpeed: "Initial layer speed",
    enableSupport: "Enable support", supportType: "Support type",
    supportAngle: "Support threshold angle", brimWidth: "Brim width",
    nozzleTemp: "Nozzle temperature", bedTemp: "Bed temperature",
    filament: "Filament type", printer: "Printer", nozzle: "Nozzle diameter",
    howToImport: "How to import: File → Import → Import Configs",
    copyAll: "Copy all", copied: "Copied!",
    seamPosition: "Seam position",
  },
  PT: {
    quality: "Qualidade", strength: "Resistência", speed: "Velocidade", support: "Suporte",
    layerHeight: "Altura da camada", initialLayer: "Altura camada inicial",
    topLayers: "Camadas superiores", bottomLayers: "Camadas inferiores",
    wallLoops: "Paredes", infillDensity: "Densidade do preenchimento",
    infillPattern: "Padrão do preenchimento", ironing: "Ativar ironing",
    printSpeed: "Velocidade parede interna", outerWallSpeed: "Velocidade parede externa",
    travelSpeed: "Velocidade de deslocamento", infillSpeed: "Velocidade preenchimento",
    topSpeed: "Velocidade superfície topo", initSpeed: "Velocidade camada inicial",
    enableSupport: "Ativar suporte", supportType: "Tipo de suporte",
    supportAngle: "Ângulo do suporte", brimWidth: "Largura do brim",
    nozzleTemp: "Temperatura do bico", bedTemp: "Temperatura da mesa",
    filament: "Tipo de filamento", printer: "Impressora", nozzle: "Diâmetro do bico",
    howToImport: "Como importar: Arquivo → Importar → Importar Configurações",
    copyAll: "Copiar tudo", copied: "Copiado!",
    seamPosition: "Posição da costura",
  },
};

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 group">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-medium">{value}</span>
        <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
          <Copy className="w-3 h-3" />
        </button>
      </div>
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

  const tabs: Tab[] = ["Quality", "Strength", "Speed", "Support"];
  const tabLabel: Record<Tab, string> = {
    Quality: t.quality, Strength: t.strength, Speed: t.speed, Support: t.support,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 bg-[#1e2127] text-white border-border/50">
        <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">Process — SlicerAI</DialogTitle>
            <div className="flex items-center gap-1 bg-muted/20 rounded p-0.5">
              {(["EN", "PT"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{settings.printer}</Badge>
            <Badge variant="outline" className="text-xs">⌀ {settings.nozzle}mm</Badge>
            <Badge variant="outline" className="text-xs">{settings.filamentType}</Badge>
          </div>
          <div className="flex mt-3 border-b border-border/40">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"}`}>
                {tabLabel[tab]}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {activeTab === "Quality" && (
            <div>
              <Row label={t.layerHeight} value={`${settings.layerHeight} mm`} onCopy={() => copy(String(settings.layerHeight))} />
              <Row label={t.initialLayer} value={`${Math.max(settings.layerHeight, 0.2)} mm`} onCopy={() => copy(String(Math.max(settings.layerHeight, 0.2)))} />
              <Row label={t.topLayers} value={String(settings.topLayers)} onCopy={() => copy(String(settings.topLayers))} />
              <Row label={t.bottomLayers} value={String(settings.bottomLayers)} onCopy={() => copy(String(settings.bottomLayers))} />
              <Row label={t.ironing} value={settings.enableIroning ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableIroning ? "1" : "0")} />
              <Row label={t.seamPosition} value={settings.seamPosition || "aligned"} onCopy={() => copy(settings.seamPosition || "aligned")} />
              {settings.seamReason && (
                <p className="text-[11px] text-muted-foreground italic mb-2 -mt-1 px-1">
                  {settings.seamReason}
                </p>
              )}
            </div>
          )}
          {activeTab === "Strength" && (
            <div>
              <Row label={t.wallLoops} value={String(settings.wallLoops)} onCopy={() => copy(String(settings.wallLoops))} />
              <Row label={t.infillDensity} value={`${settings.infillDensity}%`} onCopy={() => copy(`${settings.infillDensity}%`)} />
              <Row label={t.infillPattern} value={settings.infillPattern || "grid"} onCopy={() => copy(settings.infillPattern || "grid")} />
              <Row label={t.brimWidth} value={`${settings.brimWidth ?? 0} mm`} onCopy={() => copy(String(settings.brimWidth ?? 0))} />
            </div>
          )}
          {activeTab === "Speed" && (
            <div>
              <Row label={t.printSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} />
              <Row label={t.outerWallSpeed} value={`${Math.round(settings.printSpeed * 0.6)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.6)))} />
              <Row label={t.infillSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} />
              <Row label={t.topSpeed} value={`${Math.round(settings.printSpeed * 0.5)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.5)))} />
              <Row label={t.travelSpeed} value={`${settings.travelSpeed} mm/s`} onCopy={() => copy(String(settings.travelSpeed))} />
              <Row label={t.initSpeed} value="30 mm/s" onCopy={() => copy("30")} />
            </div>
          )}
          {activeTab === "Support" && (
            <div>
              <Row label={t.enableSupport} value={settings.enableSupport ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableSupport ? "1" : "0")} />
              {settings.supportReason && (
                <p className="text-[11px] text-muted-foreground italic mb-2 -mt-1 px-1">
                  {settings.supportReason}
                </p>
              )}
              {settings.enableSupport && (
                <>
                  <Row label={t.supportType} value={settings.supportType || "normal(auto)"} onCopy={() => copy(settings.supportType || "normal(auto)")} />
                  <Row label={t.supportAngle} value={`${settings.supportThreshold ?? 45}°`} onCopy={() => copy(String(settings.supportThreshold ?? 45))} />
                </>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Filament</p>
            <Row label={t.filament} value={settings.filamentType} onCopy={() => copy(settings.filamentType)} />
            <Row label={t.nozzleTemp} value={`${settings.nozzleTemp}°C`} onCopy={() => copy(String(settings.nozzleTemp))} />
            <Row label={t.bedTemp} value={`${settings.bedTemp}°C`} onCopy={() => copy(String(settings.bedTemp))} />
          </div>
        </div>

        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-border/40 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">{t.howToImport}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyAll} className="flex-1 text-xs gap-1">
              <Copy className="w-3 h-3" /> {t.copyAll}
            </Button>
            <Button size="sm" onClick={() => downloadBambuProfile(settings)}
              className="flex-1 text-xs gap-1 bg-[#00AE42] hover:bg-[#009938] text-white">
              <Download className="w-3 h-3" /> {lang === "PT" ? "Baixar .bbscfg" : "Download .bbscfg"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
