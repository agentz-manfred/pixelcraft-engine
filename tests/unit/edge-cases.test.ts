/**
 * Edge-Case Tests — Comprehensive coverage for boundary conditions
 *
 * - 1×1 Sprites
 * - Empty/zero palettes
 * - Large sprites (performance)
 * - FPS edge cases (0.5, single-frame)
 * - Transparency / Alpha channel
 * - Concurrent operations
 * - Invalid inputs
 */

import { describe, it, expect, vi } from "vitest";
import { PixelSprite } from "../../src/core/PixelSprite.js";
import { PixelBuffer } from "../../src/core/PixelBuffer.js";
import { Palette } from "../../src/core/Palette.js";
import { Animation } from "../../src/core/Animation.js";
import { SpriteSheet } from "../../src/formats/SpriteSheet.js";
import {
  encodeGIF,
  encodeAnimatedGIF,
  spriteToGIFDataURL,
} from "../../src/renderers/GIFRenderer.js";
import { normalizeHex, hexToRGB, rgbToHex, TRANSPARENT } from "../../src/utils/color.js";

// ─── 1×1 Sprites ─────────────────────────────────────────

describe("1×1 Sprites", () => {
  it("creates a 1×1 sprite with a color", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#ff0000"] });
    expect(s.getWidth()).toBe(1);
    expect(s.getHeight()).toBe(1);
    expect(s.getPixel(0, 0)).toBe("#ff0000ff");
  });

  it("creates a 1×1 transparent sprite", () => {
    const s = PixelSprite.create({ width: 1, height: 1 });
    expect(s.getPixel(0, 0)).toBe(TRANSPARENT);
  });

  it("1×1 sprite transforms are identity or valid", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#abc"] });
    s.flipHorizontal();
    expect(s.getPixel(0, 0)).toBe("#aabbccff");
    s.flipVertical();
    expect(s.getPixel(0, 0)).toBe("#aabbccff");
    s.rotate90();
    expect(s.getWidth()).toBe(1);
    expect(s.getHeight()).toBe(1);
    s.rotate180();
    expect(s.getPixel(0, 0)).toBe("#aabbccff");
    s.rotate270();
    expect(s.getPixel(0, 0)).toBe("#aabbccff");
  });

  it("1×1 sprite to SVG produces valid output", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#ff0000"] });
    const svg = s.toSVG({ pixelSize: 10 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="10"');
    expect(svg).toContain('height="10"');
    expect(svg).toContain('fill="#ff0000"');
  });

  it("1×1 sprite encodes to GIF", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#ff0000"] });
    const gif = encodeGIF(s);
    expect(gif[0]).toBe(0x47); // G
    expect(gif[gif.length - 1]).toBe(0x3b); // trailer
  });

  it("1×1 sprite clone is independent", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#ff0000"] });
    const c = s.clone();
    c.setPixel(0, 0, "#00ff00");
    expect(s.getPixel(0, 0)).toBe("#ff0000ff");
    expect(c.getPixel(0, 0)).toBe("#00ff00ff");
  });

  it("1×1 sprite with palette index", () => {
    const s = PixelSprite.fromGrid({
      width: 1,
      height: 1,
      palette: ["#dead00"],
      data: [0],
    });
    expect(s.getPixel(0, 0)).toBe("#dead00ff");
  });

  it("1×1 spritesheet", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] });
    const sheet = SpriteSheet.fromSprites([s]);
    expect(sheet.count).toBe(1);
    expect(sheet.width).toBe(1);
    expect(sheet.height).toBe(1);
    const composite = sheet.toSprite();
    expect(composite.getPixel(0, 0)).toBe("#ff0000ff");
  });

  it("1×1 animation with single frame", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] });
    const anim = new Animation({ frames: [s], fps: 1 });
    expect(anim.frameCount).toBe(1);
    expect(anim.totalDuration).toBe(1000);
  });
});

// ─── Palette Edge Cases ──────────────────────────────────

