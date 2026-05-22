import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  PrinterModel, 
  NozzleDiameter, 
  AMSSlot, 
  FlushStrategy, 
  AIResponse, 
  HistoryEntry,
  GeometryStats,
  ProfileHistoryItem 
} from "../lib/types";

interface SettingsStore {
  apiKey: string;
  aiProvider: 'gemini' | 'groq' | 'deepseek' | 'openrouter' | 'claude' | 'openai';
  groqApiKey: string;
  deepseekKey: string;
  openrouterKey: string;
  claudeKey: string;
  openaiKey: string;
  costPerKg: number;
  defaultPrinter: string;
  language: 'pt-BR' | 'en';
  theme: 'dark' | 'light' | 'contrast' | 'rainbow';
  history: HistoryEntry[];
  
  setApiKey: (apiKey: string) => void;
  setAiProvider: (provider: 'gemini' | 'groq' | 'deepseek' | 'openrouter' | 'claude' | 'openai') => void;
  setGroqApiKey: (apiKey: string) => void;
  setDeepseekKey: (apiKey: string) => void;
  setOpenrouterKey: (apiKey: string) => void;
  setClaudeKey: (apiKey: string) => void;
  setOpenaiKey: (apiKey: string) => void;
  setCostPerKg: (cost: number) => void;
  setDefaultPrinter: (printer: string) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
  setTheme: (theme: 'dark' | 'light' | 'contrast' | 'rainbow') => void;

  addToHistory: (entry: HistoryEntry) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      apiKey: "",
      aiProvider: "gemini",
      groqApiKey: "",
      deepseekKey: "",
      openrouterKey: "",
      claudeKey: "",
      openaiKey: "",
      costPerKg: 120,
      defaultPrinter: "X1C",
      language: "pt-BR",
      theme: "dark",
      history: [],

      setApiKey: (apiKey) => {
        const cleanKey = apiKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (apiKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ apiKey: cleanKey });
      },
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setGroqApiKey: (groqApiKey) => {
        const cleanKey = groqApiKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (groqApiKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ groqApiKey: cleanKey });
      },
      setDeepseekKey: (deepseekKey) => {
        const cleanKey = deepseekKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (deepseekKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ deepseekKey: cleanKey });
      },
      setOpenrouterKey: (openrouterKey) => {
        const cleanKey = openrouterKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (openrouterKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ openrouterKey: cleanKey });
      },
      setClaudeKey: (claudeKey) => {
        const cleanKey = claudeKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (claudeKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ claudeKey: cleanKey });
      },
      setOpenaiKey: (openaiKey) => {
        const cleanKey = openaiKey.trim().replace(/[^\x20-\x7E]/g, "");
        if (openaiKey && cleanKey.length < 10) {
          throw new Error("Chave inválida — verifique se copiou corretamente");
        }
        set({ openaiKey: cleanKey });
      },
      setCostPerKg: (costPerKg) => set({ costPerKg }),
      setDefaultPrinter: (defaultPrinter) => set({ defaultPrinter }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      addToHistory: (entry) => set((state) => ({
        history: [entry, ...state.history].slice(0, 5)
      })),
    }),
    {
      name: "slicerai-settings",
    }
  )
);

interface WizardState {
  step: number;
  printer: PrinterModel;
  nozzle: NozzleDiameter;
  layerHeight: number;
  hasAMS: boolean;
  amsSlotCount: 4 | 8 | 12 | 16;
  amsSlots: AMSSlot[];
  flushStrategy: FlushStrategy;
  wipeTower: boolean;
  material: string;
  variant: string;
  baseColor: string;
  spoolWeight: number;
  buildPlate: string;
  purposes: string[];
  ironing: boolean;
  seamPosition: string;
  supportEnabled: boolean;
  supportType: string;
  supportInterface: string;
  fileName: string;
  fileSize: number;
  geometryStats?: GeometryStats;
  shouldRotate90X: boolean;
}

interface AppStore {
  status: 'idle' | 'parsing' | 'parse_error' | 'ready' | 'generating' | 'result' | 'api_error' | 'no_api_key';
  file: File | null;
  geometry: GeometryStats | null;
  wizard: WizardState;
  results: AIResponse | null;
  orientationAdvice: { suggested: boolean; dismissed: boolean };
  isWireframe: boolean;
  profileVersion: number;
  profileHistory: ProfileHistoryItem[];
  isFinalized: boolean;

  setStatus: (status: AppStore['status']) => void;
  setFile: (file: AppStore['file']) => void;
  setGeometry: (geometry: GeometryStats | null) => void;
  updateWizard: (updates: Partial<WizardState>) => void;
  setResults: (results: AIResponse | null) => void;
  setOrientationAdvice: (advice: Partial<AppStore['orientationAdvice']>) => void;
  toggleWireframe: () => void;
  resetApp: () => void;
  setProfileVersion: (version: number) => void;
  addToProfileHistory: (item: ProfileHistoryItem) => void;
  setIsFinalized: (finalized: boolean) => void;
}

const initialWizard: WizardState = {
  step: 1,
  printer: "X1C",
  nozzle: 0.4,
  layerHeight: 0.20,
  hasAMS: false,
  amsSlotCount: 4,
  amsSlots: Array(4).fill(null).map((_, i) => ({ slot: i + 1, material: "PLA", color: "#00c8b4" })),
  flushStrategy: "Automático",
  wipeTower: true,
  material: "PLA",
  variant: "Basic",
  baseColor: "#00c8b4",
  spoolWeight: 1000,
  buildPlate: "Textured PEI Plate",
  purposes: ["Funcional"],
  ironing: false,
  seamPosition: "Alinhada",
  supportEnabled: false,
  supportType: "Tree (Auto)",
  supportInterface: "Mesmo material",
  fileName: "",
  fileSize: 0,
  shouldRotate90X: false,
};

export const useAppStore = create<AppStore>((set) => ({
  status: 'idle',
  file: null,
  geometry: null,
  wizard: initialWizard,
  results: null,
  orientationAdvice: { suggested: false, dismissed: false },
  isWireframe: false,
  profileVersion: 1,
  profileHistory: [],
  isFinalized: false,

  setStatus: (status) => set({ status }),
  setFile: (file) => set((state) => {
    // When a new file is uploaded, reset wizard but keep default printer
    return { 
      file, 
      wizard: { 
        ...initialWizard, 
        printer: (useSettingsStore.getState().defaultPrinter as any) || "X1C",
        fileName: file?.name || "",
        fileSize: file?.size || 0
      } 
    };
  }),
  setGeometry: (geometry) => set({ geometry }),
  updateWizard: (updates) => set((state) => ({ wizard: { ...state.wizard, ...updates } })),
  setResults: (results) => set({ results, status: results ? 'result' : 'ready' }),
  setOrientationAdvice: (advice) => set((state) => ({ orientationAdvice: { ...state.orientationAdvice, ...advice } })),
  toggleWireframe: () => set((state) => ({ isWireframe: !state.isWireframe })),
  resetApp: () => set({
    status: 'idle',
    file: null,
    geometry: null,
    wizard: {
      ...initialWizard,
      printer: (useSettingsStore.getState().defaultPrinter as any) || "X1C"
    },
    results: null,
    orientationAdvice: { suggested: false, dismissed: false },
    profileVersion: 1,
    profileHistory: [],
    isFinalized: false
  }),
  setProfileVersion: (profileVersion) => set({ profileVersion }),
  addToProfileHistory: (item) => set((state) => ({ 
    profileHistory: [...state.profileHistory, item] 
  })),
  setIsFinalized: (isFinalized) => set({ isFinalized }),
}));

