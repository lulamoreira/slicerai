import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileArchive, Loader2 } from "lucide-react";
import { downloadBambuProfile, BambuSettings } from "@/lib/bambuExport";
import { downloadThreeMfProject, MeshData, shouldForceSupport } from "@/lib/threeMfExport";
import { parseStlFile } from "@/lib/stlParser";
import { ThreeMFLoader } from "three-stdlib";
import * as THREE from "three";
import { detectModelType } from "@/lib/supportProfiles";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";




interface Props {
  open: boolean;
  onClose: () => void;
  settings: BambuSettings & { 
    decisions?: any;
    improvements?: Record<string, string>;
    orientation?: {
      rotation: string;
      reason: string;
      supportReduction: string;
    };
  };
}

type Tab = "Quality" | "Strength" | "Speed" | "Support" | "Geometry" | "Analysis";
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
    <p className="text-xs text-gray-400 italic mb-1.5 mt-0.5 flex items-start gap-1.5 px-1 opacity-100">
      <span className="shrink-0 mt-0.5">💡</span>
      <span>{text}</span>
    </p>
  );

}

function Row({ label, value, onCopy, decision }: { label: string; value: string; onCopy: () => void; decision?: string }) {
  return (
    <div className="py-1.5 border-b border-gray-700">
      <div className="flex items-center justify-between group">
        <span className="text-sm text-gray-200 font-medium">{label}</span>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [isDownloadingCfg, setIsDownloadingCfg] = useState(false);
  const [cfgStatus, setCfgStatus] = useState("");
  
  const meshData = useAppStore(s => s.meshData);
  const results = useAppStore(s => s.results);
  const t = LABELS[lang];

  if (!results) return null;


  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success(t.copied);
  };

  const handleDownload3mf = async () => {
    const file = useAppStore.getState().file;
    if (!file) return;

    setIsGenerating(true);
    try {
      setGenerationStep(lang === "PT" ? "Lendo arquivo original..." : "Reading original file...");
      let mesh: MeshData;

      if (file.name.toLowerCase().endsWith('.stl')) {
        const parsed = await parseStlFile(file);
        mesh = { vertices: parsed.vertices, triangles: parsed.triangles };
      } else if (file.name.toLowerCase().endsWith('.3mf')) {
        setGenerationStep(lang === "PT" ? "Processando projeto 3MF..." : "Processing 3MF project...");
        const loader = new ThreeMFLoader();
        const buffer = await file.arrayBuffer();
        const group = loader.parse(buffer);
        
        const vertices: [number, number, number][] = [];
        const triangles: [number, number, number][] = [];
        let vertexOffset = 0;

        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            const geo = m.geometry as THREE.BufferGeometry;
            m.updateWorldMatrix(true, false);
            
            const posAttr = geo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
              const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
              v.applyMatrix4(m.matrixWorld);
              vertices.push([v.x, v.y, v.z]);
            }

            const index = geo.index;
            if (index) {
              for (let i = 0; i < index.count; i += 3) {
                triangles.push([
                  index.getX(i) + vertexOffset,
                  index.getX(i + 1) + vertexOffset,
                  index.getX(i + 2) + vertexOffset
                ]);
              }
            } else {
              for (let i = 0; i < posAttr.count; i += 3) {
                triangles.push([
                  i + vertexOffset,
                  i + 1 + vertexOffset,
                  i + 2 + vertexOffset
                ]);
              }
            }
            vertexOffset += posAttr.count;
          }
        });
        mesh = { vertices, triangles };
      } else {
        throw new Error("Formato não suportado");
      }

      setGenerationStep(lang === "PT" ? "Aplicando configurações da IA..." : "Applying AI settings...");
      await new Promise(r => setTimeout(r, 100));
      setGenerationStep(lang === "PT" ? "Embutindo perfis de processo e filamento..." : "Embedding profiles...");
      await new Promise(r => setTimeout(r, 100));
      setGenerationStep(lang === "PT" ? "Compactando arquivo .3mf..." : "Compressing .3mf file...");
      
      const modelType = settings.geometryStats ? detectModelType({
        width: settings.geometryStats.boundingBox.x,
        depth: settings.geometryStats.boundingBox.y,
        height: settings.geometryStats.boundingBox.z,
        volume: settings.geometryStats.volume,
        triangleCount: settings.geometryStats.triangleCount
      }) : "organic";
      
      await downloadThreeMfProject(mesh, settings, settings.profileName || "SlicerAI_Project", results?.orientation, modelType);
      
      setGenerationStep(lang === "PT" ? "✅ Pronto! Verifique seus Downloads" : "✅ Done! Check your Downloads");
      setTimeout(() => { setIsGenerating(false); setGenerationStep(""); }, 2500);
    } catch (error: any) {
      console.error("Error generating 3MF:", error);
      setGenerationStep(`❌ ${error?.message || (lang === "PT" ? "Erro ao gerar arquivo" : "Error generating file")}`);
      setTimeout(() => { setIsGenerating(false); setGenerationStep(""); }, 4000);
    }
  };

  const handleDownloadCfg = async () => {
    setIsDownloadingCfg(true);
    setCfgStatus(lang === "PT" ? "Gerando arquivo..." : "Generating file...");
    try {
      await downloadBambuProfile(settings);
      setCfgStatus(lang === "PT" ? "✅ Pronto! Verifique seus Downloads" : "✅ Done! Check your Downloads");
      setTimeout(() => {
        setIsDownloadingCfg(false);
        setCfgStatus("");
      }, 2500);
    } catch (error) {
      setIsDownloadingCfg(false);
      setCfgStatus("");
      toast.error(lang === "PT" ? "Erro ao baixar configurações" : "Error downloading settings");
    }
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

  const tabs: Tab[] = ["Quality", "Strength", "Speed", "Support", "Geometry", "Analysis"];
  const tabLabel: Record<Tab, string> = {
    Quality: t.quality, Strength: t.strength, Speed: t.speed, Support: t.support, Geometry: lang === "PT" ? "Geometria" : "Geometry", Analysis: t.analysis,
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-full md:h-auto max-w-lg md:max-h-[90vh] flex flex-col p-0 gap-0 bg-[#1c1c1e] text-white border-white/10 rounded-none md:rounded-[2.5rem]">
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
          <div className="flex mt-3 border-b border-gray-700 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px whitespace-nowrap group ${activeTab === tab ? "border-green-400 text-white" : "border-transparent"}`}>
                <div className="flex items-center gap-1.5">
                  <span className={activeTab === tab ? "text-white" : "text-gray-500 group-hover:text-gray-200"}>{tabLabel[tab]}</span>
                  {tab === "Support" && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px] px-1 py-0 h-3.5 uppercase tracking-tighter">
                      📐 {lang === "PT" ? "Geometria" : "Geometry"}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {activeTab === "Quality" && (
            <div className="space-y-1">
              <Row label={t.layerHeight} value={`${settings.layerHeight} mm`} onCopy={() => copy(String(settings.layerHeight))} />
              <Row label={t.initialLayer} value={`${Math.max(settings.layerHeight, 0.2)} mm`} onCopy={() => copy(String(Math.max(settings.layerHeight, 0.2)))} />
              <Row label={t.topLayers} value={String(settings.topLayers)} onCopy={() => copy(String(settings.topLayers))} />
              <Row label={t.bottomLayers} value={String(settings.bottomLayers)} onCopy={() => copy(String(settings.bottomLayers))} />
              <Row label={t.ironing} value={settings.enableIroning ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableIroning ? "1" : "0")} />
              {results?.decisions?.layerHeight && (
                <p className="text-xs text-gray-400 italic mt-1 px-1">💡 {results.decisions.layerHeight}</p>
              )}
            </div>
          )}

          {activeTab === "Strength" && (
            <div className="space-y-1">
              <Row label={t.wallLoops} value={String(settings.wallLoops)} onCopy={() => copy(String(settings.wallLoops))} />
              <Row label={t.infillDensity} value={`${settings.infillDensity}%`} onCopy={() => copy(`${settings.infillDensity}%`)} />
              <Row label={t.infillPattern} value={settings.infillPattern || "grid"} onCopy={() => copy(settings.infillPattern || "grid")} />
              <Row label={t.brimWidth} value={`${settings.brimWidth ?? 0} mm`} onCopy={() => copy(String(settings.brimWidth ?? 0))} />
              {results?.decisions?.infillDensity && (
                <p className="text-xs text-gray-400 italic mt-1 px-1">💡 {results.decisions.infillDensity}</p>
              )}
            </div>
          )}

          {activeTab === "Speed" && (
            <div className="space-y-1">
              <Row label={t.printSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} />
              <Row label={t.outerWallSpeed} value={`${Math.round(settings.printSpeed * 0.6)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.6)))} />
              <Row label={t.infillSpeed} value={`${settings.printSpeed} mm/s`} onCopy={() => copy(String(settings.printSpeed))} />
              <Row label={t.topSpeed} value={`${Math.round(settings.printSpeed * 0.5)} mm/s`} onCopy={() => copy(String(Math.round(settings.printSpeed * 0.5)))} />
              <Row label={t.travelSpeed} value={`${settings.travelSpeed} mm/s`} onCopy={() => copy(String(settings.travelSpeed))} />
              {results?.decisions?.printSpeed && (
                <p className="text-xs text-gray-400 italic mt-1 px-1">💡 {results.decisions.printSpeed}</p>
              )}
            </div>
          )}

          {activeTab === "Support" && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600 text-white text-xs">📐 Calculado pela geometria</Badge>
              </div>
              <Row label={t.enableSupport} value={settings.enableSupport ? "✓ On" : "✗ Off"} onCopy={() => copy(settings.enableSupport ? "1" : "0")} />
              {settings.enableSupport && (
                <>
                  <Row label={t.supportType} value={settings.supportType || "tree(auto)"} onCopy={() => copy(settings.supportType || "tree(auto)")} />
                  <Row label="Style" value="tree_organic" onCopy={() => copy("tree_organic")} />
                  <Row label="Interface pattern" value="concentric" onCopy={() => copy("concentric")} />
                  <Row label="Interface spacing" value="0 mm" onCopy={() => copy("0")} />
                  <Row label="Wall loops" value="0" onCopy={() => copy("0")} />
                  <Row label={t.supportAngle} value={`${settings.supportThreshold ?? 30}°`} onCopy={() => copy(String(settings.supportThreshold ?? 30))} />
                </>
              )}
              {settings.supportReason && (
                <p className="text-xs text-gray-400 italic mt-2 px-1">💡 {settings.supportReason}</p>
              )}
            </div>
          )}

          {activeTab === "Geometry" && (
            <div className="space-y-1">
              <Row label="Dimensões" value={settings.geometryStats ? `${settings.geometryStats.boundingBox.x.toFixed(1)}×${settings.geometryStats.boundingBox.y.toFixed(1)}×${settings.geometryStats.boundingBox.z.toFixed(1)} mm` : "—"} onCopy={() => {}} />
              <Row label="Volume" value={settings.geometryStats ? `${(settings.geometryStats.volume / 1000).toFixed(2)} cm³` : "—"} onCopy={() => {}} />
              <Row label="Área" value={settings.geometryStats ? `${((settings.geometryStats.boundingBox.x * settings.geometryStats.boundingBox.y * 2 + settings.geometryStats.boundingBox.x * settings.geometryStats.boundingBox.z * 2 + settings.geometryStats.boundingBox.y * settings.geometryStats.boundingBox.z * 2) / 100).toFixed(2)} cm²` : "—"} onCopy={() => {}} />
              <Row label="Peso estimado" value={settings.geometryStats ? `${(settings.geometryStats.volume / 1000 * 1.25).toFixed(1)} g` : "—"} onCopy={() => {}} />
              <Row label="Triângulos" value={meshData ? `${(meshData.triangles.length / 1000).toFixed(0)}k` : "—"} onCopy={() => {}} />
              <Row label="Tipo detectado" value={detectModelType({
                width: settings.geometryStats?.boundingBox.x || 0,
                depth: settings.geometryStats?.boundingBox.y || 0,
                height: settings.geometryStats?.boundingBox.z || 0,
                volume: settings.geometryStats?.volume || 0,
                triangleCount: settings.geometryStats?.triangleCount || 0
              }) === "organic" ? "Orgânico (figura)" : "Técnico (mecânico)"} onCopy={() => {}} />
            </div>
          )}

          {activeTab === "Analysis" && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {t.strategyTitle}
                </h3>
                <p className="text-sm leading-relaxed text-gray-200 bg-white/5 p-4 rounded-xl border border-border/10 italic">
                  "{settings.decisions?.overall || "A IA está processando a melhor estratégia para este modelo..."}"
                </p>
              </div>

              {settings.improvements && Object.keys(settings.improvements).length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <h3 className="text-sm font-bold text-green-500 flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {t.improvementsTitle}
                  </h3>
                  <div className="grid gap-2">
                    {Object.entries(settings.improvements).map(([field, reason]) => (
                      <div key={field} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <p className="text-xs font-bold text-green-500 uppercase mb-1">{field}</p>
                        <p className="text-xs text-gray-200">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">🧵 Filamento</p>
            <Row label={t.filament} value={settings.filamentType} onCopy={() => copy(settings.filamentType)} />
            <Row label={t.nozzleTemp} value={`${settings.nozzleTemp}°C`} onCopy={() => copy(String(settings.nozzleTemp))} />
            <Row label={t.bedTemp} value={`${settings.bedTemp}°C`} onCopy={() => copy(String(settings.bedTemp))} />
          </div>
        </div>


        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-gray-700 flex flex-col gap-2 bg-[#1c1c1e] sticky bottom-0 z-10">
          {meshData && meshData.triangles.length > 1_000_000 && (
            <div className="bg-amber-950/50 border border-amber-500/40 rounded-lg p-3 mb-1">
              <p className="text-amber-300 text-sm font-semibold flex items-center gap-2">
                ⚠️ Modelo complexo: {(meshData.triangles.length / 1_000_000).toFixed(1)}M triângulos
              </p>
              <p className="text-amber-200/80 text-xs mt-1">
                O fatiamento no Bambu Studio será mais lento que o normal. Considere simplificar o modelo em ferramentas como Meshmixer ou Blender antes de imprimir.
              </p>
            </div>
          )}

          {meshData && results?.support?.needed === false && meshData.triangles.length > 200_000 && (
            <div className="bg-orange-950/50 border border-orange-500/40 rounded-lg p-3 mb-1">
              <p className="text-orange-300 text-sm font-semibold">
                ⚠️ Atenção: A IA não ativou suportes, mas o modelo parece complexo
              </p>
              <p className="text-orange-200/80 text-xs mt-1">
                Modelos orgânicos como figuras geralmente precisam de suporte. Se ao abrir no Bambu Studio aparecer "floating regions", volte aqui e gere novamente, ou ative suporte manualmente no Bambu.
              </p>
            </div>
          )}

          <div className="px-4 mb-2">
            {meshData && shouldForceSupport(meshData, settings.geometryStats?.boundingBox) && !settings.enableSupport && (
              <div className="bg-green-950/40 border border-green-500/40 rounded-lg p-3 mb-3">
                <p className="text-green-300 text-sm font-semibold">
                  🛡️ Suporte forçado automaticamente
                </p>
                <p className="text-green-200/80 text-xs mt-1">
                  Detectamos {(meshData.triangles.length / 1000).toFixed(0)}k triângulos e proporções de figura orgânica. O sistema ignorou a sugestão da IA e ativou suporte tree_organic otimizado para evitar floating regions.
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-400 text-center font-medium italic mb-1">{t.howToImport}</p>
          <div className="flex flex-col gap-2">
            <Button size="lg" disabled={!meshData || isGenerating}
              onClick={handleDownload3mf}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold h-14 text-sm relative overflow-hidden transition-all">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold">
                      {lang === "PT" ? "GERANDO ARQUIVO .3MF..." : "GENERATING .3MF FILE..."}
                    </span>
                    <span className="text-xs font-normal opacity-90 mt-0.5">{generationStep}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 bg-white/40 animate-pulse" style={{width: "60%"}}/>
                </>
              ) : (
                <>
                  <FileArchive className="w-5 h-5" />
                  {lang === "PT" ? "📦 BAIXAR PROJETO .3MF (PRONTO PARA IMPRIMIR)" : "📦 DOWNLOAD .3MF PROJECT (READY TO PRINT)"}
                </>
              )}
            </Button>
            {!meshData && <p className="text-xs text-amber-400 text-center mt-1">⚠️ Recarregue o modelo 3D para ativar o download .3mf</p>}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll} className="flex-1 text-xs gap-1 border-gray-600 text-gray-300 hover:bg-gray-800 h-10">
                <Copy className="w-3 h-3" /> {t.copyAll}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isDownloadingCfg}
                onClick={handleDownloadCfg}
                className={`flex-1 text-xs gap-1 border-gray-600 hover:bg-gray-800 h-10 transition-all ${isDownloadingCfg ? "text-green-400 border-green-900 bg-green-950/20" : "text-gray-300"}`}
              >
                {isDownloadingCfg ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="truncate">{cfgStatus}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" /> 
                    {lang === "PT" ? "Baixar só configurações (.bbscfg)" : "Settings only (.bbscfg)"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
