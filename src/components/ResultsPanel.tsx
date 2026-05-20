import React, { useState } from "react";
import { useAppStore, useSettingsStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  CheckSquare, 
  Copy, 
  Check,
  Zap,
  Shield,
  Clock,
  Thermometer,
  Gauge,
  Share2,
  AlertTriangle,
  RotateCcw,
  Wind,
  Droplets,
  Wand2,
  Layers,
  Palette,
  Download,
  Share
} from "lucide-react";
import { toast } from "sonner";
import { SummaryTab } from "./results/tabs/SummaryTab";
import { SettingsTab } from "./results/tabs/SettingsTab";
import { ExplanationTab } from "./results/tabs/ExplanationTab";
import { ChecklistTab } from "./results/tabs/ChecklistTab";
import { downloadBambuProfile } from "../lib/bambuExport";

export const ResultsPanel: React.FC = () => {
  const { results, resetApp, wizard } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!results) return null;

  const tabs = [
    { id: 0, label: "Resumo Visual", icon: LayoutDashboard },
    { id: 1, label: "Configurações", icon: Settings },
    { id: 2, label: "Explicação IA", icon: MessageSquare },
    { id: 3, label: "Checklist", icon: CheckSquare },
  ];

  const handleCopyAll = () => {
    const configText = generateFullConfigText(results);
    navigator.clipboard.writeText(configText);
    setCopiedAll(true);
    toast.success("Todas as configurações copiadas!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    const configText = generateFullConfigText(results);
    const blob = new Blob([configText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SlicerAI_${results.profile_name_suggestion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    const cfg = btoa(JSON.stringify({ wizard, results }));
    url.searchParams.set("cfg", cfg);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link compartilhado copiado!");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <SummaryTab results={results} />;
      case 1: return <SettingsTab results={results} />;
      case 2: return <ExplanationTab results={results} />;
      case 3: return <ChecklistTab results={results} printer={wizard.printer} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground uppercase">Resultados <span className="text-primary">SlicerAI</span></h2>
        <button 
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-4 py-2 bg-primary-subtle border border-primary/20 rounded-lg text-[10px] font-bold tracking-widest text-primary hover:bg-primary/20 transition-all"
        >
          {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          COPIAR TUDO
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-raised p-1.5 rounded-xl mb-8 border border-border overflow-x-auto no-scrollbar shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-lg text-[10px] font-bold tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary text-[#0d0d14] shadow-lg shadow-primary/20" 
                : "text-muted hover:text-primary hover:bg-primary-subtle"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {renderTabContent()}
      </div>

      {/* Bottom Bar */}
      <div className="mt-8 pt-8 border-t border-border space-y-6">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={resetApp}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-transparent border border-border-strong rounded-xl text-[10px] font-bold tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            REFAZER
          </button>
          <button 
            onClick={handleDownload}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-transparent border border-border-strong rounded-xl text-[10px] font-bold tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            BAIXAR .TXT
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-transparent border border-border-strong rounded-xl text-[10px] font-bold tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <Share className="w-3.5 h-3.5" />
            COMPARTILHAR
          </button>
        </div>

        <button
          onClick={() => downloadBambuProfile(results, wizard, (results as any).suggestedName || results.profile_name_suggestion || (wizard as any).fileName || 'perfil')}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-[#0d0d14] font-bold text-[11px] tracking-widest hover:bg-primary-hover transition-all shadow-lg mt-4"
        >
          <Download className="w-4 h-4" />
          BAIXAR PARA BAMBU STUDIO (.json)
        </button>
        <p className="text-center text-[10px] text-muted mt-2">No Bambu Studio: <span className="font-bold text-foreground">Arquivo → Importar → Importar Configurações</span> → selecione o arquivo baixado</p>


        {/* Profile Name Suggestion */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-50">Sugestão de Nome de Perfil</p>
          <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-xl group shadow-inner">
            <code className="flex-1 text-xs font-mono font-bold text-primary truncate pl-2">
              {results.profile_name_suggestion}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(results.profile_name_suggestion);
                toast.success("Nome do perfil copiado!");
              }}
              className="p-2.5 hover:bg-primary-subtle text-muted group-hover:text-primary rounded-lg transition-all active:scale-90"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateFullConfigText(results: any) {
  return `[Quality]
layer_height = ${results.quality.layer_height}
initial_layer_height = ${results.quality.first_layer_height}
seam_position = ${results.quality.seam_position}
ironing = ${results.quality.ironing}
ironing_flow = ${results.quality.ironing_flow}%
ironing_speed = ${results.quality.ironing_speed} mm/s

[Strength]
wall_loops = ${results.strength.wall_loops}
top_layers = ${results.strength.top_layers}
bottom_layers = ${results.strength.bottom_layers}
infill_density = ${results.strength.infill_density}%
infill_pattern = ${results.strength.infill_pattern}
top_surface_pattern = ${results.strength.top_surface_pattern}
bottom_surface_pattern = ${results.strength.bottom_surface_pattern}

[Support]
enable_support = ${results.support.needed}
support_type = ${results.support.type}
threshold_angle = ${results.support.threshold_angle}
top_z_distance = ${results.support.top_z_distance} mm
bottom_z_distance = ${results.support.bottom_z_distance} mm
xy_distance = ${results.support.xy_distance} mm
interface_layers = ${results.support.interface_layers}
interface_pattern = ${results.support.interface_pattern}
tree_support_angle = ${results.support.tree_support_angle}
on_build_plate_only = ${results.support.on_build_plate_only}

[Temperature]
nozzle_temperature = ${results.temperature.nozzle} °C
nozzle_temperature_initial_layer = ${results.temperature.nozzle_first_layer} °C
hot_plate_temp = ${results.temperature.bed} °C
hot_plate_temp_initial_layer = ${results.temperature.bed_first_layer} °C
chamber_temperature = ${results.temperature.chamber} °C
part_cooling_fan_speed = ${results.temperature.part_cooling_fan}%

[Speed]
outer_wall_speed = ${results.speed.outer_wall} mm/s
inner_wall_speed = ${results.speed.inner_wall} mm/s
top_surface_speed = ${results.speed.top_surface} mm/s
bottom_surface_speed = ${results.speed.bottom_surface} mm/s
sparse_infill_speed = ${results.speed.infill} mm/s
travel_speed = ${results.speed.travel} mm/s
initial_layer_speed = ${results.speed.first_layer} mm/s
bridge_speed = ${results.speed.bridge} mm/s
overhang_slowdown = ${results.speed.overhang_slow} mm/s

[AMS]
wipe_tower_enabled = ${results.ams.wipe_tower_enabled}
wipe_tower_width = ${results.ams.wipe_tower_width} mm
flush_multiplier = ${results.ams.flush_multiplier}
flush_into_infill = ${results.ams.flush_into_infill}
flush_into_objects = ${results.ams.flush_into_objects}

[Adhesion]
brim_type = ${results.adhesion.brim_type}
brim_width = ${results.adhesion.brim_width} mm
skirt_loops = ${results.adhesion.skirt_loops}

[Advanced]
elephant_foot_compensation = ${results.advanced.elephant_foot_compensation} mm
enable_overhang_speed = ${results.advanced.enable_overhang_speed}
bridge_flow = ${results.advanced.bridge_flow}
precise_outer_wall = ${results.advanced.precise_outer_wall}
thick_bridges = ${results.advanced.thick_bridges}
small_perimeter_speed = ${results.advanced.small_perimeter_speed} mm/s`;
}
