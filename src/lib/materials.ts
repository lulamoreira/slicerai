export const MATERIALS = {
  "PLA":            { density: 1.24, nozzle: [190, 220], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PLA Matte":      { density: 1.24, nozzle: [200, 220], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PLA Silk":       { density: 1.27, nozzle: [215, 230], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PLA Galaxy":     { density: 1.24, nozzle: [210, 225], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PLA Glow":       { density: 1.24, nozzle: [210, 225], bed: [35, 45],   chamber: null, plates: ["Cool Plate"] },
  "PLA High Speed": { density: 1.24, nozzle: [220, 240], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PLA-CF":         { density: 1.24, nozzle: [220, 240], bed: [35, 45],   chamber: null, plates: ["Cool Plate", "Textured PEI"] },
  "PETG":           { density: 1.27, nozzle: [230, 250], bed: [70, 85],   chamber: null, plates: ["Textured PEI", "Engineering Plate"] },
  "PETG-CF":        { density: 1.27, nozzle: [240, 260], bed: [80, 90],   chamber: null, plates: ["Engineering Plate", "Textured PEI"] },
  "ABS":            { density: 1.05, nozzle: [240, 260], bed: [90, 110],  chamber: 45,   plates: ["Engineering Plate", "High Temp Plate"] },
  "ASA":            { density: 1.06, nozzle: [240, 260], bed: [90, 110],  chamber: 45,   plates: ["Engineering Plate", "High Temp Plate"] },
  "TPU 95A":        { density: 1.21, nozzle: [210, 230], bed: [35, 45],   chamber: null, plates: ["Textured PEI"] },
  "TPU 87A":        { density: 1.21, nozzle: [205, 225], bed: [35, 45],   chamber: null, plates: ["Textured PEI"] },
  "PA":             { density: 1.13, nozzle: [250, 270], bed: [90, 100],  chamber: 60,   plates: ["Engineering Plate", "High Temp Plate"] },
  "PA-CF":          { density: 1.17, nozzle: [260, 280], bed: [100, 120], chamber: 60,   plates: ["High Temp Plate"] },
  "PC":             { density: 1.20, nozzle: [260, 280], bed: [100, 120], chamber: 60,   plates: ["High Temp Plate", "Engineering Plate"] },
  "PVA":            { density: 1.23, nozzle: [190, 210], bed: [45, 55],   chamber: null, plates: ["Cool Plate"] },
  "HIPS":           { density: 1.03, nozzle: [220, 240], bed: [90, 100],  chamber: 40,   plates: ["Engineering Plate"] }
} as const;

export type MaterialName = keyof typeof MATERIALS;
