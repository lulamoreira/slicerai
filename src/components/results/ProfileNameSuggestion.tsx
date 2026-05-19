import React from "react";
import { useTranslation } from "../lib/i18n";
import { useSettingsStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

export const ProfileNameSuggestion: React.FC<{ name: string }> = ({ name }) => {
  const { language } = useSettingsStore();
  const t = useTranslation(language);

  return (
    <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">
        {t('results.profile_suggestion') || "Sugestão de Nome de Perfil"}
      </p>
      <div className="flex items-center gap-3 p-3 bg-surface-raised border border-white/5 rounded-2xl group shadow-inner">
        <code className="flex-1 text-xs font-mono font-bold text-primary truncate pl-2">
          {name}
        </code>
      </div>
    </div>
  );
};
