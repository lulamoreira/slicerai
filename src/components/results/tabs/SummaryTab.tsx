import React from "react";
import { AIResponse } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import { 
  Shield, 
  Thermometer, 
  Gauge, 
  Layers, 
  Clock, 
  Palette,
  Wind,
  Box
} from "lucide-react";

export const SummaryTab = ({ results }: { results: AIResponse }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionCard 
        icon={Layers} 
        title="Qualidade" 
        items={[
          { label: "Layer Height", value: `${results.quality.layer_height}mm` },
          { label: "First Layer", value: `${results.quality.first_layer_height}mm` },
          { label: "Seam", value: results.quality.seam_position },
          { label: "Ironing", value: results.quality.ironing ? "Sim" : "Não" }
        ]}
      />
      <SectionCard 
        icon={Shield} 
        title="Resistência" 
        items={[
          { label: "Infill", value: `${results.strength.infill_density}% — ${results.strength.infill_pattern}` },
          { label: "Wall Loops", value: results.strength.wall_loops.toString() },
          { label: "Top Layers", value: results.strength.top_layers.toString() },
          { label: "Bottom Layers", value: results.strength.bottom_layers.toString() }
        ]}
      />
      <SectionCard 
        icon={Box} 
        title="Suporte" 
        items={[
          { label: "Tipo", value: results.support.type },
          { label: "Threshold", value: `${results.support.threshold_angle}°` },
          { label: "Z Distance", value: `${results.support.top_z_distance}mm` },
          { label: "Interface", value: results.support.interface_pattern }
        ]}
      />
      <SectionCard 
        icon={Thermometer} 
        title="Temperatura" 
        items={[
          { label: "Nozzle", value: `${results.temperature.nozzle}°C / first: ${results.temperature.nozzle_first_layer}°C` },
          { label: "Bed", value: `${results.temperature.bed}°C / first: ${results.temperature.bed_first_layer}°C` },
          { label: "Câmara", value: results.temperature.chamber_required ? `${results.temperature.chamber}°C ⚠️` : "N/A" },
          { label: "Cooling Fan", value: `${results.temperature.part_cooling_fan}%` }
        ]}
      />
      <SectionCard 
        icon={Gauge} 
        title="Velocidade" 
        items={[
          { label: "Outer Wall", value: `${results.speed.outer_wall}mm/s` },
          { label: "Inner Wall", value: `${results.speed.inner_wall}mm/s` },
          { label: "Top Surface", value: `${results.speed.top_surface}mm/s` },
          { label: "Travel", value: `${results.speed.travel}mm/s` },
          { label: "First Layer", value: `${results.speed.first_layer}mm/s` }
        ]}
      />
      <SectionCard 
        icon={Palette} 
        title="AMS / Multi-Color" 
        items={[
          { label: "Wipe Tower", value: results.ams.wipe_tower_enabled ? "Sim" : "Não" },
          { label: "Tower Width", value: `${results.ams.wipe_tower_width}mm` },
          { label: "Flush", value: `x${results.ams.flush_multiplier}` },
          { label: "Flush → Infill", value: results.ams.flush_into_infill ? "Sim" : "Não" }
        ]}
      />
      <div className="col-span-1 md:col-span-2 p-8 bg-surface/80 backdrop-blur-md border border-border/50 rounded-2xl flex flex-col gap-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
        <div className="flex items-center gap-3 border-b border-border/50 pb-5">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Estimativas de Produção</span>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-1">
                <p className="text-[0.65rem] font-bold uppercase text-muted tracking-widest leading-none">Tempo Total</p>
                <p className="text-2xl font-bold text-primary mono leading-none">
                    {Math.floor(results.estimates.print_time_minutes / 60)}h {results.estimates.print_time_minutes % 60}min
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[0.65rem] font-bold uppercase text-muted tracking-widest leading-none">Material Total</p>
                <p className="text-xl font-bold text-foreground leading-none">
                    {results.estimates.filament_grams}g <span className="text-muted/30 text-sm">/</span> {results.estimates.filament_meters}m
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[0.65rem] font-bold uppercase text-muted tracking-widest leading-none">Custo Estimado</p>
                <p className="text-xl font-bold text-success leading-none">
                    R$ {results.estimates.estimated_cost_brl.toFixed(2)}
                </p>
            </div>
        </div>

        {results.estimates.filament_per_color.length > 0 && (
            <div className="space-y-3">
                <p className="text-[0.65rem] font-bold uppercase text-muted tracking-[0.2em] opacity-50">Breakdown por cor (AMS)</p>
                <div className="flex flex-wrap gap-4">
                    {results.estimates.filament_per_color.map((f: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-raised px-3 py-2 rounded-lg border border-border">
                            <div className="w-3 h-3 rounded-full border border-border-strong" style={{ backgroundColor: f.color }} />
                            <span className="text-[0.7rem] text-muted">Tray {f.slot}: <span className="text-foreground font-bold">{f.grams}g</span></span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, items }: any) => (
  <div className="p-6 bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl flex flex-col gap-5 transition-all hover:border-primary/20 hover:bg-surface/80 group shadow-lg">
    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
      <div className="p-2 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
        <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
    </div>

    <div className="grid grid-cols-1 gap-y-4">
        {items.map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 min-w-0 group/item">
                <span className="text-[0.75rem] font-bold text-muted-foreground/70 uppercase tracking-wider truncate leading-none group-hover/item:text-muted-foreground transition-colors">{it.label}</span>
                <span className={cn("text-[0.95rem] font-black tracking-tight whitespace-nowrap leading-none transition-colors", (it.label.includes("Infill") || it.label.includes("Tipo") || it.label.includes("Pattern")) ? "text-primary" : "text-foreground group-hover/item:text-primary")}>{it.value}</span>
            </div>
        ))}
    </div>

  </div>
);
