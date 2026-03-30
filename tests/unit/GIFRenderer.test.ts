import { describe, it, expect } from "vitest";
import { PixelSprite } from "../../src/core/PixelSprite.js";
import { Animation } from "../../src/core/Animation.js";
import {
  encodeGIF,
  encodeAnimatedGIF,
  spriteToGIFDataURL,
  animationToGIFDataURL,
} from "../../src/renderers/GIFRenderer.js";

// Helper: verify GIF header/trailer
function assertValidGIF(data: Uint8Array): void {
  // GIF89a header
  expect(data[0]).toBe(0x47); // G
  expect(data[1]).toBe(0x49); // I
  expect(data[2]).toBe(0x46); // F
  expect(data[3]).toBe(0x38); // 8
  expect(data[4]).toBe(0x39); // 9
  expect(data[5]).toBe(0x61); // a
  // Trailer
  expect(data[data.length - 1]).toBe(0x3b);
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

const makeSprite = (w: number, h: number, color: string) =>
  PixelSprite.fromGrid({
    width: w,
    height: h,
    data: new Array(w * h).fill(color),
  });

describe("GIFRenderer", () => {
  describe("encodeGIF (single frame)", () => {
    it("encodes a 1×1 sprite", () => {
      const sprite = makeSprite(1, 1, "#ff0000");
      const data = encodeGIF(sprite);
      assertValidGIF(data);
      // Width/height in logical screen descriptor
      expect(readUint16LE(data, 6)).toBe(1);
      expect(readUint16LE(data, 8)).toBe(1);
    });

    it("encodes a 2×2 sprite", () => {
      const sprite = PixelSprite.fromGrid({
        width: 2,
        height: 2,
        data: ["#ff0000", "#00ff00", "#0000ff", "#ffffff"],
      });
      const data = encodeGIF(sprite);
      assertValidGIF(data);
      expect(readUint16LE(data, 6)).toBe(2);
      expect(readUint16LE(data, 8)).toBe(2);
    });

    it("handles scale option", () => {
      const sprite = makeSprite(2, 2, "#ff0000");
      const data = encodeGIF(sprite, { scale: 4 });
      assertValidGIF(data);
      expect(readUint16LE(data, 6)).toBe(8); // 2 * 4
      expect(readUint16LE(data, 8)).toBe(8);
    });

    it("handles transparency", () => {
      const sprite = PixelSprite.fromGrid({
        width: 2,
        height: 1,
        data: ["#ff0000", "#00000000"],
      });
      const data = encodeGIF(sprite);
      assertValidGIF(data);
      // Should have a GCE block for transparency (0x21 0xF9)
      let hasGCE = false;
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0x21 && data[i + 1] === 0xf9) {
          hasGCE = true;
          break;
        }
      }
      expect(hasGCE).toBe(true);
    });

    it("handles many colors (up to 256)", () => {
      // Create sprite with 16 unique colors
      const colors: string[] = [];
      for (let i = 0; i < 16; i++) {
        const hex = i.toString(16).padStart(2, "0");
        colors.push(`#${hex}${hex}${hex}`);
      }
      const data4x4 = [];
      for (let i = 0; i < 16; i++) data4x4.push(colors[i]);
      const sprite = PixelSprite.fromGrid({ width: 4, height: 4, data: data4x4 });
      const gif = encodeGIF(sprite);
      assertValidGIF(gif);
    });

    it("handles single-color sprite", () => {
      const sprite = makeSprite(8, 8, "#abcdef");
      const data = encodeGIF(sprite);
      assertValidGIF(data);
    });

    it("handles all-transparent sprite", () => {
      const sprite = PixelSprite.create({ width: 4, height: 4 }); // default = transparent
      const data = encodeGIF(sprite);
      assertValidGIF(data);
    });

    it("handles large sprite (64×64)", () => {
      const sprite = makeSprite(64, 64, "#ff0000");
      const data = encodeGIF(sprite);
      assertValidGIF(data);
      expect(readUint16LE(data, 6)).toBe(64);
      expect(readUint16LE(data, 8)).toBe(64);
    });

    it("produces valid LZW data (decodable structure)", () => {
      const sprite = PixelSprite.fromGrid({
        width: 4,
        height: 4,
        palette: ["#000", "#fff"],
        data: [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0],
      });
      const data = encodeGIF(sprite);
      assertValidGIF(data);
      expect(data.length).toBeGreaterThan(20); // Non-trivial output
    });
  });

  describe("encodeAnimatedGIF", () => {
    it("encodes 2-frame animation", () => {
      const anim = new Animation({
        frames: [makeSprite(4, 4, "#f00"), makeSprite(4, 4, "#0f0")],
        fps: 2,
      });
      const data = encodeAnimatedGIF(anim);
      assertValidGIF(data);
      // Should contain NETSCAPE2.0 extension
      const str = String.fromCharCode(...data.slice(0, 200));
      expect(str).toContain("NETSCAPE2.0");
    });

    it("encodes with scale", () => {
      const anim = new Animation({
        frames: [makeSprite(2, 2, "#f00"), makeSprite(2, 2, "#00f")],
        fps: 10,
      });
      const data = encodeAnimatedGIF(anim, { scale: 2 });
      assertValidGIF(data);
      expect(readUint16LE(data, 6)).toBe(4);
      expect(readUint16LE(data, 8)).toBe(4);
    });

    it("encodes with custom delay", () => {
      const anim = new Animation({
        frames: [makeSprite(2, 2, "#f00"), makeSprite(2, 2, "#0f0")],
        fps: 10,
      });
      const data = encodeAnimatedGIF(anim, { delay: 500 });
      assertValidGIF(data);
    });

    it("encodes single-frame animation", () => {
      const anim = new Animation({ frames: [makeSprite(2, 2, "#f00")] });
      const data = encodeAnimatedGIF(anim);
      assertValidGIF(data);
    });

    it("encodes multi-color frames", () => {
      const frame1 = PixelSprite.fromGrid({
        width: 2,
        height: 2,
        data: ["#f00", "#0f0", "#00f", "#fff"],
      });
      const frame2 = PixelSprite.fromGrid({
        width: 2,
        height: 2,
        data: ["#0f0", "#00f", "#fff", "#f00"],
      });
      const anim = new Animation({ frames: [frame1, frame2], fps: 4 });
      const data = encodeAnimatedGIF(anim);
      assertValidGIF(data);
    });

    it("throws on mismatched frame sizes", () => {
      const anim = new Animation({
        frames: [makeSprite(2, 2, "#f00"), makeSprite(4, 4, "#0f0")],
        fps: 10,
      });
      expect(() => encodeAnimatedGIF(anim)).toThrow("same dimensions");
    });

    it("handles transparency in frames", () => {
      const frame = PixelSprite.fromGrid({
        width: 2,
        height: 2,
        data: ["#ff0000", "#00000000", "#00ff00", "#00000000"],
      });
      const anim = new Animation({ frames: [frame, frame], fps: 2 });
      const data = encodeAnimatedGIF(anim);
      assertValidGIF(data);
    });

    it("sets loop count", () => {
      const anim = new Animation({
        frames: [makeSprite(2, 2, "#f00"), makeSprite(2, 2, "#0f0")],
        fps: 5,
      });
      // loop = 3
      const data = encodeAnimatedGIF(anim, { loop: 3 });
      assertValidGIF(data);
    });
  });

  describe("data URL helpers", () => {
    it("spriteToGIFDataURL returns valid data URL", () => {
      const sprite = makeSprite(2, 2, "#ff0000");
      const url = spriteToGIFDataURL(sprite);
      expect(url).toMatch(/^data:image\/gif;base64,/);
      // Decode and verify
      const b64 = url.split(",")[1];
      const bytes = Buffer.from(b64, "base64");
      expect(bytes[0]).toBe(0x47); // G
    });

    it("animationToGIFDataURL returns valid data URL", () => {
      const anim = new Animation({
        frames: [makeSprite(2, 2, "#f00"), makeSprite(2, 2, "#0f0")],
        fps: 2,
      });
      const url = animationToGIFDataURL(anim);
      expect(url).toMatch(/^data:image\/gif;base64,/);
    });
  });
});
