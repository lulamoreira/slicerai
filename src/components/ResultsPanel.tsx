import React, { useState, useRef } from "react";
import { useAppStore, useSettingsStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  CheckSquare, 
  Copy, 
  Check,
  RotateCcw,
  Download,
  Share,
  Monitor,
  Camera,
  ThumbsUp,
  Image as ImageIcon,
  History,
  X,
  FileText,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { SummaryTab } from "./results/tabs/SummaryTab";
import { SettingsTab } from "./results/tabs/SettingsTab";
import { ExplanationTab } from "./results/tabs/ExplanationTab";
import { ChecklistTab } from "./results/tabs/ChecklistTab";
import { downloadBambuProfile } from "../lib/bambuExport";
import { BambuSettingsModal } from "./BambuSettingsModal";
import { generateSettings } from "../lib/ai";
import { useAuthStore } from "../store/useAuthStore";

export const ResultsPanel: React.FC = () => {
  const { results, setResults, resetApp, wizard, profileVersion, profileHistory, addToProfileHistory, setProfileVersion, isFinalized, setIsFinalized, meshData } = useAppStore();
  const { profile } = useAuthStore();
  const { history: printHistory } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState(0);
  const [showBambuModal, setShowBambuModal] = useState(false);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<number | null>(null);
  const [showImproveArea, setShowImproveArea] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!results) return null;

  const tabs = [
    { id: 0, label: "Resumo Visual", icon: LayoutDashboard },
    { id: 1, label: "Configurações", icon: Settings },
    { id: 2, label: "Explicação IA", icon: MessageSquare },
    { id: 3, label: "Checklist", icon: CheckSquare },
  ];

  const handleCopyAll = (res = results) => {
    const configText = generateFullConfigText(res);
    navigator.clipboard.writeText(configText);
    toast.success("Todas as configurações copiadas!");
  };

  const handleDownload = (res = results, versionNum = profileVersion) => {
    const fileNameBase = (wizard as any).fileName ? (wizard as any).fileName.replace(/\.(stl|3mf)$/i, "") : "perfil";
    const autoProfileName = `SlicerAI_${fileNameBase}_${new Date().toISOString().slice(0,10).replace(/-/g,"")}`;
    
    downloadBambuProfile({
      printer: (wizard as any).printer || "X1 Carbon",
      nozzle: String((wizard as any).nozzle || "0.4"),
      layerHeight: res.quality.layer_height,
      wallLoops: res.strength.wall_loops,
      topLayers: res.strength.top_layers,
      bottomLayers: res.strength.bottom_layers,
      infillDensity: res.strength.infill_density,
      infillPattern: res.strength.infill_pattern,
      printSpeed: res.speed.inner_wall,
      travelSpeed: res.speed.travel || 200,
      enableSupport: res.support.needed,
      supportType: res.support.type,
      supportThreshold: res.support.threshold_angle,
      brimWidth: res.adhesion.brim_width || 0,
      supportReason: res.support.supportReason,
      nozzleTemp: res.temperature.nozzle,
      bedTemp: res.temperature.bed,
      enableIroning: res.quality.ironing,
      seamPosition: res.quality.seam_position,
      seamReason: res.quality.seamReason,
      filamentType: (wizard as any).material || "PLA",
      buildPlate: (wizard as any).buildPlate || "Textured PEI Plate",
      profileName: autoProfileName,
      version: versionNum
    });
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    const cfg = btoa(JSON.stringify({ wizard, results }));
    url.searchParams.set("cfg", cfg);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link compartilhado copiado!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImprove = async () => {
    if (!uploadingImage) return;
    
    setIsImproving(true);
    try {
      const nextVersion = profileVersion + 1;
      const improvedResults = await generateSettings(
        wizard as any, 
        profile, 
        printHistory, 
        uploadingImage, 
        profileVersion,
        results
      );
      
      setResults(improvedResults);
      setProfileVersion(nextVersion);
      addToProfileHistory({
        version: nextVersion,
        settings: improvedResults,
        results: improvedResults,
        downloadedAt: new Date().toISOString(),
        improveReason: (improvedResults as any).quality.improveReason || improvedResults.explanation.postprocessing_tips
      });
      
      setShowImproveArea(false);
      setUploadingImage(null);
      toast.success(`Versão v${nextVersion} gerada com sucesso!`);
    } catch (error: any) {
      console.error("Improvement error:", error);
      toast.error("Erro ao melhorar perfil: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsImproving(false);
    }
  };

  const renderTabContent = () => {
    const displayResults = selectedHistoryVersion 
      ? (profileHistory || []).find(h => h.version === selectedHistoryVersion)?.results || results
      : results;

    switch (activeTab) {
      case 0: return <SummaryTab results={displayResults} />;
      case 1: return <SettingsTab results={displayResults} />;
      case 2: return <ExplanationTab results={displayResults} />;
      case 3: return <ChecklistTab results={displayResults} printer={wizard.printer} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inteligência Artificial</span>
          <h2 className="text-4xl font-black text-foreground tracking-tight uppercase">
            Resultados <span className="text-primary font-light italic">SlicerAI</span> 
            <span className="ml-3 px-2 py-0.5 bg-surface-raised border border-border rounded text-xs text-muted-foreground font-mono align-middle">v{profileVersion}</span>
          </h2>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex gap-1.5 bg-surface-raised/50 p-1.5 rounded-2xl mb-10 border border-border/50 overflow-x-auto no-scrollbar shadow-inner backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary text-[#0d0d14] shadow-xl shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>


      {/* Content */}
      <div className="flex-1 min-h-0">
        {renderTabContent()}
      </div>


      {/* Refinement Area */}
      <div className="mt-8 pt-8 border-t border-border space-y-6 pb-24 md:pb-8">
        {isFinalized ? (
          <div className="p-6 bg-[#00AE42]/10 border border-[#00AE42]/30 rounded-xl text-center animate-in zoom-in-95 duration-300">
            <p className="text-[#00AE42] font-bold text-lg mb-1">Perfil finalizado na v{profileVersion} — boas impressões! 🎉</p>
            <p className="text-[#00AE42]/70 text-xs">Sua configuração ideal foi salva no histórico.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setIsFinalized(true)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3.5 bg-[#00AE42]/10 border border-[#00AE42]/30 rounded-xl text-[10px] font-bold tracking-widest text-[#00AE42] hover:bg-[#00AE42]/20 transition-all"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                ESTOU SATISFEITO
              </button>
              <button 
                onClick={() => setShowImproveArea(!showImproveArea)}
                className={cn(
                  "flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[10px] font-bold tracking-widest transition-all",
                  showImproveArea 
                    ? "bg-primary text-[#0d0d14]" 
                    : "bg-transparent border border-border-strong text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover"
                )}
              >
                <Camera className="w-3.5 h-3.5" />
                QUERO MELHORAR
              </button>
            </div>

            {showImproveArea && (
              <div className="p-6 bg-surface-raised border border-primary/30 rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Enviar print do fatiamento</p>
                    <p className="text-[11px] text-muted-foreground">
                      Faça o fatiamento no Bambu Studio com este perfil, tire um print screen do resultado e envie aqui para a IA analisar e melhorar.
                    </p>
                  </div>
                  <button onClick={() => setShowImproveArea(false)} className="text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                    uploadingImage ? "border-primary/50 bg-primary/5" : "border-border-strong hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png,image/jpeg"
                    onChange={handleImageUpload}
                  />
                  {uploadingImage ? (
                    <div className="relative group w-full max-w-[200px] aspect-video">
                      <img src={uploadingImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <p className="text-[10px] font-bold text-white uppercase">Trocar Imagem</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Clique para selecionar PNG ou JPG</p>
                    </>
                  )}
                </div>

                <button
                  disabled={!uploadingImage || isImproving}
                  onClick={handleImprove}
                  className="w-full py-4 rounded-xl bg-primary text-[#0d0d14] font-bold text-[11px] tracking-widest hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImproving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0d0d14]/30 border-t-[#0d0d14] rounded-full animate-spin" />
                      ANALISANDO...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      GERAR v{profileVersion + 1} MELHORADA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        {profileHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted uppercase tracking-[0.2em] text-[10px] font-bold">
              <History className="w-3.5 h-3.5" />
              Histórico de Versões
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(profileHistory || []).map((item) => (
                <div 
                  key={item.version}
                  className={cn(
                    "p-4 rounded-xl border transition-all space-y-3",
                    results.profile_name_suggestion === item.results.profile_name_suggestion && profileVersion === item.version
                      ? "bg-primary/5 border-primary/30"
                      : "bg-surface-raised border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-primary">v{item.version}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {new Date(item.downloadedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyAll(item.results)}
                        className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all"
                        title="Copiar configurações"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDownload(item.results, item.version)}
                        className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all"
                        title="Baixar .bbscfg"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {item.improveReason && (
                    <p className="text-[11px] text-muted-foreground italic bg-black/10 p-2 rounded-lg border border-border/50">
                      <span className="font-bold text-primary mr-1 opacity-70">Melhoria:</span>
                      {item.improveReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={resetApp}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-4 bg-surface-raised border border-border rounded-xl text-[10px] font-black tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            REFAZER
          </button>
          <button 
            onClick={() => handleDownload()}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-4 bg-surface-raised border border-border rounded-xl text-[10px] font-black tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <Download className="w-4 h-4" />
            BAIXAR
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-4 bg-surface-raised border border-border rounded-xl text-[10px] font-black tracking-widest text-foreground hover:text-primary hover:border-primary hover:bg-surface-hover transition-all"
          >
            <Share className="w-4 h-4" />
            PARTILHAR
          </button>

        </div>

        <button
          onClick={() => setShowBambuModal(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-primary text-[#0d0d14] font-black text-[11px] tracking-[0.2em] uppercase hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-primary/20 mt-6"
        >
          <Monitor className="w-5 h-5" />
          VER CONFIGURAÇÕES COMPLETAS
        </button>

        
        {showBambuModal && (
          <BambuSettingsModal 
            open={showBambuModal}
            onClose={() => setShowBambuModal(false)}
            settings={{
              printer: (wizard as any).printer || "X1 Carbon",
              nozzle: String((wizard as any).nozzle || "0.4"),
              layerHeight: results.quality.layer_height,
              wallLoops: results.strength.wall_loops,
              topLayers: results.strength.top_layers,
              bottomLayers: results.strength.bottom_layers,
              infillDensity: results.strength.infill_density,
              infillPattern: results.strength.infill_pattern,
              printSpeed: results.speed.inner_wall,
              travelSpeed: results.speed.travel || 200,
              enableSupport: results.support.needed,
              supportType: results.support.type,
              supportStyle: results.support.style,
              supportInterfacePattern: results.support.interface_pattern,
              supportThreshold: results.support.threshold_angle,
              brimWidth: results.adhesion.brim_width || 0,
              supportReason: results.support.supportReason,
              nozzleTemp: results.temperature.nozzle,
              bedTemp: results.temperature.bed,
              enableIroning: results.quality.ironing,
              seamPosition: results.quality.seam_position,
              seamReason: results.quality.seamReason,
              filamentType: (wizard as any).material || "PLA",
              buildPlate: (wizard as any).buildPlate || "Textured PEI Plate",
              profileName: `SlicerAI_${(wizard as any).fileName?.split('.')[0] || 'perfil'}`,
              version: profileVersion,
              decisions: results.decisions,
              improvements: results.improvements,
              orientation: results.orientation
            }}
          />
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-50">Sugestão de Nome de Perfil</p>
          <div className="flex items-center gap-3 p-3 bg-surface-raised border border-border rounded-xl group shadow-inner">
            <code className="flex-1 text-xs font-mono font-bold text-primary truncate pl-2">
              {results.profile_name_suggestion}_v{profileVersion}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${results.profile_name_suggestion}_v${profileVersion}`);
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
