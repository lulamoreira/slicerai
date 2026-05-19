export const PRINTERS = {
  "X1 Carbon": { buildVol: [256, 256, 256], ams: true,  amsLite: false, maxSlots: 16, lidar: true,  enclosure: true  },
  "X1E":       { buildVol: [256, 256, 256], ams: true,  amsLite: false, maxSlots: 16, lidar: true,  enclosure: true  },
  "P1S":       { buildVol: [256, 256, 256], ams: true,  amsLite: false, maxSlots: 16, lidar: false, enclosure: true  },
  "P1P":       { buildVol: [256, 256, 256], ams: false, amsLite: false, maxSlots: 0,  lidar: false, enclosure: false },
  "A1":        { buildVol: [256, 256, 256], ams: false, amsLite: true,  maxSlots: 4,  lidar: false, enclosure: false },
  "A1 Mini":   { buildVol: [180, 180, 180], ams: false, amsLite: true,  maxSlots: 4,  lidar: false, enclosure: false }
} as const;

export type PrinterName = keyof typeof PRINTERS;
