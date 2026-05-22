import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Copy, Download, Layers, Shield, Zap, Gauge, X } from "lucide-react";
import { downloadBambuProfile, BambuSettings } from "../lib/bambuExport";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface BambuSettingsModalProps {
  results: any;
  wizard: any;
  onClose: () => void;
}

type Tab = "Quality" | "Strength" | "Speed" | "Support";
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
    download: "Download for Bambu Studio (.bbscfg)",
    close: "Close",
    enabled: "Enabled",
    disabled: "Disabled",
    seam: "Seam",
    seamPosition: "Seam position",
    aligned: "Aligned",
    temperature: "Temperature",
    nozzleTemperature: "Nozzle temperature",
    bedTemperature: "Bed temperature",
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
    download: "Baixar para Bambu Studio (.bbscfg)",
    close: "Fechar",
    enabled: "Ativado",
    disabled: "Desativado",
    seam: "Costura",
    seamPosition: "Posição da costura",
    aligned: "Alinhada",
    temperature: "Temperatura",
    nozzleTemperature: "Temperatura bocal",
    bedTemperature: "Temperatura mesa",
  },
};

function Row({ label, value, onCopy, isStatus = false }: { label: string; value: string | number; onCopy: () => void; isStatus?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 group">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isStatus ? (
          <Badge variant={value === "Ativado" || value === "Enabled" ? "default" : "secondary"} className="text-[10px] uppercase">
            {value}
          </Badge>
        ) : (
          <span className="text-sm font-mono font-medium">{value}</span>
        )}
        <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export const BambuSettingsModal = ({ results, wizard, onClose }: BambuSettingsModalProps) => {
  const [lang, setLang] = useState<Lang>("PT");
  const [activeTab, setActiveTab] = useState<Tab>("Quality");
  const t = LABELS[lang];

  const handleCopy = (label: string, value: string | number) => {
    navigator.clipboard.writeText(value.toString());
    toast.success(`${label} ${t.copied}`);
  };

  const suggestedName = results.profile_name_suggestion || (wizard as any).fileName || 'perfil';
  const profileName = `SlicerAI - ${suggestedName}`;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "Quality", label: t.quality, icon: Layers },
    { id: "Strength", label: t.strength, icon: Shield },
    { id: "Speed", label: t.speed, icon: Zap },
    { id: "Support", label: t.support, icon: Gauge },
  ];

  const getActiveTabContent = () => {
    switch (activeTab) {
      case "Quality":
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> {t.layerHeight}
              </h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.layerHeight} value={`${results.layerHeight || results.quality?.layer_height || 0.20} mm`} onCopy={() => handleCopy(t.layerHeight, `${results.layerHeight || results.quality?.layer_height || 0.20} mm`)} />
                <Row label={t.initialLayer} value={`${results.layerHeight || results.quality?.layer_height || 0.20} mm`} onCopy={() => handleCopy(t.initialLayer, `${results.layerHeight || results.quality?.layer_height || 0.20} mm`)} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.seam}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.seamPosition} value={t.aligned} onCopy={() => handleCopy(t.seamPosition, t.aligned)} />
              </div>
            </div>
          </div>
        );
      case "Strength":
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> {t.wallLoops}
              </h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.wallLoops} value={results.wallLoops || results.strength?.wall_loops || 3} onCopy={() => handleCopy(t.wallLoops, results.wallLoops || results.strength?.wall_loops || 3)} />
                <Row label={t.topLayers} value={results.topLayers || results.strength?.top_layers || 4} onCopy={() => handleCopy(t.topLayers, results.topLayers || results.strength?.top_layers || 4)} />
                <Row label={t.bottomLayers} value={results.bottomLayers || results.strength?.bottom_layers || 4} onCopy={() => handleCopy(t.bottomLayers, results.bottomLayers || results.strength?.bottom_layers || 4)} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.infillDensity}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.infillDensity} value={`${results.infillPercent || results.strength?.infill_density || 15} %`} onCopy={() => handleCopy(t.infillDensity, `${results.infillPercent || results.strength?.infill_density || 15} %`)} />
                <Row label={t.infillPattern} value={results.infillPattern || results.strength?.infill_pattern || "Gyroid"} onCopy={() => handleCopy(t.infillPattern, results.infillPattern || results.strength?.infill_pattern || "Gyroid")} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.ironing}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.ironing} value={(results.ironing || results.quality?.ironing) ? t.enabled : t.disabled} isStatus onCopy={() => handleCopy(t.ironing, (results.ironing || results.quality?.ironing) ? t.enabled : t.disabled)} />
              </div>
            </div>
          </div>
        );
      case "Speed":
        const baseSpeed = results.printSpeed || results.speed?.inner_wall || 150;
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> {t.speed}
              </h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.printSpeed} value={`${baseSpeed} mm/s`} onCopy={() => handleCopy(t.printSpeed, `${baseSpeed} mm/s`)} />
                <Row label={t.outerWallSpeed} value={`${Math.round(baseSpeed * 0.6)} mm/s`} onCopy={() => handleCopy(t.outerWallSpeed, `${Math.round(baseSpeed * 0.6)} mm/s`)} />
                <Row label={t.infillSpeed} value={`${baseSpeed} mm/s`} onCopy={() => handleCopy(t.infillSpeed, `${baseSpeed} mm/s`)} />
                <Row label={t.topSpeed} value={`${Math.round(baseSpeed * 0.5)} mm/s`} onCopy={() => handleCopy(t.topSpeed, `${Math.round(baseSpeed * 0.5)} mm/s`)} />
              </div>
            </div>
          </div>
        );
      case "Support":
        const hasSupport = (results.supportType && results.supportType !== "none" && results.supportType !== "Sem suporte") || results.support?.needed;
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> {t.support}
              </h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <Row label={t.enableSupport} value={hasSupport ? t.enabled : t.disabled} isStatus onCopy={() => handleCopy(t.enableSupport, hasSupport ? t.enabled : t.disabled)} />
                <Row label={t.supportType} value={results.supportType || results.support?.type || "normal(auto)"} onCopy={() => handleCopy(t.supportType, results.supportType || results.support?.type || "normal(auto)")} />
                <Row label={t.supportAngle} value={`${results.supportAngle || results.support?.threshold_angle || 30} °`} onCopy={() => handleCopy(t.supportAngle, `${results.supportAngle || results.support?.threshold_angle || 30} °`)} />
              </div>
            </div>
          </div>
        );
    }
  };

  const handleDownload = () => {
    downloadBambuProfile({
      printer: (wizard as any).printer || "X1 Carbon",
      nozzle: (wizard as any).nozzle || "0.4",
      layerHeight: results.layerHeight || results.quality?.layer_height || 0.20,
      wallLoops: results.wallLoops || results.strength?.wall_loops || 3,
      topLayers: results.topLayers || results.strength?.top_layers || 4,
      bottomLayers: results.bottomLayers || results.strength?.bottom_layers || 4,
      infillDensity: results.infillPercent || results.strength?.infill_density || 15,
      infillPattern: results.infillPattern || results.strength?.infill_pattern || "Gyroid",
      printSpeed: results.printSpeed || results.speed?.inner_wall || 150,
      travelSpeed: 200,
      enableSupport: !!((results.supportType && results.supportType !== "none" && results.supportType !== "Sem suporte") || results.support?.needed),
      supportType: results.supportType || results.support?.type || "normal(auto)",
      supportThreshold: results.supportAngle || results.support?.threshold_angle || 30,
      brimWidth: 0,
      nozzleTemp: results.nozzleTemp || results.temperature?.nozzle || 220,
      bedTemp: results.bedTemp || results.temperature?.bed || 65,
      enableIroning: !!(results.ironing || results.quality?.ironing),
      filamentType: (wizard as any).filament || "PLA",
      profileName: profileName,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 bg-surface border-border overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 border-b border-border bg-surface-raised/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Profile Selection</span>
              <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md text-sm font-bold text-foreground">
                {profileName}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-surface-raised border border-border rounded-lg p-1">
                <button
                  onClick={() => setLang("EN")}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    lang === "EN" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("PT")}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    lang === "PT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  PT-BR
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex border-b border-border bg-surface-raised/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-[11px] font-bold transition-all relative flex flex-col items-center gap-1",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-4" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {getActiveTabContent()}

          <div className="space-y-1 pt-2">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
               {t.temperature}
            </h4>
            <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
              <Row label={t.nozzleTemperature} value={`${results.nozzleTemp || results.temperature?.nozzle || 220} °C`} onCopy={() => handleCopy(t.nozzleTemperature, `${results.nozzleTemp || results.temperature?.nozzle || 220} °C`)} />
              <Row label={t.bedTemperature} value={`${results.bedTemp || results.temperature?.bed || 65} °C`} onCopy={() => handleCopy(t.bedTemperature, `${results.bedTemp || results.temperature?.bed || 65} °C`)} />
            </div>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest">
              {t.howToImport}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface-raised/30 flex flex-col gap-3">
          <Button
            onClick={handleDownload}
            className="w-full py-6 bg-[#00aeef] hover:bg-[#0099d4] text-white rounded-xl text-[11px] font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t.download.toUpperCase()}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            {t.close.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
