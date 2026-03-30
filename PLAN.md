# PixelCraft Engine — Entwicklungsplan

## Vision
Lightweight, zero-dependency Pixel Art Engine als npm-Package. Sprites definieren, animieren, manipulieren und in verschiedene Formate rendern — mit wenigen Zeilen Code.

## Architektur

```
pixelcraft-engine/
├── src/
│   ├── core/
│   │   ├── PixelSprite.ts       # Haupt-Klasse: Sprite erstellen & manipulieren
│   │   ├── Palette.ts           # Farbpaletten (laden, definieren, validieren)
│   │   ├── Animation.ts         # Frame-Management, FPS, Timing
│   │   └── PixelBuffer.ts       # Raw Pixel-Daten, get/set/fill/transform
│   ├── renderers/
│   │   ├── CanvasRenderer.ts    # HTML5 Canvas (live, animiert)
│   │   ├── PNGRenderer.ts       # Einzelframe als PNG (via Canvas → Blob)
│   │   ├── GIFRenderer.ts       # Animiertes GIF (eigener Encoder, zero-dep)
│   │   └── SVGRenderer.ts       # Skalierbare Vektor-Ausgabe
│   ├── formats/
│   │   ├── SpriteSheet.ts       # Spritesheet Import/Export
│   │   └── JSONFormat.ts        # JSON-basiertes Sprite-Format (laden/speichern)
│   ├── react/
│   │   └── PixelSprite.tsx      # React-Component (optional)
│   ├── utils/
│   │   ├── color.ts             # Hex↔RGB↔HSL Konvertierung
│   │   ├── transform.ts         # Flip, Rotate, Scale (nearest-neighbor)
│   │   └── validation.ts        # Input-Validierung
│   └── index.ts                 # Public API Exports
├── tests/
│   ├── unit/                    # Vitest Unit Tests
│   │   ├── PixelSprite.test.ts
│   │   ├── Palette.test.ts
│   │   ├── Animation.test.ts
│   │   ├── PixelBuffer.test.ts
│   │   ├── renderers.test.ts
│   │   └── transforms.test.ts
│   └── visual/                  # Playwright Visual Tests
│       ├── render.spec.ts       # Canvas-Rendering visuell prüfen
│       ├── animation.spec.ts    # Animation-Timing testen
│       └── fixtures/            # Referenz-Screenshots
├── examples/
│   ├── basic.html               # Minimal-Beispiel (kein Build nötig)
│   ├── animation.html           # Animiertes Sprite
│   ├── react-demo/              # React-Integration Beispiel
│   └── gallery.html             # Sprite-Galerie mit verschiedenen Paletten
├── palettes/                    # Vorgefertigte Farbpaletten
│   ├── gameboy.json
│   ├── nes.json
│   ├── buero-royale.json
│   └── grayscale.json
├── docs/                        # Detaillierte Dokumentation
│   ├── api.md                   # Vollständige API-Referenz
│   ├── formats.md               # JSON-Format Spezifikation
│   ├── palettes.md              # Paletten-System Docs
│   └── examples.md              # Code-Beispiele mit Erklärungen
└── playground/                  # Dev-Server zum visuellen Testen
    ├── index.html
    └── playground.ts
```

## Phasen

### Phase 1 — Core Engine ✅ (Cron 1)
- [x] Projekt-Setup (Vite Library Mode, TypeScript, Vitest)
- [ ] `PixelBuffer` — Raw Pixel-Daten mit get/set/fill
- [ ] `Palette` — Farbpaletten laden (JSON, inline), Index↔Color Mapping
- [ ] `PixelSprite` — Haupt-API: fromGrid(), fromJSON(), Pixel-Manipulation
- [ ] `CanvasRenderer` — Rendern auf HTML5 Canvas mit Skalierung
- [ ] Unit Tests für alles oben
- [ ] Color Utilities (Hex↔RGB↔HSL)

### Phase 2 — Animation & Export (Cron 2)
- [ ] `Animation` — Frame-Array, FPS, Timing-Berechnung, play/pause/stop
- [ ] `PNGRenderer` — Canvas → PNG Blob/DataURL
- [ ] `SVGRenderer` — Pixel → SVG Rect-Elemente
- [ ] `GIFRenderer` — Eigener GIF89a Encoder (LZW, zero-dependency!)
- [ ] Animiertes Canvas-Rendering (requestAnimationFrame)
- [ ] Transform-Utilities (flipH, flipV, rotate90, scale)
- [ ] `SpriteSheet` — Import/Export von Spritesheets
- [ ] Unit Tests + erste visuelle Tests

