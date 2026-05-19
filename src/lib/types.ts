export type PrinterModel = "X1C" | "X1E" | "P1S" | "P1P" | "A1" | "A1-Mini";
export type NozzleDiameter = 0.2 | 0.4 | 0.6 | 0.8;
export type FlushStrategy = "Automático" | "Conservador" | "Agressivo";

export interface AMSSlot {
  material: string;
  color: string;
  partAssigned?: string;
}

export interface GeometryStats {
  height: number;
  volume: number;
  surfaceArea: number;
  overhangsDetected: boolean;
  maxOverhangAngle: number;
  thinWalls: boolean;
  bridging: boolean;
  boundingBox: { x: number; y: number; z: number };
  parts: number;
  colors: number;
}

export interface WizardState {
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
  priority: number; // 0 to 100 (Quality to Speed)
  useCase: string;
  fileName: string;
  fileSize: number;
  geometryStats?: GeometryStats;
  shouldRotate90X?: boolean;
}

export interface AIResponse {
  quality: {
    layer_height: number;
    first_layer_height: number;
    seam_position: string;
    ironing: boolean;
  };
  strength: {
    infill_percent: number;
    infill_pattern: string;
    wall_loops: number;
    top_bottom_layers: number;
  };
  support: {
    enabled: boolean;
    type: string;
    threshold_angle: number;
    reason: string;
  };
  temperatures: {
    nozzle: number;
    bed: number;
    chamber: number;
  };
  speed: {
    print: number;
    first_layer: number;
    travel: number;
  };
  estimates: {
    time: string;
    filament_g: number;
    filament_m: number;
    filament_per_color: number[];
    estimated_cost_brl: number;
    chamber_temp_required: boolean;
  };
  advanced: {
    elephant_foot_compensation: number;
    enable_overhang_speed: boolean;
    bridge_speed: number;
  };
  explanation: {
    topics: Record<string, string>;
    warnings: string[];
    pre_print_checklist_extra: string[];
  };
  profile_name_suggestion: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  printer: PrinterModel;
  material: string;
  color: string;
  thumbnail: string;
  results: AIResponse;
  wizardState: WizardState;
}

export interface AppState {
  theme: "light" | "dark";
  language: "pt-BR" | "en";
  openaiKey?: string;
  costPerKg: number;
}
