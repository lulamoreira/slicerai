export type PrinterModel = "X1C" | "X1E" | "P1S" | "P1P" | "A1" | "A1-Mini";
export type NozzleDiameter = 0.2 | 0.4 | 0.6 | 0.8;
export type FlushStrategy = "Automático" | "Conservador" | "Agressivo";
export type SeamPosition = "Alinhada" | "Aleatória" | "Traseira" | "Arestas";
export type SupportType = "Tree (Auto)" | "Normal (Grid)" | "Sem suporte";
export type SupportInterface = "Mesmo material" | "PVA solúvel";
export type Purpose = "Decorativo" | "Funcional" | "Flexível" | "Alta Resistência" | "Velocidade";

export interface AMSSlot {
  slot: number;
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
  overhangPercentage: number;
  thinWalls: boolean;
  bridging: boolean;
  boundingBox: { x: number; y: number; z: number };
  isTall: boolean;
  parts: number;
  colors: number;
  triangleCount?: number;
}


export interface WizardState {
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
  purposes: Purpose[];
  ironing: boolean;
  seamPosition: SeamPosition;
  supportEnabled: boolean;
  supportType: SupportType;
  supportInterface: SupportInterface;
  fileName: string;
  fileSize: number;
  geometryStats?: GeometryStats;
  shouldRotate90X: boolean;
}

export interface AIResponse {
  quality: {
    layer_height: number;
    first_layer_height: number;
    seam_position: string;
    seamReason?: string;
    improveReason?: string;
    ironing: boolean;
    ironing_flow: number;
    ironing_speed: number;
  };
  strength: {
    infill_density: number;
    infill_pattern: string;
    wall_loops: number;
    top_layers: number;
    bottom_layers: number;
    top_surface_pattern: string;
    bottom_surface_pattern: string;
  };
  support: {
    needed: boolean;
    type: string;
    style: string;
    threshold_angle: number;
    top_z_distance: number;
    bottom_z_distance: number;
    xy_distance: number;
    interface_layers: number;
    interface_pattern: string;
    tree_support_angle: number;
    on_build_plate_only: boolean;
    supportReason?: string;
  };
  temperature: {
    nozzle: number;
    nozzle_first_layer: number;
    bed: number;
    bed_first_layer: number;
    chamber: number;
    chamber_required: boolean;
    part_cooling_fan: number;
    part_cooling_first_layer: number;
  };
  speed: {
    mode: string;
    outer_wall: number;
    inner_wall: number;
    top_surface: number;
    bottom_surface: number;
    infill: number;
    travel: number;
    first_layer: number;
    bridge: number;
    overhang_slow: number;
  };
  ams: {
    wipe_tower_enabled: boolean;
    wipe_tower_width: number;
    flush_multiplier: number;
    flush_into_infill: boolean;
    flush_into_objects: boolean;
    prime_all_extruders: boolean;
  };
  adhesion: {
    brim_type: string;
    brim_width: number;
    skirt_loops: number;
  };
  advanced: {
    elephant_foot_compensation: number;
    enable_overhang_speed: boolean;
    bridge_flow: number;
    precise_outer_wall: boolean;
    thick_bridges: boolean;
    small_perimeter_speed: number;
  };
  estimates: {
    print_time_minutes: number;
    filament_grams: number;
    filament_meters: number;
    filament_per_color: Array<{ slot: number; color: string; grams: number; meters: number }>;
    estimated_cost_brl: number;
  };
  explanation: {
    layer_height_reason: string;
    infill_reason: string;
    support_reason: string;
    material_plate_tips: string;
    postprocessing_tips: string;
    warnings: string[];
    pre_print_checklist_extra: string[];
  };
  profile_name_suggestion: string;
  decisions: {
    layerHeight: string;
    wallLoops: string;
    infillDensity: string;
    infillPattern: string;
    printSpeed: string;
    support: string;
    seam: string;
    ironing: string;
    temperatures: string;
    overall: string;
  };
  improvements?: Record<string, string>;
  orientation: {
    rotation: string;
    reason: string;
    supportReduction: string;
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  fileName: string;
  wizard: WizardState;
  results: AIResponse;
  thumbnail?: string;
  profileVersion?: number;
  profileHistory?: ProfileHistoryItem[];
}

export interface ProfileHistoryItem {
  version: number;
  settings: any; // BambuSettings from bambuExport.ts, but we use AIResponse mostly
  results: AIResponse;
  downloadedAt: string;
  improveReason?: string;
}

export interface AppState {
  theme: "light" | "dark";
  language: "pt-BR" | "en";
  openaiKey?: string;
  costPerKg: number;
}
