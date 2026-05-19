# SlicerAI for Bambu Studio

A dark-themed web app that analyzes 3D models and recommends optimized Bambu Studio slicer settings via AI.

## User flow

1. Land on app → drag/drop or pick a `.stl` / `.3mf` file
2. Left panel renders a 3D preview with orbit controls and detected geometry stats
3. Right panel walks through a 4-step wizard (Printer → Material/Color → Build Plate → Priority/Use-case)
4. On submit, the app sends geometry + answers to OpenAI and shows a structured settings panel with reasoning
5. User copies settings to clipboard or exports a `.3mf` profile-notes text file

## Layout

```text
+---------------------------------------------------+
| Topbar: SlicerAI · Settings (API key) · GitHub    |
+----------------------+----------------------------+
| 3D Preview           | Wizard / Results           |
| (orbit, grid, axes)  | Step 1..4 → Analysis panel |
|                      |                            |
| Geometry stats card  | Copy / Export buttons      |
+----------------------+----------------------------+
```

Mobile: panels stack vertically, preview collapses to a fixed-height card on top.

## Features

### File upload + 3D preview
- Dropzone accepting `.stl` and `.3mf` (3mf treated as zip → extract first model mesh)
- Three.js scene: model centered + auto-framed, OrbitControls, grid, build-plate footprint sized to selected printer
- Geometry analysis (client-side, on the loaded mesh):
  - Height (mm) from bounding box
  - Volume (cm³) via signed-tetra sum
  - Overhang area: faces whose normal angle vs. -Z exceeds 45°
  - Thin walls: heuristic via inward ray sampling (distance < 2× nozzle)
  - Bridging: horizontal downward faces with no support below
- Stats card under preview shows the numbers + small badges (e.g. "Overhangs: 12%")

### 4-step wizard
1. Printer — radio cards: X1 Carbon, X1E, P1S, P1P, A1, A1 Mini (each carries build volume + nozzle defaults)
2. Material — material dropdown (PLA, PETG, ABS, ASA, TPU, PA/Nylon, PC, PLA-CF, PETG-CF, PA-CF), variant sub-dropdown (Standard, Matte, Silk, Galaxy, Glow, HF), color picker
3. Build plate — Cool Plate/PEI, Engineering, High Temp, Textured PEI; tooltip lists compatible materials and warns on mismatch
4. Priority slider (Quality ↔ Speed, 0–100) + use-case (Decorative, Functional, Flexible, High Strength)

Wizard uses a stepper with Back/Next, validates each step, and persists state in React context.

### AI analysis panel
- Sends geometry summary + wizard answers to OpenAI (GPT-4o) with a system prompt requesting strict JSON
- JSON schema groups settings: Quality, Strength, Support, Temperatures, Speed, Estimates, plus `explanation` string
- UI renders one card per group with labeled fields; explanation shown as a highlighted paragraph
- Loading skeleton + retry on failure; surfaces 401/429 with clear messages

### Export
- "Copy settings" → formatted plain-text block (key: value per line, grouped by section)
- "Export .3mf profile notes" → downloads a `.txt` file with the same block plus a header noting model name, printer, material

### Settings modal
- Input for OpenAI API key, stored in `localStorage` only
- Note: key never leaves browser, calls go directly to `api.openai.com`

## Design tokens

- Background `#1a1a2e`, surface `#16213e`, accent `#00ADB5`
- Secondary text `#a8b2c1`, success `#3ddc97`, warning `#ffb454`, danger `#ff5c7a`
- Inter for UI, JetBrains Mono for numeric stats
- Rounded-xl cards, subtle 1px borders in `rgba(255,255,255,0.06)`, soft cyan glow on primary buttons

## Technical details

- Stack: React + Vite + TypeScript, Tailwind, Three.js, `three-stdlib` for `STLLoader` and `OrbitControls`, `fflate` for 3MF unzip, `zustand` for wizard/result state, `lucide-react` icons
- Geometry analysis runs in a Web Worker to keep UI responsive on large meshes
- OpenAI call: `fetch('https://api.openai.com/v1/chat/completions')` with `response_format: { type: 'json_object' }`, model `gpt-4o`; key read from localStorage
- No backend, no Lovable Cloud needed
- File structure:
  - `src/components/Preview/` — Three canvas, stats card
  - `src/components/Wizard/` — Step1..Step4, Stepper
  - `src/components/Results/` — SettingCard, ExplanationBlock, ExportBar
  - `src/lib/geometry.ts` — analysis helpers
  - `src/lib/ai.ts` — OpenAI client + prompt + schema
  - `src/lib/printers.ts`, `materials.ts`, `plates.ts` — static catalogs
  - `src/store/wizard.ts` — zustand store

## Out of scope (v1)

- Actually generating a sliced `.3mf` file (we export notes only)
- Account system / saving past analyses
- Multi-object plates
