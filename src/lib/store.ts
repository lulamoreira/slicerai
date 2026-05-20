import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  WizardState, 
  PrinterModel, 
  NozzleDiameter, 
  AMSSlot, 
  FlushStrategy, 
  AIResponse, 
  HistoryEntry,
  AppState,
  GeometryStats
} from "./types";

interface SlicerStore {
  wizard: WizardState;
  app: AppState;
  history: HistoryEntry[];
  currentResults?: AIResponse;
  isGenerating: boolean;

  setStep: (step: number) => void;
  updateWizard: (updates: Partial<WizardState>) => void;
  resetWizard: () => void;

  toggleTheme: () => void;
  setLanguage: (lang: "pt-BR" | "en") => void;
  setOpenAIKey: (key: string) => void;
  setCostPerKg: (cost: number) => void;

  setResults: (results: AIResponse) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  setGenerating: (isGenerating: boolean) => void;
  loadFromHistory: (entry: HistoryEntry) => void;
}

const initialWizard: WizardState = {
  step: 1,
  printer: "X1C",
  nozzle: 0.4,
  layerHeight: 0.20,
  hasAMS: false,
  amsSlotCount: 4,
  amsSlots: Array(16).fill(null).map((_, i) => ({ slot: i + 1, material: "PLA", color: "#00c8b4" })),
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

export const useStore = create<SlicerStore>()(
  persist(
    (set, get) => ({
      wizard: initialWizard,
      app: {
        theme: "dark",
        language: "pt-BR",
        costPerKg: 120,
      },
      history: [],
      isGenerating: false,

      setStep: (step) => set((state) => ({ wizard: { ...state.wizard, step } })),
      updateWizard: (updates) => set((state) => ({ wizard: { ...state.wizard, ...updates } })),
      resetWizard: () => set({ wizard: initialWizard, currentResults: undefined }),

      toggleTheme: () => set((state) => ({ 
        app: { ...state.app, theme: state.app.theme === "dark" ? "light" : "dark" } 
      })),
      setLanguage: (language) => set((state) => ({ app: { ...state.app, language } })),
      setOpenAIKey: (openaiKey) => set((state) => ({ app: { ...state.app, openaiKey } })),
      setCostPerKg: (costPerKg) => set((state) => ({ app: { ...state.app, costPerKg } })),

      setResults: (results) => set({ currentResults: results }),
      setGenerating: (isGenerating) => set({ isGenerating }),

      addToHistory: (entry) => set((state) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        } as any;
        const newHistory = [newEntry, ...state.history].slice(0, 5);
        return { history: newHistory };
      }),

      loadFromHistory: (entry) => set({
        wizard: entry.wizard,
        currentResults: entry.results,
      }),
    }),
    {
      name: "slicer-ai-storage",
      partialize: (state) => ({
        app: state.app,
        history: state.history,
      }),
    }
  )
);
