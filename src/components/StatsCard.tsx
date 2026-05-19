import React from "react";
import { useAppStore, useSettingsStore } from "../store/useAppStore";
import { Box, Ruler, Weight, Triangle, AlertTriangle, Layers, Palette, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { MATERIAL_DENSITIES } from "../lib/geometry";

export const StatsCard: React.FC = () => {
  const { geometry, wizard } = useAppStore();
  const { costPerKg } = useSettingsStore();

  if (!geometry) return null;

  const weight = (geometry.volume * (MATERIAL_DENSITIES[wizard.material] || 1.24)).toFixed(1);
  const cost = ((parseFloat(weight) / 1000) * costPerKg).toFixed(2);

  return (
    <div className="bg-surface border border-white/5 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-primary" />
          Análise de Geometria
        </h3>
        <span className="text-[10px] font-mono text-muted/50">{wizard.fileName}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 font-mono">
        <StatItem 
          icon={Ruler} 
          label="Dimensões" 
          value={`${geometry.boundingBox.x.toFixed(1)} × ${geometry.boundingBox.y.toFixed(1)} × ${geometry.boundingBox.z.toFixed(1)} mm`} 
        />
        <StatItem 
          icon={Box} 
          label="Volume" 
          value={`${geometry.volume.toFixed(1)} cm³`} 
        />
        <StatItem 
          icon={Layers} 
          label="Área" 
          value={`${geometry.surfaceArea.toFixed(1)} cm²`} 
        />
        <StatItem 
          icon={Weight} 
          label="Peso Est." 
          value={`${weight}g (R$ ${cost})`} 
        />
      </div>

      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
        <StatusBadge 
          label="Overhangs > 45°" 
          active={geometry.overhangsDetected} 
          value={geometry.overhangsDetected ? `Sim (max ${geometry.maxOverhangAngle.toFixed(0)}°)` : "Não"}
          warning={geometry.overhangsDetected}
        />
        <StatusBadge 
          label="Bridging" 
          active={geometry.bridging} 
          value={geometry.bridging ? "Detectado" : "Não"} 
        />
        <StatusBadge 
          label="Paredes Finas" 
          active={geometry.thinWalls} 
          value={geometry.thinWalls ? "Detectado" : "Não"} 
        />
        <StatusBadge 
          label="Objeto Alto" 
          active={geometry.height > 150} 
          value={geometry.height > 150 ? "Sim" : "Não"} 
          warning={geometry.height > 150}
        />
        <StatusBadge 
          label="Partes / Cores" 
          active={true} 
          value={`${geometry.parts} / ${geometry.colors}`} 
        />
      </div>
    </div>
  );
};

const StatItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted tracking-wider">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <div className="text-sm text-foreground font-bold">{value}</div>
  </div>
);

const StatusBadge = ({ label, active, value, warning }: { label: string, active: boolean, value: string, warning?: boolean }) => (
  <div className={cn(
    "px-3 py-2 rounded-lg flex flex-col gap-0.5 border transition-colors",
    active 
      ? warning 
        ? "bg-destructive/10 border-destructive/20 text-destructive" 
        : "bg-primary/10 border-primary/20 text-primary"
      : "bg-white/5 border-transparent text-muted/50"
  )}>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
    <span className="text-xs font-bold leading-none">{value}</span>
  </div>
);
