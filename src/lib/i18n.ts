import { translations } from "./i18n";

export type Language = keyof typeof translations;

export const useTranslation = (lang: Language) => {
  return (key: string) => {
    const section = (translations[lang] as any);
    if (!section) return key;
    
    // Simple deep lookup
    const keys = key.split('.');
    let result = section;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return result;
  };
};

export const i18n = {
  t: (key: string, lang: Language = 'pt-BR') => {
     const section = (translations[lang] as any);
     const keys = key.split('.');
     let result = section;
     for (const k of keys) {
       result = result?.[k];
       if (result === undefined) return key;
     }
     return result;
  }
};
