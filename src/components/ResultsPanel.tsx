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
  Wand2,
  FileArchive,
  Eye
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type === "image/png" || f.type === "image/jpeg" || f.type === "image/webp" || /\.(png|jpe?g|webp)$/i.test(f.name));
    if (imageFile) {
      handleImageSelected(imageFile);
    } else {
      toast.error("Apenas arquivos PNG ou JPG são aceitos");
    }
  };

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!showImproveArea) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleImageSelected(file);
            toast.success("Imagem colada com sucesso");
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showImproveArea]);

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

  const translateField = (field: string): string => {
    const translations: Record<string, string> = {
      layer_height: "Altura de camada",
      layerHeight: "Altura de camada",
      wall_loops: "Paredes",
      wallLoops: "Paredes",
      infill_density: "Preenchimento",
      infillDensity: "Preenchimento",
      printSpeed: "Velocidade",
      print_speed: "Velocidade",
      nozzleTemp: "Temperatura do bico",
      nozzle_temp: "Temperatura do bico",
      bedTemp: "Temperatura da mesa",
      bed_temp: "Temperatura da mesa",
      supportType: "Tipo de suporte",
      support_type: "Tipo de suporte",
      supportThreshold: "Ângulo de suporte",
      support_threshold: "Ângulo de suporte",
      ironing: "Alisamento (Ironing)",
      infill_pattern: "Padrão de preenchimento",
      infillPattern: "Padrão de preenchimento",
      top_layers: "Camadas superiores",
      bottom_layers: "Camadas inferiores",
    };
    return translations[field] || field;
  };

  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload3mfVersion = async (version: any) => {
    setIsDownloading(true);
    try {
      // Import dynamicly to avoid circular or heavy initial load
      const { downloadThreeMfProject } = await import("../lib/threeMfExport");
      const res = version.results;
      const fileNameBase = (wizard as any).fileName ? (wizard as any).fileName.replace(/\.(stl|3mf)$/i, "") : "perfil";
      const fileName = `SlicerAI_${fileNameBase}_v${version.version}.3mf`;
      
      const config = {
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
        nozzleTemp: res.temperature.nozzle,
        bedTemp: res.temperature.bed,
        filamentType: (wizard as any).material || "PLA",
        enableIroning: res.quality.ironing,
      };


      const currentMeshData = version.meshData || meshData;
      if (!currentMeshData) {
        toast.error("Dados do modelo não encontrados para gerar .3mf");
        return;
      }

      await downloadThreeMfProject(currentMeshData as any, config, fileName.replace(".3mf", ""));
      toast.success(".3mf gerado com sucesso!");
    } catch (error) {

      console.error("3MF generation error:", error);
      toast.error("Erro ao gerar arquivo .3mf");
    } finally {
      setIsDownloading(false);
    }
  };

  const openSettingsModal = (settings: any) => {
    // Logic to open modal with specific settings
    // Since BambuSettingsModal usually uses the current store results, 
    // we might need to temporarily set results or pass them to modal
    setResults(settings);
    setShowBambuModal(true);
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
        aiAnalysis: (improvedResults as any).aiAnalysis,
        improvements: (improvedResults as any).improvements,
        summary: (improvedResults as any).explanation?.postprocessing_tips,
        meshData: meshData || undefined
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
                  <button onClick={() => { setShowImproveArea(false); setUploadingImage(null); }} className="text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                    isDragging 
                      ? "border-green-500 bg-green-500/10 scale-[1.02]" 
                      : uploadingImage 
                        ? "border-primary/50 bg-primary/5" 
                        : "border-border-strong hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelected(file);
                    }}
                  />
                  {uploadingImage ? (
                    <div className="relative group w-full max-w-[200px] aspect-video">
                      <img src={uploadingImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <p className="text-[10px] font-bold text-white uppercase">Trocar Imagem</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                        isDragging ? "bg-green-500/20" : "bg-primary/10"
                      )}>
                        <ImageIcon className={cn("w-7 h-7", isDragging ? "text-green-400" : "text-primary")} />
                      </div>
                      <div>
                        <p className="font-bold text-[10px] uppercase tracking-widest text-primary">
                          {isDragging 
                            ? "✨ Solte a imagem aqui" 
                            : "ARRASTE A IMAGEM AQUI OU CLIQUE PARA SELECIONAR"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">
                          PNG ou JPG • Você também pode colar com Ctrl+V
                        </p>
                      </div>
                    </div>
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
            <div className="grid grid-cols-1 gap-4">
              {(profileHistory || []).map((version) => (
                <div key={version.version} className="bg-gray-900/50 border border-gray-700 rounded-xl p-5 mb-3">
                  {/* Header da versão */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500 flex items-center justify-center">
                        <span className="text-green-400 font-bold text-sm">v{version.version}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Versão {version.version}</p>
                        <p className="text-gray-400 text-xs">{new Date(version.downloadedAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                    {version.version === profileVersion && (
                      <Badge className="bg-green-600 text-white">✨ Atual</Badge>
                    )}
                  </div>

                  {/* Análise da IA (v2+) */}
                  {version.version > 1 && version.aiAnalysis && (
                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-lg p-3 mb-3">
                      <p className="text-blue-300 text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1">
                        🔍 O que a IA identificou na imagem
                      </p>
                      <p className="text-blue-100/90 text-sm leading-relaxed">{version.aiAnalysis}</p>
                    </div>
                  )}

                  {/* Melhorias aplicadas (v2+) */}
                  {version.version > 1 && version.improvements && Object.keys(version.improvements).length > 0 && (
                    <div className="bg-green-950/40 border border-green-500/30 rounded-lg p-3 mb-3">
                      <p className="text-green-300 text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1">
                        🎯 O que foi melhorado nesta versão
                      </p>
                      <ul className="space-y-1.5">
                        {Object.entries(version.improvements).map(([field, reason]) => (
                          <li key={field} className="text-sm">
                            <span className="text-green-400 font-semibold">{translateField(field)}:</span>
                            <span className="text-gray-200 ml-2">{reason as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resumo melhoria (v1 ou fallback) */}
                  {version.summary && (
                    <div className="bg-gray-800/60 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">📝 Resumo</p>
                      <p className="text-gray-200 text-sm">{version.summary}</p>
                    </div>
                  )}

                  {/* Botões de download — .3mf em destaque */}
                  <div className="space-y-2 mt-3">
                    <Button
                      size="default"
                      onClick={() => handleDownload3mfVersion(version)}
                      disabled={isDownloading}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-bold h-11"
                    >
                      <FileArchive className="w-4 h-4" />
                      📦 BAIXAR .3MF v{version.version} (PRONTO PARA IMPRIMIR)
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleDownload(version.results, version.version)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs h-9"
                      >
                        <Download className="w-3 h-3 mr-1" /> .bbscfg
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => openSettingsModal(version.results)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs h-9"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Ver configurações
                      </Button>
                    </div>
                  </div>
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
            <RotateCcw className="w-3.5 h-3.5" />
            RECOMEÇAR
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
              profileName: `SlicerAI_${(wizard as any).fileName ? (wizard as any).fileName.replace(/\.(stl|3mf)$/i, "") : "perfil"}_${new Date().toISOString().slice(0,10).replace(/-/g,"")}`,
              version: profileVersion,
              decisions: results.decisions,
              improvements: results.improvements,
              orientation: results.orientation
            }}
          />
        )}

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