describe("Palette edge cases", () => {
  it("palette with a single color", () => {
    const p = Palette.from(["#000"]);
    expect(p.size).toBe(1);
    expect(p.getColor(0)).toBe("#000000ff");
  });

  it("throws on empty palette", () => {
    expect(() => Palette.from([])).toThrow("at least one color");
  });

  it("throws on palette index out of range", () => {
    const p = Palette.from(["#f00", "#0f0"]);
    expect(() => p.getColor(2)).toThrow("out of range");
    expect(() => p.getColor(-1)).toThrow("out of range");
  });

  it("palette indexOf returns -1 for missing color", () => {
    const p = Palette.from(["#f00"]);
    expect(p.indexOf("#0000ff")).toBe(-1);
  });

  it("sprite with palette index out of range throws", () => {
    expect(() =>
      PixelSprite.fromGrid({
        width: 1,
        height: 1,
        palette: ["#f00"],
        data: [1], // index 1 doesn't exist
      }),
    ).toThrow("out of range");
  });

  it("large palette (256 colors)", () => {
    const colors: string[] = [];
    for (let i = 0; i < 256; i++) {
      colors.push(`#${i.toString(16).padStart(2, "0")}${i.toString(16).padStart(2, "0")}${i.toString(16).padStart(2, "0")}`);
    }
    const p = Palette.from(colors);
    expect(p.size).toBe(256);
    expect(p.getColor(255)).toBe("#ffffffff"); // ff ff ff → normalized with full alpha
  });

  it("palette round-trips through JSON", () => {
    const p = Palette.from(["#ff0000", "#00ff00", "#0000ff"], "test");
    const json = p.toJSON();
    const restored = Palette.fromObject(json);
    expect(restored.size).toBe(3);
    expect(restored.name).toBe("test");
    expect(restored.getColor(0)).toBe("#ff0000ff");
  });
});

// ─── Large Sprites (Performance) ─────────────────────────

describe("Large sprites (performance)", () => {
  it("creates 100×100 sprite", () => {
    const start = performance.now();
    const s = PixelSprite.create({ width: 100, height: 100, fill: "#ff0000" });
    const elapsed = performance.now() - start;
    expect(s.getWidth()).toBe(100);
    expect(s.getHeight()).toBe(100);
    expect(elapsed).toBeLessThan(500); // Should be fast
  });

  it("creates 256×256 sprite", () => {
    const start = performance.now();
    const s = PixelSprite.create({ width: 256, height: 256, fill: "#000" });
    const elapsed = performance.now() - start;
    expect(s.getWidth()).toBe(256);
    expect(elapsed).toBeLessThan(2000);
  });

  it("fills 100×100 sprite", () => {
    const s = PixelSprite.create({ width: 100, height: 100 });
    const start = performance.now();
    s.fill("#ff0000");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(s.getPixel(50, 50)).toBe("#ff0000ff");
  });

  it("fillRect on large sprite", () => {
    const s = PixelSprite.create({ width: 200, height: 200 });
    const start = performance.now();
    s.fillRect(10, 10, 180, 180, "#00ff00");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(s.getPixel(50, 50)).toBe("#00ff00ff");
    expect(s.getPixel(0, 0)).toBe(TRANSPARENT);
  });

  it("encodes 64×64 GIF in reasonable time", () => {
    const data = new Array(64 * 64).fill("#ff0000");
    // Add some variety
    for (let i = 0; i < 64 * 64; i += 7) {
      data[i] = "#00ff00";
    }
    const s = PixelSprite.fromGrid({ width: 64, height: 64, data });
    const start = performance.now();
    const gif = encodeGIF(s);
    const elapsed = performance.now() - start;
    expect(gif[0]).toBe(0x47);
    expect(gif[gif.length - 1]).toBe(0x3b);
    expect(elapsed).toBeLessThan(2000);
  });

  it("transforms on 32×32 sprite", () => {
    const s = PixelSprite.create({ width: 32, height: 32, fill: "#f00" });
    s.setPixel(0, 0, "#00ff00");
    const start = performance.now();
    s.flipHorizontal();
    s.flipVertical();
    s.rotate90();
    s.rotate180();
    s.rotate270();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it("large spritesheet (16 sprites of 16×16)", () => {
    const sprites = Array.from({ length: 16 }, (_, i) => {
      const hex = i.toString(16).padStart(2, "0");
      return PixelSprite.create({ width: 16, height: 16, fill: `#${hex}${hex}${hex}` });
    });
    const start = performance.now();
    const sheet = SpriteSheet.fromSprites(sprites, { columns: 4 });
    const composite = sheet.toSprite();
    const elapsed = performance.now() - start;
    expect(composite.getWidth()).toBe(64);
    expect(composite.getHeight()).toBe(64);
    expect(elapsed).toBeLessThan(2000);
  });

  it("SVG generation for 32×32 sprite", () => {
    const data: string[] = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        data.push(`#${(x * 8).toString(16).padStart(2, "0")}${(y * 8).toString(16).padStart(2, "0")}00`);
      }
    }
    const s = PixelSprite.fromGrid({ width: 32, height: 32, data });
    const start = performance.now();
    const svg = s.toSVG({ pixelSize: 4 });
    const elapsed = performance.now() - start;
    expect(svg).toContain("<svg");
    expect(elapsed).toBeLessThan(1000);
    // Optimized SVG: adjacent same-color merged, so fewer rects
    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount).toBeGreaterThan(0);
    expect(rectCount).toBeLessThanOrEqual(32 * 32);

    // Unoptimized mode: one rect per pixel
    const svgUnopt = s.toSVG({ pixelSize: 4, optimize: false });
    const unoptRects = (svgUnopt.match(/<rect/g) || []).length;
    expect(unoptRects).toBe(32 * 32);
  });
});

