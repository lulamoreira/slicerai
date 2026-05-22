import React from "react";
import { X, Copy, Check, Download, Layers, Zap, Gauge, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { downloadBambuProfile } from "../lib/bambuExport";

interface BambuSettingsModalProps {
  results: any;
  wizard: any;
  onClose: () => void;
}

const translations = {
  EN: {
    header: "Bambu Studio Settings",
    quality: "Quality",
    strength: "Strength",
    speed: "Speed",
    support: "Support",
    filament: "Filament",
    layerHeight: "Layer height",
    initialLayerHeight: "Initial layer height",
    seam: "Seam",
    seamPosition: "Seam position",
    wall: "Wall",
    wallLoops: "Wall loops",
    topShellLayers: "Top shell layers",
    bottomShellLayers: "Bottom shell layers",
    infill: "Infill",
    sparseInfillDensity: "Sparse infill density",
    sparseInfillPattern: "Sparse infill pattern",
    ironing: "Ironing",
    innerWallSpeed: "Inner wall speed",
    outerWallSpeed: "Outer wall speed",
    sparseInfillSpeed: "Sparse infill speed",
    topSurfaceSpeed: "Top surface speed",
    enableSupport: "Enable support",
    supportType: "Support type",
    thresholdAngle: "Threshold angle",
    temperature: "Temperature",
    nozzleTemperature: "Nozzle temperature",
    bedTemperature: "Bed temperature",
    download: "Download for Bambu Studio (.bbscfg)",
    close: "Close",
    enabled: "Enabled",
    disabled: "Disabled",
    aligned: "Aligned",
    copied: "copied!",
  },
  PT: {
    header: "Configurações para o Bambu Studio",
    quality: "Qualidade",
    strength: "Resistência",
    speed: "Velocidade",
    support: "Suporte",
    filament: "Filamento",
    layerHeight: "Altura da camada",
    initialLayerHeight: "Altura 1ª camada",
    seam: "Costura",
    seamPosition: "Posição da costura",
    wall: "Parede",
    wallLoops: "Paredes",
    topShellLayers: "Camadas top",
    bottomShellLayers: "Camadas base",
    infill: "Preenchimento",
    sparseInfillDensity: "Preenchimento",
    sparseInfillPattern: "Padrão",
    ironing: "Ironing",
    innerWallSpeed: "Parede interna",
    outerWallSpeed: "Parede externa",
    sparseInfillSpeed: "Preenchimento",
    topSurfaceSpeed: "Superfície top",
    enableSupport: "Suporte",
    supportType: "Tipo",
    thresholdAngle: "Ângulo limite",
    temperature: "Temperatura",
    nozzleTemperature: "Temperatura bocal",
    bedTemperature: "Temperatura mesa",
    download: "Baixar para Bambu Studio (.bbscfg)",
    close: "Fechar",
    enabled: "Ativado",
    disabled: "Desativado",
    aligned: "Alinhada",
    copied: "copiado!",
  }
};

const SettingRow = ({ label, value, lang }: { label: string; value: string | number; lang: "EN" | "PT" }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value.toString());
    setCopied(true);
    toast.success(`${label} ${translations[lang].copied}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEnabled = value === translations[lang].enabled;
  const isDisabled = value === translations[lang].disabled;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 group">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isEnabled || isDisabled ? (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            isEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
          )}>
            {value}
          </span>
        ) : (
          <span className="text-sm font-bold text-foreground">{value}</span>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded-md hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export const BambuSettingsModal: React.FC<BambuSettingsModalProps> = ({ results, wizard, onClose }) => {
  const [lang, setLang] = React.useState<"EN" | "PT">("PT");
  const [activeTab, setActiveTab] = React.useState<string>("Quality");
  const t = translations[lang];

  if (!results) return null;

  const suggestedName = results.profile_name_suggestion || (wizard as any).fileName || 'perfil';
  const profileName = `SlicerAI - ${suggestedName}`;

  const tabs = [
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
                <SettingRow label={t.layerHeight} value={`${results.layerHeight || results.quality?.layer_height || 0.20} mm`} lang={lang} />
                <SettingRow label={t.initialLayerHeight} value={`${results.layerHeight || results.quality?.layer_height || 0.20} mm`} lang={lang} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.seam}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <SettingRow label={t.seamPosition} value={t.aligned} lang={lang} />
              </div>
            </div>
          </div>
        );
      case "Strength":
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> {t.wall}
              </h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <SettingRow label={t.wallLoops} value={results.wallLoops || results.strength?.wall_loops || 3} lang={lang} />
                <SettingRow label={t.topShellLayers} value={results.topLayers || results.strength?.top_layers || 4} lang={lang} />
                <SettingRow label={t.bottomShellLayers} value={results.bottomLayers || results.strength?.bottom_layers || 4} lang={lang} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.infill}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <SettingRow label={t.sparseInfillDensity} value={`${results.infillPercent || results.strength?.infill_density || 15} %`} lang={lang} />
                <SettingRow label={t.sparseInfillPattern} value={results.infillPattern || results.strength?.infill_pattern || "Gyroid"} lang={lang} />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">{t.ironing}</h4>
              <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
                <SettingRow label={t.ironing} value={(results.ironing || results.quality?.ironing) ? t.enabled : t.disabled} lang={lang} />
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
                <SettingRow label={t.innerWallSpeed} value={`${baseSpeed} mm/s`} lang={lang} />
                <SettingRow label={t.outerWallSpeed} value={`${Math.round(baseSpeed * 0.6)} mm/s`} lang={lang} />
                <SettingRow label={t.sparseInfillSpeed} value={`${baseSpeed} mm/s`} lang={lang} />
                <SettingRow label={t.topSurfaceSpeed} value={`${Math.round(baseSpeed * 0.5)} mm/s`} lang={lang} />
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
                <SettingRow label={t.enableSupport} value={hasSupport ? t.enabled : t.disabled} lang={lang} />
                <SettingRow label={t.supportType} value={results.supportType || results.support?.type || "normal(auto)"} lang={lang} />
                <SettingRow label={t.thresholdAngle} value={`${results.supportAngle || results.support?.threshold_angle || 30} °`} lang={lang} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border bg-surface-raised/30 flex items-center justify-between">
          <div className="flex flex-col">
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
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border bg-surface-raised/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-[11px] font-bold transition-all relative",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary mx-4" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {getActiveTabContent()}

          <div className="space-y-1 pt-2">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
               {t.temperature}
            </h4>
            <div className="bg-surface-raised/50 rounded-xl p-3 border border-border/50">
              <SettingRow label={t.nozzleTemperature} value={`${results.nozzleTemp || results.temperature?.nozzle || 220} °C`} lang={lang} />
              <SettingRow label={t.bedTemperature} value={`${results.bedTemp || results.temperature?.bed || 65} °C`} lang={lang} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface-raised/30 flex flex-col gap-3">
          <button
            onClick={() => {
              const suggestedName = results.profile_name_suggestion || (wizard as any).fileName || 'perfil';
              const profileName = `SlicerAI - ${suggestedName}`;
              
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
                enableSupport: (results.supportType && results.supportType !== "none" && results.supportType !== "Sem suporte") || results.support?.needed,
                supportType: results.supportType || results.support?.type || "normal(auto)",
                supportThreshold: results.supportAngle || results.support?.threshold_angle || 30,
                brimWidth: 0,
                nozzleTemp: results.nozzleTemp || results.temperature?.nozzle || 220,
                bedTemp: results.bedTemp || results.temperature?.bed || 65,
                enableIroning: !!(results.ironing || results.quality?.ironing),
                filamentType: (wizard as any).filament || "PLA",
                profileName: profileName,
              });
            }}
            className="w-full py-4 bg-[#00aeef] hover:bg-[#0099d4] text-white rounded-xl text-[11px] font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t.download.toUpperCase()}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            {t.close.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};
