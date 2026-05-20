import React from "react";
import { X, Copy, Check, Monitor, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { downloadBambuProfile } from "../lib/bambuExport";

interface BambuSettingsModalProps {
  results: any;
  wizard: any;
  onClose: () => void;
}

const SettingRow = ({ label, value }: { label: string; value: string | number }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value.toString());
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 group">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-primary">{value}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-primary-subtle text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export const BambuSettingsModal: React.FC<BambuSettingsModalProps> = ({ results, wizard, onClose }) => {
  if (!results) return null;

  const sections = [
    {
      title: "PROCESSO",
      tab: "Process",
      settings: [
        { label: "Altura da camada", value: `${results.quality?.layer_height || 0.2} mm` },
        { label: "Paredes", value: results.strength?.wall_loops || 3 },
        { label: "Preenchimento", value: `${results.strength?.infill_density || 15} %` },
        { label: "Padrão de preenchimento", value: results.strength?.infill_pattern || "Gyroid" },
        { label: "Suporte", value: results.support?.needed ? "Sim" : "Não" },
        { label: "Tipo de suporte", value: results.support?.type || "N/A" },
        { label: "Ironing", value: results.quality?.ironing ? "Sim" : "Não" },
        { label: "Camadas superiores", value: results.strength?.top_layers || 4 },
        { label: "Camadas inferiores", value: results.strength?.bottom_layers || 4 },
      ]
    },
    {
      title: "FILAMENTO",
      tab: "Filament",
      settings: [
        { label: "Temperatura bocal", value: `${results.temperature?.nozzle || 220} °C` },
        { label: "Temperatura mesa", value: `${results.temperature?.bed || 65} °C` },
      ]
    },
    {
      title: "VELOCIDADE",
      tab: "Process → Speed",
      settings: [
        { label: "Parede interna", value: `${results.speed?.inner_wall || 150} mm/s` },
        { label: "Parede externa", value: `${Math.round((results.speed?.inner_wall || 150) * 0.6)} mm/s` },
        { label: "Preenchimento", value: `${results.speed?.infill || 150} mm/s` },
      ]
    }
  ];

  const suggestedName = results.profile_name_suggestion || (wizard as any).fileName || 'perfil';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">Configurações para o Bambu Studio</h3>
            <p className="text-xs text-muted-foreground mt-1">Perfil sugerido: <span className="text-primary font-mono">{suggestedName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">{section.title}</h4>
                <span className="text-[10px] text-muted-foreground/50 font-medium px-2 py-0.5 bg-surface-raised border border-border rounded-full">
                  Tab: {section.tab}
                </span>
              </div>
              <div className="bg-surface-raised rounded-xl border border-border p-4 space-y-1">
                {section.settings.map((setting) => (
                  <SettingRow key={setting.label} label={setting.label} value={setting.value} />
                ))}
              </div>
            </div>
          ))}

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-[11px] text-center text-muted-foreground">
              No Bambu Studio: <span className="text-foreground font-bold">crie um novo perfil de processo baseado no padrão, e aplique estes valores.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface-raised flex items-center justify-between">
          <button
            onClick={() => downloadBambuProfile(results, wizard, suggestedName)}
            className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            BAIXAR JSON (AVANÇADO)
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-[#0d0d14] rounded-lg text-xs font-bold hover:bg-primary-hover transition-all"
          >
            ENTENDI
          </button>
        </div>
      </div>
    </div>
  );
};