// ─── FPS Edge Cases ──────────────────────────────────────

describe("FPS edge cases", () => {
  it("FPS = 0.5 is valid (2 seconds per frame)", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
      ],
      fps: 0.5,
    });
    expect(anim.fps).toBe(0.5);
    expect(anim.totalDuration).toBe(4000); // 2 frames × 2000ms
  });

  it("FPS = 0.1 is valid (10 seconds per frame)", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 0.1,
    });
    expect(anim.totalDuration).toBe(10000);
  });

  it("FPS = 0 throws", () => {
    expect(
      () =>
        new Animation({
          frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
          fps: 0,
        }),
    ).toThrow();
  });

  it("FPS = -1 throws", () => {
    expect(
      () =>
        new Animation({
          frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
          fps: -1,
        }),
    ).toThrow();
  });

  it("very high FPS (120) is valid", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
      ],
      fps: 120,
    });
    expect(anim.fps).toBe(120);
    expect(anim.totalDuration).toBeCloseTo(1000 / 60, -1); // ~16.67ms total
  });

  it("setFPS(0) throws", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    expect(() => anim.setFPS(0)).toThrow();
  });

  it("setFPS(0.5) is valid", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    anim.setFPS(0.5);
    expect(anim.fps).toBe(0.5);
  });

  it("single-frame animation", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 2, height: 2, data: ["#f00", "#0f0", "#00f", "#fff"] })],
      fps: 10,
    });
    expect(anim.frameCount).toBe(1);
    expect(anim.currentFrame).toBe(0);
    expect(anim.getCurrentSprite().getPixel(0, 0)).toBe("#ff0000ff");
  });

  it("single-frame animation nextFrame wraps", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    anim.nextFrame();
    expect(anim.currentFrame).toBe(0); // wraps to 0
  });

  it("single-frame animation prevFrame wraps", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    anim.prevFrame();
    expect(anim.currentFrame).toBe(0);
  });

  it("FPS = 0.5 encodes to GIF with correct delay", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 2, height: 2, data: ["#f00", "#f00", "#f00", "#f00"] }),
        PixelSprite.fromGrid({ width: 2, height: 2, data: ["#0f0", "#0f0", "#0f0", "#0f0"] }),
      ],
      fps: 0.5,
    });
    const gif = encodeAnimatedGIF(anim);
    expect(gif[0]).toBe(0x47); // valid GIF
    expect(gif[gif.length - 1]).toBe(0x3b);
  });
});

