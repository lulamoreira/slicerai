# SlicerAI for Bambu Studio — Enhanced Plan

A modern web app that analyzes 3D models and recommends optimized Bambu Studio slicer settings via AI.

## User Flow & UI Structure

### Layout
- **Topbar**: Logo, Moon/Sun toggle, PT-BR/EN toggle, Histórico (Drawer), Settings (Modal).
- **Left Panel**: 3D Preview (R3F) + Orientation Advisor banner + Extended Geometry Stats Card.
- **Right Panel**: 5-Step Wizard or 4-Tab Results View.

### 1. File Upload & 3D Preview
- **Dropzone**: Supports `.stl` and `.3mf`.
- **3D Viewer**: Built with `@react-three/fiber` and `@react-three/drei`. Orbit controls, grid, axes.
- **Orientation Advisor**: Banner if 90° X-rotation reduces overhang angle below 45°.
- **Stats Card**:
  - Height (mm), Volume (cm³), Surface Area (cm²).
  - Estimated Weight (g): `volume * materialDensity`.
  - Overhang angle detections.
  - Warnings: Thin walls, bridging, "Requer câmara" (Chamber required) badge.

### 2. 5-Step Wizard
- **Step 1 — Printer & Nozzle**:
  - Radios: X1C, X1E, P1S, P1P, A1, A1 Mini.
  - Nozzle: 0.2, 0.4 (default), 0.6, 0.8mm.
- **Step 2 — Material & Color (AMS)**:
  - Toggle: "Tem AMS acoplado?".
  - If NO: Material (PLA, PETG, etc.), Variant, Color Picker.
  - If YES: Slots (4, 8, 12, 16), per-slot material/color/part.
  - Flush strategy: Automático / Conservador / Agressivo.
  - Wipe tower toggle (default ON).
- **Step 3 — Build Plate**: Cool/PEI, Engineering, High Temp, Textured PEI. Tooltips for material compatibility.
- **Step 4 — Priority & Use-case**: Slider (Quality vs Speed) + Type (Decorative, Functional, etc.).
- **Step 5 — Review**:
  - Full summary of selections.
  - Time estimate range based on volume + layer height.
  - "Gerar Configurações com IA" button with animated shimmer.

### 3. AI Analysis & Results (4 Tabs)
- **OpenAI Integration**: calls GPT-4o with geometry metadata + wizard context.
- **JSON Validation & Repair**: Brace-balancer for truncation + Zod schema validation.
- **Tab 1 — Resumo Visual**: Grid of cards for Quality, Strength, Support, Temp, Speed, AMS, Estimates.
- **Tab 2 — Configurações**: Monospace key=value view. Copy buttons per section + "Copiar Tudo".
- **Tab 3 — Explicação IA**: Cards per topic (reasons for layer height, infill, etc.).
- **Tab 4 — Checklist**: Pre-print items (IPA clean, dry filament) + AI-suggested extra items.
- **Footer**: Profile name suggestion copy field.

### 4. Persistence & Sharing
- **History**: LocalStorage (last 5 entries). Includes 3D thumbnail and results.
- **Share**: Base64 JSON in URL `?cfg=`. Rehydrates state on load.

## Technical Details

### State Management
- `zustand` for wizard state, history, and settings.
- `i18next` or simple object-based i18n for PT-BR/EN.

### Geometry Engine
- Mesh volume, surface area, and overhang analysis using standard Three.js geometry attributes.
- materialDensity map for live weight calculation.

### Design Tokens
- **Background**: `#0d0d14`
- **Surface**: `#161622` (Card), `#1e1e2e` (Elevated)
- **Accent**: `#00ADB5` / `#00c8b4`
- **Primary Glow**: `#00e5ce`
- **Theme**: Dark (default) / Light.

### AI Schema (Zod)
```typescript
{
  quality: { layer_height: number, first_layer_height: number, seam_position: string, ironing: boolean },
  strength: { infill_percent: number, infill_pattern: string, wall_loops: number, top_bottom_layers: number },
  support: { enabled: boolean, type: string, threshold_angle: number, reason: string },
  temperatures: { nozzle: number, bed: number, chamber: number },
  speed: { print: number, first_layer: number, travel: number },
  estimates: { time: string, filament_g: number, filament_m: number, filament_per_color: number[], cost_brl: number, chamber_temp_required: boolean },
  advanced: { elephant_foot_compensation: number, enable_overhang_speed: boolean, bridge_speed: number },
  explanation: { topics: Record<string, string>, warnings: string[], pre_print_checklist_extra: string[] },
  profile_name_suggestion: string
}
```

## Implementation Phases

1.  **Phase 1: Foundation**: Setup Vite, Tailwind, i18n, and basic layout components (Topbar, Modal).
2.  **Phase 2: 3D Engine**: Implement File Upload, Three.js viewer, and geometry analysis worker.
3.  **Phase 3: Wizard**: Build the 5-step UI with validation and AMS logic.
4.  **Phase 4: AI Logic**: OpenAI client, JSON repair, prompt engineering, and Share/History features.
5.  **Phase 5: Results View**: 4-tab dashboard with copy/export and profile suggester.
6.  **Phase 6: Polish**: Theme toggle, animation refinement (shimmer), and mobile responsiveness.
