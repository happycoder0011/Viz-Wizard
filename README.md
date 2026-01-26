# Viz-Wizard

> Understand any repository in 30 seconds.

A beautiful 3D visualization platform that transforms codebases into navigable futuristic cities.

![Viz-Wizard Preview](docs/preview.png)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **3D Engine:** React Three Fiber + Three.js
- **Helpers:** @react-three/drei, @react-three/postprocessing
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **State:** Zustand

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main visualization page
│
├── components/
│   ├── canvas/             # 3D components (R3F)
│   │   ├── Building.tsx    # Individual file representation
│   │   ├── City.tsx        # Main city layout
│   │   ├── Connections.tsx # Import roads/beams
│   │   ├── District.tsx    # Directory grouping
│   │   ├── Scene.tsx       # R3F Canvas wrapper
│   │   └── CameraController.tsx
│   │
│   └── ui/                 # 2D UI overlays
│       ├── Header.tsx      # Repo info header
│       ├── Tooltip.tsx     # Hover tooltips
│       ├── ControlPanel.tsx
│       ├── Legend.tsx      # Color legend
│       ├── LoadingOverlay.tsx
│       └── SelectedBuildingPanel.tsx
│
├── lib/
│   └── mockData.ts         # Mock data generator
│
├── stores/
│   └── visualizationStore.ts  # Zustand state
│
└── types/
    └── repository.ts       # TypeScript types
```

## Visual Language

| Color | Meaning |
|-------|---------|
| 🔵 Cyan | Core logic (TypeScript) |
| 🟠 Amber | Legacy code (JavaScript) |
| 🟣 Purple | Styles & assets |
| 🟢 Green | Test files |
| ⚪ Gray | Configuration |

## Controls

| Action | Control |
|--------|---------|
| Rotate | Drag |
| Zoom | Scroll |
| Pan | Right-drag |
| Select | Click building |
| Reset | Use control panel |

## Features

- [x] 3D City visualization
- [x] Building height = Lines of Code
- [x] Color coding by file type
- [x] Post-processing bloom effect
- [x] Smooth camera animations
- [x] Hover tooltips
- [x] Selection panel
- [ ] Real GitHub integration
- [ ] Hierarchical zoom levels
- [ ] Timeline scrubber
- [ ] PR diff mode

## Development

### Adding a new view

1. Create component in `src/components/canvas/`
2. Add to `Scene.tsx`
3. Update store if needed

### Modifying colors

Edit `CATEGORY_COLORS` in `src/lib/mockData.ts`

### Adjusting post-processing

Modify `PostProcessing` component in `src/components/canvas/Scene.tsx`

## License

MIT