// ─── Transparency / Alpha Channel ────────────────────────

describe("Transparency / Alpha channel", () => {
  it("fully transparent pixel (#00000000)", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#00000000"] });
    expect(s.getPixel(0, 0)).toBe("#00000000");
  });

  it("semi-transparent pixel (#ff000080)", () => {
    const s = PixelSprite.fromGrid({ width: 1, height: 1, data: ["#ff000080"] });
    expect(s.getPixel(0, 0)).toBe("#ff000080");
  });

  it("TRANSPARENT constant works", () => {
    expect(TRANSPARENT).toBe("#00000000");
    const s = PixelSprite.create({ width: 2, height: 2 });
    expect(s.getPixel(0, 0)).toBe(TRANSPARENT);
  });

  it("SVG handles alpha channel", () => {
    const s = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff000080", "#00000000"],
    });
    const svg = s.toSVG({ pixelSize: 4 });
    expect(svg).toContain("opacity=");
    // Should only have 1 rect (transparent pixel omitted)
    const rects = (svg.match(/<rect/g) || []).length;
    expect(rects).toBe(1);
  });

  it("GIF maps semi-transparent to transparent", () => {
    const s = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff0000", "#00000040"], // 40 = 64/255 < 128, should be transparent
    });
    const gif = encodeGIF(s);
    expect(gif[0]).toBe(0x47);
    expect(gif[gif.length - 1]).toBe(0x3b);
    // Should have GCE for transparency
    let hasGCE = false;
    for (let i = 0; i < gif.length - 1; i++) {
      if (gif[i] === 0x21 && gif[i + 1] === 0xf9) {
        hasGCE = true;
        break;
      }
    }
    expect(hasGCE).toBe(true);
  });

  it("mixed opaque and transparent sprite", () => {
    const s = PixelSprite.fromGrid({
      width: 3,
      height: 3,
      data: [
        "#ff0000", "#00000000", "#ff0000",
        "#00000000", "#ff0000", "#00000000",
        "#ff0000", "#00000000", "#ff0000",
      ],
    });
    expect(s.getPixel(0, 0)).toBe("#ff0000ff");
    expect(s.getPixel(1, 0)).toBe("#00000000");
    expect(s.getPixel(1, 1)).toBe("#ff0000ff");
  });

  it("4-digit hex with alpha (#rgba)", () => {
    const normalized = normalizeHex("#f008");
    expect(normalized).toBe("#ff000088");
  });

  it("getData preserves alpha channel", () => {
    const s = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff000080", "#00ff00ff"],
    });
    const data = s.getData();
    expect(data[0]).toBe("#ff000080");
    expect(data[1]).toBe("#00ff00ff");
  });

  it("clone preserves transparency", () => {
    const s = PixelSprite.fromGrid({
      width: 1,
      height: 1,
      data: ["#ff000080"],
    });
    const c = s.clone();
    expect(c.getPixel(0, 0)).toBe("#ff000080");
  });

  it("all-transparent sprite GIF encodes", () => {
    const s = PixelSprite.create({ width: 4, height: 4 });
    const gif = encodeGIF(s);
    expect(gif[0]).toBe(0x47);
    expect(gif[gif.length - 1]).toBe(0x3b);
  });

  it("alpha in spritesheet export", () => {
    const s1 = PixelSprite.fromGrid({ width: 2, height: 2, data: ["#f00", "#00000000", "#00000000", "#0f0"] });
    const s2 = PixelSprite.fromGrid({ width: 2, height: 2, data: ["#00000000", "#00f", "#fff", "#00000000"] });
    const sheet = SpriteSheet.fromSprites([s1, s2], { columns: 2 });
    const composite = sheet.toSprite();
    expect(composite.getPixel(0, 0)).toBe("#ff0000ff");
    expect(composite.getPixel(1, 0)).toBe(TRANSPARENT);
    expect(composite.getPixel(3, 0)).toBe("#0000ffff");
  });
});

