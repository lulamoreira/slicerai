import React, { useState } from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { cn } from "../../../lib/utils";
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
import { AIResponse } from "../../../lib/types";

export const ExportBar = ({ results, onReset }: { results: AIResponse, onReset: () => void }) => {
  const { wizard } = useAppStore();
  const [copiedAll, setCopiedAll] = useState(false);

  const generateFullConfigText = (results: any) => {
    return `[Quality]\nlayer_height = ${results.quality.layer_height}\n...`; // Simplified for brevity
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
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    const cfg = btoa(JSON.stringify({ wizard, results }));
    url.searchParams.set("cfg", cfg);
    navigator.clipboard.writeText(url.toString());
    toast.success("Link compartilhado copiado!");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={onReset} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black tracking-widest text-muted hover:text-white transition-all">
        <RotateCcw className="w-3.5 h-3.5" /> REFAZER
      </button>
      <button onClick={handleDownload} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black tracking-widest text-muted hover:text-white transition-all">
        <Download className="w-3.5 h-3.5" /> BAIXAR .TXT
      </button>
      <button onClick={handleShare} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black tracking-widest text-muted hover:text-white transition-all">
        <Share className="w-3.5 h-3.5" /> COMPARTILHAR
      </button>
    </div>
  );
};
