# 🎨 PixelCraft Engine

Lightweight, zero-dependency pixel art engine for the browser. Create sprites, animate them, manipulate individual pixels, and render to Canvas, PNG, SVG, or GIF — all with a few lines of code.

## Features

- 🖼️ **Sprites** — Define pixel art with palette indices or direct hex colors
- 🎨 **Palettes** — Built-in presets (GameBoy, NES, Grayscale) or custom palettes from JSON
- 🔄 **Animations** — Frame-based with configurable FPS and per-frame duration
- 🖥️ **Canvas Rendering** — Live rendering with scaling and grid overlay
- 📄 **PNG Export** — Single-frame export as Blob or DataURL
- 🔷 **SVG Export** — Scalable vector output
- 🎬 **GIF Export** — Animated GIF encoding (coming soon)
- 🔧 **Pixel Manipulation** — get/set/fill individual pixels or regions
- ↔️ **Transforms** — Flip, rotate, scale (nearest-neighbor)
- ⚛️ **React Components** — Optional `<PixelSpriteView>` and `<AnimationView>`
- 📦 **Zero Dependencies** — Core engine has no external deps
- 📋 **JSON Format** — Load/save sprites and animations as JSON

## Install

```bash
npm install pixelcraft-engine
```

## Quick Start

### Create a Sprite with Palette Indices

```typescript
import { PixelSprite } from "pixelcraft-engine";

const sprite = PixelSprite.fromGrid({
  width: 4,
  height: 4,
  palette: ["#000000", "#ffffff", "#ff0000"],
  data: [
    0, 1, 0, 1,
    1, 0, 1, 0,
    0, 2, 0, 2,
    2, 0, 2, 0,
  ],
});

// Render to canvas at 8x scale
const canvas = document.querySelector("canvas")!;
sprite.renderToCanvas(canvas, { scale: 8 });
```

### Create a Sprite with Direct Hex Colors

```typescript
const sprite = PixelSprite.fromGrid({
  width: 2,
  height: 2,
  data: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
});
```

### Create an Empty Sprite

```typescript
const sprite = PixelSprite.create({ width: 16, height: 16, fill: "#1a1c2c" });
sprite.setPixel(8, 8, "#ff0000"); // Set a single pixel
```

### Load from JSON

```typescript
const sprite = PixelSprite.parse(`{
  "name": "heart",
  "width": 5,
  "height": 5,
  "palette": ["#000000", "#ff0000"],
  "data": [0,1,0,1,0, 1,1,1,1,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0]
}`);
```

## Pixel Manipulation

```typescript
sprite.getPixel(0, 0);              // → "#ff0000ff"
sprite.setPixel(0, 0, "#00ff00");   // Set single pixel
sprite.fill("#000000");              // Fill entire sprite
sprite.fillRect(2, 2, 4, 4, "#f00"); // Fill rectangle
```

## Transforms

All transforms are chainable:

```typescript
sprite
  .flipHorizontal()
  .rotate90()
  .scale(2);
```

Available transforms:
- `flipHorizontal()` / `flipVertical()`
- `rotate90()` / `rotate180()` / `rotate270()`
- `scale(factor)` — Integer nearest-neighbor scaling

## Palettes

### Built-in Presets

```typescript
import { Palette } from "pixelcraft-engine";

Palette.presets.gameboy;      // 4 classic green shades
Palette.presets.nes;          // 16-color NES palette
Palette.presets.grayscale;    // 12 grays, black to white
Palette.presets.bueroRoyale;  // 16-color custom palette
```

### Custom Palette

```typescript
const palette = Palette.from(["#1a1c2c", "#5d275d", "#b13e53", "#ef7d57"]);
```

### Load from JSON

```json
{
  "name": "my-palette",
  "colors": ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff"]
}
```

```typescript
const palette = Palette.fromObject(paletteJson);
```

### Remap Colors

```typescript
// Replace all red with blue
sprite.remapColor("#ff0000", "#0000ff");

// Apply entirely new palette
sprite.applyPalette(Palette.presets.gameboy);
```

## Animations

### Basic Animation

```typescript
import { Animation } from "pixelcraft-engine";

const frame1 = PixelSprite.fromGrid({ width: 4, height: 4, palette: ["#000", "#fff"], data: [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0] });
const frame2 = PixelSprite.fromGrid({ width: 4, height: 4, palette: ["#000", "#fff"], data: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1] });

const anim = new Animation({
  frames: [frame1, frame2],
  fps: 2,      // 2 frames per second → animation loops every 1s
  loop: true,
});

anim.play(canvas, { scale: 8 });
```

