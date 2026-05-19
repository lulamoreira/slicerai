import React, { useState } from "react";
import { useStore } from "../lib/store";
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
  Share2
} from "lucide-react";
import { toast } from "sonner";

export const ResultsPanel: React.FC = () => {
  const { currentResults, resetWizard, wizard } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!currentResults) return null;

  const tabs = [
    { id: 0, label: "Resumo Visual", icon: LayoutDashboard },
    { id: 1, label: "Configurações", icon: Settings },
    { id: 2, label: "Explicação IA", icon: MessageSquare },
    { id: 3, label: "Checklist", icon: CheckSquare },
  ];

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Resumo Visual
        return (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SummaryCard 
              icon={Layers} 
              label="Qualidade" 
              value={`${currentResults.quality.layer_height}mm`} 
              sub={`${currentResults.quality.seam_position} seam`}
            />
            <SummaryCard 
              icon={Shield} 
              label="Resistência" 
              value={`${currentResults.strength.infill_percent}%`} 
              sub={currentResults.strength.infill_pattern}
            />
            <SummaryCard 
              icon={Thermometer} 
              label="Temperaturas" 
              value={`${currentResults.temperatures.nozzle}°C / ${currentResults.temperatures.bed}°C`} 
              sub={`Câmara: ${currentResults.temperatures.chamber}°C`}
            />
            <SummaryCard 
              icon={Gauge} 
              label="Velocidade" 
              value={`${currentResults.speed.print}mm/s`} 
              sub={`1ª camada: ${currentResults.speed.first_layer}mm/s`}
            />
            <SummaryCard 
              icon={Clock} 
              label="Estimativas" 
              value={currentResults.estimates.time} 
              sub={`${currentResults.estimates.filament_g}g (${currentResults.estimates.filament_m}m)`}
              full
            />
          </div>
        );
      case 1: // Configurações
        const configText = `[Quality]
layer_height=${currentResults.quality.layer_height}
first_layer_height=${currentResults.quality.first_layer_height}
seam_position=${currentResults.quality.seam_position}
ironing=${currentResults.quality.ironing}

[Strength]
infill_percent=${currentResults.strength.infill_percent}
infill_pattern=${currentResults.strength.infill_pattern}
wall_loops=${currentResults.strength.wall_loops}

[Support]
enabled=${currentResults.support.enabled}
type=${currentResults.support.type}
threshold_angle=${currentResults.support.threshold_angle}

[Temperatures]
nozzle=${currentResults.temperatures.nozzle}
bed=${currentResults.temperatures.bed}
chamber=${currentResults.temperatures.chamber}
`;
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-[#0d0d14] p-4 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
              {configText}
            </div>
            <button
              onClick={() => copyToClipboard(configText, "all")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-glow transition-all"
            >
              {copiedSection === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copiar Tudo
            </button>
          </div>
        );
      case 2: // Explicação
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {Object.entries(currentResults.explanation.topics).map(([key, value]) => (
              <div key={key} className="p-4 bg-surface-raised border border-white/10 rounded-xl">
                <p className="text-xs font-bold text-primary uppercase mb-1">{key}</p>
                <p className="text-sm leading-relaxed">{value}</p>
              </div>
            ))}
            {currentResults.explanation.warnings.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs font-bold text-destructive uppercase mb-2">Avisos</p>
                <ul className="list-disc list-inside space-y-1">
                  {currentResults.explanation.warnings.map((w, i) => (
                    <li key={i} className="text-sm">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 3: // Checklist
        const baseChecklist = [
          "Limpar mesa com Álcool Isopropílico",
          "Verificar se o filamento está seco",
          "Limpar bico (cold pull se necessário)",
          ...(wizard.printer.startsWith("X1") ? ["Calibração de Lidar ativada", "Calibração de Flow ativada"] : [])
        ];
        const fullChecklist = [...baseChecklist, ...currentResults.explanation.pre_print_checklist_extra];
        return (
          <div className="space-y-3 animate-in fade-in duration-500">
            {fullChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-surface-raised border border-white/10 rounded-xl group hover:border-primary/30 transition-colors">
                <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center group-hover:border-primary transition-colors">
                  <Check className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-medium">{item}</span>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black italic tracking-tighter text-primary">SlicerAI Results</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              const cfg = btoa(JSON.stringify({ wizard, results: currentResults }));
              url.searchParams.set("cfg", cfg);
              navigator.clipboard.writeText(url.toString());
              toast.success("Link compartilhado copiado!");
            }}
            className="p-2 bg-surface border border-white/10 rounded-lg hover:text-primary transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={resetWizard}
            className="text-xs font-bold text-muted-foreground hover:text-white px-3 py-2 bg-white/5 rounded-lg transition-colors"
          >
            NOVO PROJETO
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface p-1 rounded-xl mb-6 border border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-surface-raised text-primary shadow-sm" 
                : "text-muted-foreground hover:text-white"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {renderTabContent()}
      </div>

      {/* Sugestão de Perfil */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sugestão de nome de perfil</p>
        <div className="flex items-center gap-2 p-2 bg-surface-raised border border-white/10 rounded-lg group">
          <code className="flex-1 text-xs font-mono text-primary truncate">
            {currentResults.profile_name_suggestion}
          </code>
          <button 
            onClick={() => copyToClipboard(currentResults.profile_name_suggestion, "profile")}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            {copiedSection === "profile" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, sub, full }: any) => (
  <div className={cn(
    "p-4 bg-surface-raised border border-white/10 rounded-2xl flex flex-col gap-1",
    full ? "col-span-2" : ""
  )}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-black tracking-tight leading-none">{value}</p>
    <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
  </div>
);

const Layers = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a2 2 0 0 0 0 3.66l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a2 2 0 0 0 0-3.66Z"/><path d="m2.6 13.73 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/><path d="m2.6 17.73 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09"/></svg>
);
