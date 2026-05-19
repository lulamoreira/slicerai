import React from "react";
import { AIResponse } from "../../lib/types";
import { cn } from "../../lib/utils";
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
      <div className="col-span-1 md:col-span-2 p-6 bg-surface-raised border border-white/5 rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Estimativas Finais</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-muted/50 tracking-widest leading-none">Tempo Total</p>
                <p className="text-2xl font-black italic text-white leading-none">
                    {Math.floor(results.estimates.print_time_minutes / 60)}h {results.estimates.print_time_minutes % 60}min
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-muted/50 tracking-widest leading-none">Material Total</p>
                <p className="text-xl font-black italic text-white leading-none">
                    {results.estimates.filament_grams}g <span className="text-muted/30 text-sm">/</span> {results.estimates.filament_meters}m
                </p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-muted/50 tracking-widest leading-none">Custo Estimado</p>
                <p className="text-xl font-black italic text-primary leading-none">
                    R$ {results.estimates.estimated_cost_brl.toFixed(2)}
                </p>
            </div>
        </div>

        {results.estimates.filament_per_color.length > 0 && (
            <div className="space-y-3">
                <p className="text-[8px] font-black uppercase text-muted/30 tracking-[0.3em]">Breakdown por cor (AMS)</p>
                <div className="flex flex-wrap gap-4">
                    {results.estimates.filament_per_color.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: f.color }} />
                            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Tray {f.slot}: {f.grams}g</span>
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
  <div className="p-5 bg-surface-raised border border-white/5 rounded-2xl flex flex-col gap-4 transition-all hover:border-primary/20 group shadow-lg">
    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
      <Icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
      <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{title}</span>
    </div>
    <div className="grid grid-cols-1 gap-y-3">
        {items.map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 min-w-0">
                <span className="text-[10px] font-bold text-muted/50 truncate uppercase tracking-widest leading-none">{it.label}</span>
                <span className="text-xs font-black text-white whitespace-nowrap leading-none italic">{it.value}</span>
            </div>
        ))}
    </div>
  </div>
);