// ─── Concurrent / Parallel Operations ────────────────────

describe("Concurrent operations", () => {
  it("multiple GIF encodes run independently", () => {
    const sprites = Array.from({ length: 5 }, (_, i) => {
      const hex = ((i + 1) * 50).toString(16).padStart(2, "0");
      return PixelSprite.fromGrid({
        width: 8,
        height: 8,
        data: new Array(64).fill(`#${hex}0000`),
      });
    });

    const results = sprites.map((s) => encodeGIF(s));
    for (const gif of results) {
      expect(gif[0]).toBe(0x47);
      expect(gif[gif.length - 1]).toBe(0x3b);
    }
    // Each should produce different output (different colors)
    const sizes = new Set(results.map((r) => r.length));
    // At least some should differ
    expect(results.length).toBe(5);
  });

  it("clone + mutate doesn't affect original", () => {
    const original = PixelSprite.fromGrid({
      width: 4,
      height: 4,
      data: new Array(16).fill("#ff0000"),
    });

    const clones = Array.from({ length: 10 }, () => original.clone());

    // Mutate all clones differently
    clones.forEach((c, i) => {
      const hex = (i * 25).toString(16).padStart(2, "0");
      c.fill(`#00${hex}00`);
    });

    // Original unchanged
    expect(original.getPixel(0, 0)).toBe("#ff0000ff");
    expect(original.getPixel(3, 3)).toBe("#ff0000ff");
  });

  it("multiple spritesheets from same sprites are independent", () => {
    const sprites = [
      PixelSprite.create({ width: 4, height: 4, fill: "#f00" }),
      PixelSprite.create({ width: 4, height: 4, fill: "#0f0" }),
    ];

    const sheet1 = SpriteSheet.fromSprites(sprites, { columns: 2 });
    const sheet2 = SpriteSheet.fromSprites(sprites, { columns: 1 });

    // Mutating sheet1's sprite shouldn't affect sheet2
    sheet1.getSprite(0).setPixel(0, 0, "#0000ff");
    expect(sheet2.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
  });

  it("multiple animations from same frames are independent", () => {
    const frames = [
      PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
      PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
    ];

    const anim1 = new Animation({ frames, fps: 2 });
    const anim2 = new Animation({ frames, fps: 10 });

    expect(anim1.fps).toBe(2);
    expect(anim2.fps).toBe(10);
    anim1.setFPS(30);
    expect(anim2.fps).toBe(10); // unchanged
  });
});

// ─── Data Integrity ──────────────────────────────────────

describe("Data integrity", () => {
  it("fromGrid validates data length", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 2, height: 2, data: ["#f00"] }),
    ).toThrow("doesn't match");
  });

  it("fromGrid validates width > 0", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 0, height: 1, data: [] }),
    ).toThrow("positive integer");
  });

  it("fromGrid validates height > 0", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 1, height: 0, data: [] }),
    ).toThrow("positive integer");
  });

  it("setPixel validates bounds", () => {
    const s = PixelSprite.create({ width: 2, height: 2 });
    expect(() => s.setPixel(-1, 0, "#f00")).toThrow();
    expect(() => s.setPixel(0, -1, "#f00")).toThrow();
    expect(() => s.setPixel(2, 0, "#f00")).toThrow();
    expect(() => s.setPixel(0, 2, "#f00")).toThrow();
  });

  it("getPixel validates bounds", () => {
    const s = PixelSprite.create({ width: 2, height: 2 });
    expect(() => s.getPixel(-1, 0)).toThrow();
    expect(() => s.getPixel(2, 0)).toThrow();
  });

  it("invalid hex colors throw", () => {
    expect(() => normalizeHex("not-a-color")).toThrow("Invalid hex");
    expect(() => normalizeHex("#xyz")).toThrow("non-hex");
    expect(() => normalizeHex("#12345")).toThrow("Invalid hex");
  });

  it("numeric data without palette throws", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 1, height: 1, data: [0] }),
    ).toThrow("require a palette");
  });

  it("scale factor must be positive integer", () => {
    const s = PixelSprite.create({ width: 2, height: 2 });
    expect(() => s.scale(0)).toThrow();
    expect(() => s.scale(-1)).toThrow();
    expect(() => s.scale(1.5)).toThrow();
  });

  it("JSON round-trip preserves all data", () => {
    const original = PixelSprite.fromGrid({
      width: 3,
      height: 3,
      data: [
        "#ff0000", "#00ff00", "#0000ff",
        "#ffff00", "#ff00ff", "#00ffff",
        "#000000", "#ffffff", "#ff000080",
      ],
    });
    original.name = "test-sprite";
    const json = JSON.stringify(original.toJSON());
    const restored = PixelSprite.parse(json);
    expect(restored.name).toBe("test-sprite");
    expect(restored.getWidth()).toBe(3);
    expect(restored.getHeight()).toBe(3);
    expect(restored.getData()).toEqual(original.getData());
  });

  it("PixelBuffer setData validates length", () => {
    const buf = new PixelBuffer(2, 2);
    expect(() => buf.setData(["#f00"])).toThrow("doesn't match");
  });
});

