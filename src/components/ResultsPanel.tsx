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
  Wand2
} from "lucide-react";
import { toast } from "sonner";

export const ResultsPanel: React.FC = () => {
  const { results, resetApp, wizard } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!results) return null;

  const tabs = [
    { id: 0, label: "Resumo", icon: LayoutDashboard },
    { id: 1, label: "Configurações", icon: Settings },
    { id: 2, label: "Explicação", icon: MessageSquare },
    { id: 3, label: "Checklist", icon: CheckSquare },
  ];

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copiado!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultCard 
              icon={Layers} 
              label="Qualidade" 
              value={`${results.quality.layer_height}mm`} 
              sub={`${results.quality.seam_position} seam`}
            />
            <ResultCard 
              icon={Shield} 
              label="Resistência" 
              value={`${results.strength.infill_density}%`} 
              sub={results.strength.infill_pattern}
            />
            <ResultCard 
              icon={Thermometer} 
              label="Temperaturas" 
              value={`${results.temperature.nozzle}°C / ${results.temperature.bed}°C`} 
              sub={`Câmara: ${results.temperature.chamber}°C`}
            />
            <ResultCard 
              icon={Gauge} 
              label="Velocidade" 
              value={`${results.speed.infill}mm/s`} 
              sub={`1ª camada: ${results.speed.first_layer}mm/s`}
            />
            <ResultCard 
              icon={Clock} 
              label="Estimativas" 
              value={`${results.estimates.print_time_minutes} min`} 
              sub={`${results.estimates.filament_grams}g (${results.estimates.filament_meters}m)`}
              full
            />
          </div>
        );
      case 1:
        const configText = `[Quality]
layer_height=${results.quality.layer_height}
first_layer_height=${results.quality.first_layer_height}
seam_position=${results.quality.seam_position}
ironing=${results.quality.ironing}
ironing_flow=${results.quality.ironing_flow}
ironing_speed=${results.quality.ironing_speed}

[Strength]
infill_density=${results.strength.infill_density}
infill_pattern=${results.strength.infill_pattern}
wall_loops=${results.strength.wall_loops}
top_layers=${results.strength.top_layers}
bottom_layers=${results.strength.bottom_layers}

[Support]
needed=${results.support.needed}
type=${results.support.type}
threshold_angle=${results.support.threshold_angle}

[Temperature]
nozzle=${results.temperature.nozzle}
bed=${results.temperature.bed}
chamber=${results.temperature.chamber}

[Speed]
mode=${results.speed.mode}
outer_wall=${results.speed.outer_wall}
inner_wall=${results.speed.inner_wall}
infill=${results.speed.infill}
travel=${results.speed.travel}

[Advanced]
elephant_foot_compensation=${results.advanced.elephant_foot_compensation}
enable_overhang_speed=${results.advanced.enable_overhang_speed}
bridge_flow=${results.advanced.bridge_flow}`;

        return (
          <div className="space-y-4 animate-in fade-in duration-500 font-mono">
            <div className="bg-[#0d0d14] p-6 rounded-2xl border border-white/5 text-[11px] overflow-x-auto whitespace-pre leading-relaxed text-muted-foreground custom-scrollbar max-h-[400px]">
              {configText}
            </div>
            <button
              onClick={() => copyToClipboard(configText, "all")}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white text-[12px] font-black tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-lg"
            >
              {copiedSection === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              COPIAR TODAS AS CONFIGURAÇÕES
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {Object.entries(results.explanation).filter(([k]) => typeof results.explanation[k as keyof typeof results.explanation] === 'string').map(([key, value]) => (
              <div key={key} className="p-5 bg-surface-raised border border-white/5 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{value as string}</p>
              </div>
            ))}
            {results.explanation.warnings.length > 0 && (
              <div className="p-5 bg-destructive/5 border border-destructive/10 rounded-2xl">
                <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Avisos da IA
                </p>
                <ul className="space-y-2">
                  {results.explanation.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-destructive font-black">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 3:
        const baseChecklist = [
          "Limpar mesa com Álcool Isopropílico",
          "Verificar se o filamento está seco",
          "Limpar bico (cold pull se necessário)",
          ...(wizard.printer.startsWith("X1") ? ["Calibração de Lidar ativada", "Calibração de Flow ativada"] : [])
        ];
        const fullChecklist = [...baseChecklist, ...results.explanation.pre_print_checklist_extra];
        return (
          <div className="space-y-3 animate-in fade-in duration-500">
            {fullChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-surface-raised border border-white/5 rounded-2xl group hover:border-primary/20 transition-all cursor-pointer">
                <div className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Check className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100" />
                </div>
                <span className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors">{item}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Resultados <span className="text-primary">SlicerAI</span></h2>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              const cfg = btoa(JSON.stringify({ wizard, results }));
              url.searchParams.set("cfg", cfg);
              navigator.clipboard.writeText(url.toString());
              toast.success("Link compartilhado copiado!");
            }}
            className="p-3 bg-surface-raised border border-white/5 rounded-xl hover:text-primary transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={resetApp}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black tracking-widest text-muted hover:text-white transition-all hover:bg-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            NOVO PROJETO
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-raised p-1.5 rounded-2xl mb-8 border border-white/5 overflow-x-auto no-scrollbar shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary text-white shadow-lg" 
                : "text-muted hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {renderTabContent()}
      </div>

      {/* Profile Name Suggestion */}
      <div className="mt-8 pt-8 border-t border-white/5">
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">Sugestão de Nome de Perfil</p>
        <div className="flex items-center gap-3 p-3 bg-surface-raised border border-white/5 rounded-2xl group shadow-inner">
          <code className="flex-1 text-xs font-mono font-bold text-primary truncate pl-2">
            {results.profile_name_suggestion}
          </code>
          <button 
            onClick={() => copyToClipboard(results.profile_name_suggestion, "profile")}
            className="p-2.5 hover:bg-primary/10 text-muted group-hover:text-primary rounded-xl transition-all active:scale-90"
          >
            {copiedSection === "profile" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ icon: Icon, label, value, sub, full }: any) => (
  <div className={cn(
    "p-5 bg-surface-raised border border-white/5 rounded-2xl flex flex-col gap-1 transition-all hover:border-primary/20 group",
    full ? "col-span-2" : ""
  )}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
      <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-lg font-black tracking-tight text-white">{value}</p>
    <p className="text-[10px] text-muted font-bold">{sub}</p>
  </div>
);

const Layers = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a2 2 0 0 0 0 3.66l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a2 2 0 0 0 0-3.66Z"/><path d="m2.6 13.73 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/><path d="m2.6 17.73 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/></svg>
);
