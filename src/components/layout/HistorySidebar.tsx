import React from "react";
import { useAppStore, useSettingsStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { 
  History, 
  Trash2, 
  Box, 
  ChevronRight,
  Clock,
  Printer,
  Layers,
  Palette,
  X,
  Ghost
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { HistoryEntry } from "../../lib/types";

interface HistorySidebarProps {
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ onClose }) => {
  const { history, language } = useSettingsStore();
  const locale = language === 'pt-BR' ? ptBR : enUS;

  const clearHistory = () => {
    if (confirm(language === 'pt-BR' ? "Limpar todo o histórico?" : "Clear all history?")) {
      useSettingsStore.setState({ history: [] });
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-white/10 shadow-2xl animate-in slide-in-from-right-full duration-500 relative">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-primary" />
                </div>
                {language === 'pt-BR' ? 'Histórico' : 'History'}
            </h2>
            <button onClick={onClose} className="p-2 text-muted hover:text-white transition-colors bg-white/5 rounded-lg">
                <X className="w-4 h-4" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {history.length === 0 ? (
                <div className="py-20 text-center space-y-6 opacity-30">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-dashed border-white/20">
                        <Box className="w-10 h-10 text-muted" />
                    </div>
                    <p className="text-muted text-xs font-black uppercase tracking-widest italic">
                        {language === 'pt-BR' ? 'Nenhum projeto recente' : 'No recent projects'}
                    </p>
                </div>
            ) : (
                history.map((entry: HistoryEntry) => (
                    <button
                        key={entry.id}
                        onClick={() => {
                            useAppStore.setState({ 
                                wizard: entry.wizardState, 
                                results: entry.results,
                                status: 'result'
                            });
                            onClose();
                        }}
                        className="w-full group bg-surface-raised border border-white/5 rounded-[1.5rem] p-4 flex flex-col gap-4 transition-all hover:border-primary/50 hover:bg-white/[0.02] text-left shadow-lg overflow-hidden relative"
                    >
                        <div className="flex gap-4 min-w-0 relative z-10">
                            <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 shadow-inner">
                                {entry.thumbnail ? (
                                    <img src={entry.thumbnail} alt="" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <Box className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1 py-1">
                                <p className="text-[13px] font-black italic text-white truncate group-hover:text-primary transition-colors leading-tight">
                                    {entry.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] font-black text-muted/50 uppercase tracking-tighter">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale })}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Printer className="w-2.5 h-2.5 text-primary" />
                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest">{entry.printer.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest truncate max-w-[60px]">{entry.material}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="self-center">
                                <ChevronRight className="w-4 h-4 text-muted/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Layers className="w-2.5 h-2.5 text-muted/30" />
                                <span className="text-[9px] font-mono text-muted/50 font-bold">{entry.results.quality.layer_height}mm</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-[2px] border border-muted/20 flex items-center justify-center p-[2px]">
                                    <div className="w-full h-full bg-muted/20 rounded-[1px]" />
                                </div>
                                <span className="text-[9px] font-mono text-muted/50 font-bold">{entry.results.strength.infill_density}%</span>
                            </div>
                        </div>
                    </button>
                ))
            )}
        </div>

        {history.length > 0 && (
            <div className="p-6 border-t border-white/5">
                <button 
                    onClick={clearHistory}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black tracking-widest rounded-xl hover:bg-destructive hover:text-white transition-all group"
                >
                    <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    {language === 'pt-BR' ? 'LIMPAR HISTÓRICO' : 'CLEAR HISTORY'}
                </button>
            </div>
        )}
    </div>
  );
};