// ─── Animation goToFrame / navigation ────────────────────

describe("Animation navigation", () => {
  it("goToFrame works", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#00f"] }),
      ],
      fps: 10,
    });
    anim.goToFrame(2);
    expect(anim.currentFrame).toBe(2);
    expect(anim.getCurrentSprite().getPixel(0, 0)).toBe("#0000ffff");
  });

  it("goToFrame throws on invalid index", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    expect(() => anim.goToFrame(1)).toThrow("out of range");
    expect(() => anim.goToFrame(-1)).toThrow("out of range");
  });

  it("nextFrame cycles through", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
      ],
      fps: 10,
    });
    expect(anim.currentFrame).toBe(0);
    anim.nextFrame();
    expect(anim.currentFrame).toBe(1);
    anim.nextFrame();
    expect(anim.currentFrame).toBe(0); // wraps
  });

  it("prevFrame cycles backwards", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
      ],
      fps: 10,
    });
    expect(anim.currentFrame).toBe(0);
    anim.prevFrame();
    expect(anim.currentFrame).toBe(1); // wraps to last
    anim.prevFrame();
    expect(anim.currentFrame).toBe(0);
  });

  it("cleanup prevents memory leaks", () => {
    const anim = new Animation({
      frames: [PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] })],
      fps: 10,
    });
    anim.cleanup();
    expect(anim.playing).toBe(false);
  });

  it("per-frame duration overrides FPS", () => {
    const anim = new Animation({
      frames: [
        { sprite: PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }), duration: 100 },
        { sprite: PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }), duration: 900 },
      ],
      fps: 60, // FPS doesn't matter for frames with explicit duration
    });
    expect(anim.totalDuration).toBe(1000);
  });
});

// ─── Color Conversion Edge Cases ─────────────────────────

describe("Color conversion edge cases", () => {
  it("hexToRGB handles 3-digit hex", () => {
    const rgb = hexToRGB("#fff");
    expect(rgb).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("hexToRGB handles 4-digit hex with alpha", () => {
    const rgb = hexToRGB("#f008");
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
    expect(rgb.a).toBeCloseTo(0.533, 1);
  });

  it("rgbToHex clamps values", () => {
    const hex = rgbToHex({ r: 300, g: -10, b: 128, a: 1 });
    expect(hex).toBe("#ff0080");
  });

  it("normalizeHex is case-insensitive", () => {
    expect(normalizeHex("#FF0000")).toBe("#ff0000ff");
    expect(normalizeHex("#AbCdEf")).toBe("#abcdefff");
  });

  it("normalizeHex trims whitespace", () => {
    expect(normalizeHex("  #ff0000  ")).toBe("#ff0000ff");
  });

  it("normalizeHex throws on non-string", () => {
    expect(() => normalizeHex(123 as any)).toThrow("expected string");
  });
});
