import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  PrinterModel, 
  NozzleDiameter, 
  AMSSlot, 
  FlushStrategy, 
  AIResponse, 
  HistoryEntry,
  GeometryStats 
} from "../lib/types";

interface WizardState {
  step: number;
  printer: PrinterModel;
  nozzle: NozzleDiameter;
  hasAMS: boolean;
  amsSlots: AMSSlot[];
  flushStrategy: FlushStrategy;
  wipeTower: boolean;
  material: string;
  variant: string;
  baseColor: string;
  buildPlate: string;
  priority: number;
  useCase: string;
  fileName: string;
  fileSize: number;
  geometryStats?: GeometryStats;
  shouldRotate90X: boolean;
}

interface AppStore {
  status: 'idle' | 'parsing' | 'parse_error' | 'ready' | 'generating' | 'result' | 'api_error' | 'no_api_key';
  file: { name: string; size: number; type: string } | null;
  geometry: GeometryStats | null;
  wizard: WizardState;
  results: AIResponse | null;
  orientationAdvice: { suggested: boolean; dismissed: boolean };
  isWireframe: boolean;

  setStatus: (status: AppStore['status']) => void;
  setFile: (file: AppStore['file']) => void;
  setGeometry: (geometry: GeometryStats | null) => void;
  updateWizard: (updates: Partial<WizardState>) => void;
  setResults: (results: AIResponse | null) => void;
  setOrientationAdvice: (advice: Partial<AppStore['orientationAdvice']>) => void;
  toggleWireframe: () => void;
  resetApp: () => void;
}

const initialWizard: WizardState = {
  step: 1,
  printer: "X1C",
  nozzle: 0.4,
  hasAMS: false,
  amsSlots: Array(4).fill(null).map(() => ({ material: "PLA", color: "#00c8b4" })),
  flushStrategy: "Automático",
  wipeTower: true,
  material: "PLA",
  variant: "Basic",
  baseColor: "#00c8b4",
  buildPlate: "Textured PEI Plate",
  priority: 50,
  useCase: "Functional",
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

  setStatus: (status) => set({ status }),
  setFile: (file) => set({ file }),
  setGeometry: (geometry) => set({ geometry }),
  updateWizard: (updates) => set((state) => ({ wizard: { ...state.wizard, ...updates } })),
  setResults: (results) => set({ results, status: results ? 'result' : 'ready' }),
  setOrientationAdvice: (advice) => set((state) => ({ orientationAdvice: { ...state.orientationAdvice, ...advice } })),
  toggleWireframe: () => set((state) => ({ isWireframe: !state.isWireframe })),
  resetApp: () => set({
    status: 'idle',
    file: null,
    geometry: null,
    wizard: initialWizard,
    results: null,
    orientationAdvice: { suggested: false, dismissed: false }
  }),
}));

interface SettingsStore {
  apiKey: string;
  costPerKg: number;
  defaultPrinter: string;
  language: 'pt-BR' | 'en';
  theme: 'dark' | 'light';
  history: HistoryEntry[];
  
  setApiKey: (apiKey: string) => void;
  setCostPerKg: (cost: number) => void;
  setDefaultPrinter: (printer: string) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  addToHistory: (entry: HistoryEntry) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      apiKey: "",
      costPerKg: 120,
      defaultPrinter: "X1C",
      language: "pt-BR",
      theme: "dark",
      history: [],

      setApiKey: (apiKey) => set({ apiKey }),
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