### Phase 3 — Polish, Docs & React (Cron 3)
- [ ] `JSONFormat` — Sprites als JSON laden/speichern (mit Palette-Referenz)
- [ ] React-Component `<PixelSprite />`
- [ ] Vorgefertigte Paletten (GameBoy, NES, Büro Royale, Grayscale)
- [ ] Playground (Dev-Server mit Live-Editor)
- [ ] Beispiel-Dateien (basic.html, animation.html, gallery.html)
- [ ] Vollständige README mit Beispielen
- [ ] API-Dokumentation
- [ ] Playwright Visual Tests (Canvas-Output, Animation-Timing)
- [ ] npm-Package Konfiguration (exports, types, peer-deps)
- [ ] Edge Cases: 0x0 Sprites, riesige Sprites, ungültige Farben, leere Frames

## API Design

### Sprite erstellen
```typescript
// Mit Palette-Indizes
const sprite = PixelSprite.fromGrid({
  width: 4,
  height: 4,
  palette: ["#000", "#fff", "#f00"],
  data: [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0],
});

// Mit direkten Hex-Codes (keine Palette)
const sprite2 = PixelSprite.fromGrid({
  width: 2,
  height: 2,
  data: ["#ff0000","#00ff00","#0000ff","#ffffff"],
});

// Aus JSON-Datei
const sprite3 = await PixelSprite.fromJSON("./sprites/character.json");

// Leerer Sprite
const sprite4 = PixelSprite.create({ width: 16, height: 16 });
```

### Pixel manipulieren
```typescript
sprite.setPixel(0, 0, "#ff0000");
sprite.getPixel(0, 0); // → "#ff0000"
sprite.fill("#000000");
sprite.fillRect(2, 2, 4, 4, "#ff0000");
sprite.getWidth();  // → 4
sprite.getHeight(); // → 4
sprite.clone();     // Deep Copy
```

### Transformieren
```typescript
sprite.flipHorizontal();
sprite.flipVertical();
sprite.rotate90();
sprite.rotate180();
sprite.rotate270();
sprite.scale(2);        // 2x Nearest-Neighbor
sprite.scale(0.5);      // Downscale
```

### Animation
```typescript
const anim = new Animation({
  frames: [frame1, frame2, frame3],
  fps: 2,
});

anim.play(canvas);
anim.pause();
anim.stop();
anim.getCurrentFrame();  // → 0
anim.getTotalDuration(); // → 1500ms (3 frames / 2fps)
anim.setFPS(4);
```

### Rendern
```typescript
// Canvas (live)
sprite.renderToCanvas(canvasElement, { scale: 4 });

// PNG
const pngBlob = await sprite.toPNG({ scale: 4 });
const pngDataURL = await sprite.toPNGDataURL({ scale: 4 });

// SVG
const svgString = sprite.toSVG({ pixelSize: 4 });

// GIF (animiert)
const gifBlob = await animation.toGIF({ scale: 4 });
```

### Paletten
```typescript
// Inline
const palette = Palette.from(["#000", "#333", "#666", "#999", "#ccc", "#fff"]);

// Aus JSON
const palette = await Palette.fromJSON("./palettes/gameboy.json");

// Vorgefertigt
const palette = Palette.presets.gameboy;
const palette = Palette.presets.nes;

// Sprite mit Palette umfärben
sprite.applyPalette(newPalette);
sprite.remapColor("#old", "#new");
```

### JSON-Format
```json
{
  "name": "character-idle",
  "width": 16,
  "height": 16,
  "palette": "./palettes/buero-royale.json",
  "frames": [
    {
      "data": [0,0,1,1,1,1,0,0, "..."],
      "duration": 500
    },
    {
      "data": [0,0,1,1,1,1,0,0, "..."],
      "duration": 500
    }
  ]
}
```

## Edge Cases zu testen
- 0×0 Sprite → Error
- 1×1 Sprite → valider Einzelpixel
- Sehr große Sprites (1000×1000) → Performance
- Ungültige Hex-Codes → Error mit Message
- Palette-Index out of range → Error
- Leere Frames-Array → Error
- FPS = 0 → Error
- FPS = 0.5 → valide (1 Frame alle 2 Sekunden)
- Negative Koordinaten bei setPixel → Error
- Canvas nicht verfügbar (Node.js) → Graceful Fallback
- Transparenz (alpha Channel)
- Einzelframe-Animation → kein Looping nötig
- requestAnimationFrame in Background-Tab (gedrosselt!)
- Memory-Leak bei vielen Animationen → cleanup()
- Concurrent render calls
- JSON mit relativen Pfaden zu Paletten