### Per-Frame Duration

```typescript
const anim = new Animation({
  frames: [
    { sprite: frame1, duration: 500 },   // 500ms
    { sprite: frame2, duration: 1000 },  // 1000ms
    { sprite: frame3, duration: 200 },   // 200ms
  ],
  loop: true,
});
```

### Playback Control

```typescript
anim.play(canvas, { scale: 4 });
anim.pause();
anim.resume();
anim.stop();
anim.nextFrame();
anim.prevFrame();
anim.goToFrame(2);

// Properties
anim.currentFrame;   // → 0
anim.totalDuration;  // → 1700 (ms)
anim.playing;        // → true/false

// Cleanup (important! prevents memory leaks)
anim.cleanup();
```

### Load Animation from JSON

```typescript
import { animationFromJSON } from "pixelcraft-engine";

const anim = animationFromJSON(`{
  "width": 4,
  "height": 4,
  "palette": ["#000", "#fff"],
  "fps": 2,
  "frames": [
    { "data": [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0] },
    { "data": [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1] }
  ]
}`);
```

## Rendering Targets

### Canvas (Live)
```typescript
sprite.renderToCanvas(canvas, { scale: 4 });
```

### PNG
```typescript
const blob = await sprite.toPNG({ scale: 4 });
const dataUrl = await sprite.toPNGDataURL({ scale: 4 });
```

### SVG
```typescript
const svgString = sprite.toSVG({ pixelSize: 4 });
document.body.innerHTML = svgString;
```

### Advanced Canvas (with grid)
```typescript
import { renderToCanvas } from "pixelcraft-engine";

renderToCanvas(sprite, canvas, {
  scale: 16,
  background: "#2a2a2a",
  gridLines: true,
  gridColor: "#444",
});
```

## React Integration

```tsx
import { PixelSpriteView, AnimationView } from "pixelcraft-engine/react";

// Static sprite
<PixelSpriteView sprite={mySprite} scale={4} />

// Animated
<AnimationView animation={myAnimation} scale={4} autoPlay />
```

## JSON Format Specification

### Sprite JSON

```json
{
  "name": "character-idle",
  "width": 16,
  "height": 16,
  "palette": ["#1a1c2c", "#5d275d", "#b13e53", "#ef7d57"],
  "data": [0, 0, 1, 1, 1, 1, 0, 0, "..."]
}
```

- `palette` is optional — if omitted, `data` must contain hex strings
- `data` can mix numbers (palette indices) and strings (hex colors) when palette is defined

### Animation JSON

```json
{
  "name": "walk-cycle",
  "width": 16,
  "height": 16,
  "palette": ["#000", "#fff", "#f00"],
  "fps": 8,
  "loop": true,
  "frames": [
    { "data": [0, 1, 0, "..."], "duration": 125 },
    { "data": [1, 0, 1, "..."] }
  ]
}
```

- `fps` default: 10
- Per-frame `duration` (ms) overrides global FPS for that frame
- `loop` default: true

### Palette JSON

```json
{
  "name": "my-palette",
  "colors": ["#1a1c2c", "#5d275d", "#b13e53"]
}
```

## Hex Color Formats

All these are valid:
- `#RGB` → `#RRGGBB` (e.g. `#f00` → `#ff0000`)
- `#RGBA` → `#RRGGBBAA` (e.g. `#f00f` → `#ff0000ff`)
- `#RRGGBB` (e.g. `#ff0000`)
- `#RRGGBBAA` (e.g. `#ff000080` for 50% transparent red)

## Color Utilities

```typescript
import { hexToRGB, rgbToHex, hexToHSL, normalizeHex, isValidHex } from "pixelcraft-engine";

hexToRGB("#ff0000");    // → { r: 255, g: 0, b: 0, a: 1 }
rgbToHex({ r: 255, g: 0, b: 0, a: 1 }); // → "#ff0000"
hexToHSL("#ff0000");    // → { h: 0, s: 100, l: 50, a: 1 }
normalizeHex("#f00");   // → "#ff0000ff"
isValidHex("#xyz");     // → false
```

## Development

```bash
# Install
npm install

# Dev server (playground)
npm run playground

# Run tests
npm test

# Build library
npm run build

# Visual tests (Playwright)
npm run test:visual
```

## Tech Stack

- **TypeScript** — Full type safety
- **Vite** — Library mode bundling (ESM + CJS)
- **Vitest** — Unit testing
- **Playwright** — Visual regression testing

## License

MIT — AgentZ
