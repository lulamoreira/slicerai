export const translations = {
  "pt-BR": {
    "app.name": "SlicerAI for Bambu",
    "nav.history": "Histórico",
    "nav.settings": "Configurações",
    "nav.lang": "Idioma",
    "wizard.step": "Passo",
    "wizard.next": "Próximo",
    "wizard.prev": "Voltar",
    "wizard.generate": "Gerar Configurações com IA",
    "results.title": "Resultados SlicerAI",
    "results.new": "NOVO PROJETO",
    "results.tab.summary": "Resumo Visual",
    "results.tab.config": "Configurações",
    "results.tab.explanation": "Explicação IA",
    "results.tab.checklist": "Checklist",
    "stats.height": "Altura",
    "stats.volume": "Volume",
    "stats.area": "Área Sup.",
    "stats.chamber": "Câmara",
    // ... more
  },
  "en": {
    "app.name": "SlicerAI for Bambu",
    "nav.history": "History",
    "nav.settings": "Settings",
    "nav.lang": "Language",
    "wizard.step": "Step",
    "wizard.next": "Next",
    "wizard.prev": "Back",
    "wizard.generate": "Generate AI Settings",
    "results.title": "SlicerAI Results",
    "results.new": "NEW PROJECT",
    "results.tab.summary": "Visual Summary",
    "results.tab.config": "Settings",
    "results.tab.explanation": "AI Explanation",
    "results.tab.checklist": "Checklist",
    "stats.height": "Height",
    "stats.volume": "Volume",
    "stats.area": "Surf. Area",
    "stats.chamber": "Chamber",
  }
};

export type Language = keyof typeof translations;

export const useTranslation = (lang: Language) => {
  return (key: string) => {
    return (translations[lang] as any)[key] || key;
  };
};
