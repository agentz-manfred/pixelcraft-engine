/**
 * Renderer Tests — SVG output, GIF edge cases, PNG checks
 */

import { describe, it, expect } from "vitest";
import { PixelSprite } from "../../src/core/PixelSprite.js";
import { Animation } from "../../src/core/Animation.js";
import { encodeGIF, encodeAnimatedGIF } from "../../src/renderers/GIFRenderer.js";
import { TRANSPARENT } from "../../src/utils/color.js";

describe("SVG Renderer", () => {
  it("renders single-color sprite with one merged rect (optimized)", () => {
    const s = PixelSprite.create({ width: 4, height: 4, fill: "#ff0000" });
    const svg = s.toSVG({ pixelSize: 1 });
    // 4 rows, each merged into 1 rect = 4 rects
    const rects = (svg.match(/<rect/g) || []).length;
    expect(rects).toBe(4);
  });

  it("renders single-color sprite with 16 rects (unoptimized)", () => {
    const s = PixelSprite.create({ width: 4, height: 4, fill: "#ff0000" });
    const svg = s.toSVG({ pixelSize: 1, optimize: false });
    const rects = (svg.match(/<rect/g) || []).length;
    expect(rects).toBe(16);
  });

  it("skips transparent pixels in SVG", () => {
    const s = PixelSprite.fromGrid({
      width: 3,
      height: 1,
      data: ["#ff0000", TRANSPARENT, "#00ff00"],
    });
    const svg = s.toSVG();
    // Two separate rects (red and green, gap between)
    const rects = (svg.match(/<rect/g) || []).length;
    expect(rects).toBe(2);
  });

  it("includes opacity for semi-transparent pixels", () => {
    const s = PixelSprite.fromGrid({
      width: 1,
      height: 1,
      data: ["#ff000080"],
    });
    const svg = s.toSVG();
    expect(svg).toContain('opacity="0.50"');
  });

  it("omits opacity for fully opaque pixels", () => {
    const s = PixelSprite.fromGrid({
      width: 1,
      height: 1,
      data: ["#ff0000"],
    });
    const svg = s.toSVG();
    expect(svg).not.toContain("opacity");
  });

  it("viewBox and dimensions are correct", () => {
    const s = PixelSprite.create({ width: 8, height: 4 });
    s.fill("#f00");
    const svg = s.toSVG({ pixelSize: 5 });
    expect(svg).toContain('width="40"');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('viewBox="0 0 40 20"');
  });
});

describe("GIF Renderer edge cases", () => {
  it("encodes very small animation (1×1, 2 frames)", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#f00"] }),
        PixelSprite.fromGrid({ width: 1, height: 1, data: ["#0f0"] }),
      ],
      fps: 10,
    });
    const gif = encodeAnimatedGIF(anim);
    expect(gif[0]).toBe(0x47);
    expect(gif[gif.length - 1]).toBe(0x3b);
  });

  it("encodes animation with many colors per frame", () => {
    // 16×16 with gradient
    const data: string[] = [];
    for (let i = 0; i < 256; i++) {
      data.push(`#${i.toString(16).padStart(2, "0")}0000`);
    }
    const frame1 = PixelSprite.fromGrid({ width: 16, height: 16, data });
    const data2 = data.map(c => c.replace(/00$/, "ff"));
    const frame2 = PixelSprite.fromGrid({ width: 16, height: 16, data: data2 });
    const anim = new Animation({ frames: [frame1, frame2], fps: 2 });
    const gif = encodeAnimatedGIF(anim);
    expect(gif[0]).toBe(0x47);
  });

  it("single frame GIF has no NETSCAPE extension", () => {
    const s = PixelSprite.create({ width: 2, height: 2, fill: "#ff0000" });
    const gif = encodeGIF(s);
    const str = String.fromCharCode(...gif);
    expect(str).not.toContain("NETSCAPE");
  });

  it("animated GIF has NETSCAPE extension", () => {
    const anim = new Animation({
      frames: [
        PixelSprite.create({ width: 2, height: 2, fill: "#f00" }),
        PixelSprite.create({ width: 2, height: 2, fill: "#0f0" }),
      ],
      fps: 2,
    });
    const gif = encodeAnimatedGIF(anim);
    const str = String.fromCharCode(...gif.slice(0, 200));
    expect(str).toContain("NETSCAPE");
  });

  it("GIF with scale produces correct dimensions", () => {
    const s = PixelSprite.create({ width: 3, height: 5, fill: "#f00" });
    const gif = encodeGIF(s, { scale: 3 });
    const w = gif[6] | (gif[7] << 8);
    const h = gif[8] | (gif[9] << 8);
    expect(w).toBe(9);
    expect(h).toBe(15);
  });
});
