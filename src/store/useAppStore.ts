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
import { ParsedThreeMf } from "../lib/threeMfParser";


interface SettingsStore {
  claudeKey: string;
  costPerKg: number;
  defaultPrinter: string;
  language: 'pt-BR' | 'en';
  theme: 'dark' | 'light' | 'contrast' | 'rainbow';
  history: HistoryEntry[];
  
  setClaudeKey: (apiKey: string) => void;
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
      setTheme: (theme) => set({ theme: theme as any }),
      addToHistory: (entry) => set((state: SettingsStore) => ({
        history: [entry, ...state.history].slice(0, 5)
      })),
    }),
    {
      name: "slicerai-settings",
      version: 2,
      migrate: (persistedState: any) => ({
        ...persistedState,
        meshData: null,
        parsedProject: null,
        selectedPlateId: 1,
      }),
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
  supportEnabled: boolean;
  supportType: string;
  supportInterface: string;
  fileName: string;
  fileSize: number;
  geometryStats?: GeometryStats;
}

interface AppStore {
  status: 'idle' | 'parsing' | 'parse_error' | 'ready' | 'generating' | 'result' | 'api_error' | 'no_api_key';
  file: File | null;
  geometry: GeometryStats | null;
  meshData: { vertices: [number,number,number][]; triangles: [number,number,number][] } | null;
  wizard: WizardState;
  results: AIResponse | null;
  isWireframe: boolean;
  profileVersion: number;
  profileHistory: ProfileHistoryItem[];
  isFinalized: boolean;
  parsedProject: ParsedThreeMf | null;
  selectedPlateId: number;


  setStatus: (status: AppStore['status']) => void;
  setFile: (file: AppStore['file']) => void;
  setGeometry: (geometry: GeometryStats | null) => void;
  setMeshData: (mesh: AppStore['meshData']) => void;
  updateWizard: (updates: Partial<WizardState>) => void;
  setResults: (results: AIResponse | null) => void;
  toggleWireframe: () => void;
  resetApp: () => void;
  setProfileVersion: (version: number) => void;
  addToProfileHistory: (item: ProfileHistoryItem) => void;
  setIsFinalized: (finalized: boolean) => void;
  setParsedProject: (p: ParsedThreeMf | null) => void;
  setSelectedPlateId: (id: number) => void;

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
  supportEnabled: false,
  supportType: "Tree (Auto)",
  supportInterface: "Mesmo material",
  fileName: "",
  fileSize: 0,
};

export const useAppStore = create<AppStore>((set) => ({
  status: 'idle',
  file: null,
  geometry: null,
  meshData: null,
  wizard: initialWizard,
  results: null,
  isWireframe: false,
  profileVersion: 1,
  profileHistory: [],
  isFinalized: false,
  parsedProject: null,
  selectedPlateId: 1,


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
  setMeshData: (meshData) => set({ meshData }),
  updateWizard: (updates) => set((state) => ({ wizard: { ...state.wizard, ...updates } })),
  setResults: (results) => set({ results, status: results ? 'result' : 'ready' }),
  toggleWireframe: () => set((state) => ({ isWireframe: !state.isWireframe })),
  resetApp: () => set({
    status: 'idle',
    file: null,
    geometry: null,
    meshData: null,
    wizard: {
      ...initialWizard,
      printer: (useSettingsStore.getState().defaultPrinter as any) || "X1C"
    },
    results: null,
    profileVersion: 1,
    profileHistory: [],
    isFinalized: false,
    parsedProject: null,
    selectedPlateId: 1
  }),
  setParsedProject: (parsedProject) => set({ parsedProject }),
  setSelectedPlateId: (selectedPlateId) => set({ selectedPlateId }),

  setProfileVersion: (profileVersion) => set({ profileVersion }),
  addToProfileHistory: (item) => set((state) => ({ 
    profileHistory: [...state.profileHistory, item] 
  })),
  setIsFinalized: (isFinalized) => set({ isFinalized }),
}));

