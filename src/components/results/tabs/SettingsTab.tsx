import React, { useState } from "react";
import { AIResponse } from "../../../lib/types";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

export const SettingsTab = ({ results }: { results: AIResponse }) => {
  const sections = [
    {
      title: "Quality",
      params: [
        { key: "layer_height", value: results.quality.layer_height },
        { key: "initial_layer_height", value: results.quality.first_layer_height },
        { key: "seam_position", value: results.quality.seam_position },
        { key: "ironing", value: results.quality.ironing },
        { key: "ironing_flow", value: `${results.quality.ironing_flow}%` },
        { key: "ironing_speed", value: `${results.quality.ironing_speed} mm/s` },
      ]
    },
    {
      title: "Strength",
      params: [
        { key: "wall_loops", value: results.strength.wall_loops },
        { key: "top_shell_layers", value: results.strength.top_layers },
        { key: "bottom_shell_layers", value: results.strength.bottom_layers },
        { key: "sparse_infill_density", value: `${results.strength.infill_density}%` },
        { key: "sparse_infill_pattern", value: results.strength.infill_pattern },
        { key: "top_surface_pattern", value: results.strength.top_surface_pattern },
        { key: "bottom_surface_pattern", value: results.strength.bottom_surface_pattern },
      ]
    },
    {
      title: "Support",
      params: [
        { key: "enable_support", value: results.support.needed },
        { key: "support_type", value: results.support.type },
        { key: "support_threshold_angle", value: results.support.threshold_angle },
        { key: "support_top_z_distance", value: `${results.support.top_z_distance} mm` },
        { key: "support_bottom_z_distance", value: `${results.support.bottom_z_distance} mm` },
        { key: "support_object_xy_distance", value: `${results.support.xy_distance} mm` },
        { key: "support_interface_top_layers", value: results.support.interface_layers },
        { key: "support_interface_pattern", value: results.support.interface_pattern },
      ]
    },
    {
        title: "Temperature & Speed",
        params: [
          { key: "nozzle_temperature", value: `${results.temperature.nozzle} °C` },
          { key: "bed_temperature", value: `${results.temperature.bed} °C` },
          { key: "chamber_temperature", value: `${results.temperature.chamber} °C` },
          { key: "fan_max_speed", value: `${results.temperature.part_cooling_fan}%` },
          { key: "overall_speed_limit", value: `${results.speed.outer_wall} mm/s` },
        ]
      }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {sections.map((section, idx) => (
        <ConfigSection key={idx} section={section} />
      ))}
    </div>
  );
};

const ConfigSection = ({ section }: { section: any }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = section.params.map((p: any) => `${p.key} = ${p.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Seção ${section.title} copiada!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface-raised border border-border-strong rounded-lg overflow-hidden group shadow-sm transition-all hover:border-primary">
      <div className="bg-surface px-6 py-3 flex items-center justify-between border-b border-border-strong">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{section.title}</h3>
        <button 
          onClick={handleCopy}
          className="p-1.5 hover:bg-primary-subtle rounded-lg text-muted hover:text-primary transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-6 mono text-[0.8rem] leading-relaxed text-foreground-soft">
        {section.params.map((p: any, i: number) => (
          <div key={i} className="flex flex-col sm:flex-row sm:gap-4 mb-2 sm:mb-0">
            <span className="text-muted sm:w-48 shrink-0">{p.key}</span>
            <div className="flex gap-2 items-center">
              <span className="text-foreground font-bold hidden sm:inline">=</span>
              <span className="text-primary font-bold">{p.value.toString()}</span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};
