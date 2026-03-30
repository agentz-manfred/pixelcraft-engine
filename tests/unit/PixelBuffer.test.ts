import { describe, it, expect } from "vitest";
import { PixelBuffer } from "../../src/core/PixelBuffer.js";

describe("PixelBuffer", () => {
  it("creates with dimensions", () => {
    const buf = new PixelBuffer(4, 4);
    expect(buf.width).toBe(4);
    expect(buf.height).toBe(4);
    expect(buf.length).toBe(16);
  });

  it("fills with default color", () => {
    const buf = new PixelBuffer(2, 2, "#ff0000");
    expect(buf.getPixel(0, 0)).toBe("#ff0000ff");
    expect(buf.getPixel(1, 1)).toBe("#ff0000ff");
  });

  it("throws on invalid dimensions", () => {
    expect(() => new PixelBuffer(0, 1)).toThrow();
    expect(() => new PixelBuffer(1, 0)).toThrow();
    expect(() => new PixelBuffer(-1, 1)).toThrow();
  });

  it("get/set pixel", () => {
    const buf = new PixelBuffer(4, 4);
    buf.setPixel(2, 3, "#abcdef");
    expect(buf.getPixel(2, 3)).toBe("#abcdefff");
  });

  it("throws on out-of-bounds", () => {
    const buf = new PixelBuffer(4, 4);
    expect(() => buf.getPixel(4, 0)).toThrow();
    expect(() => buf.getPixel(0, 4)).toThrow();
    expect(() => buf.getPixel(-1, 0)).toThrow();
    expect(() => buf.setPixel(4, 0, "#000")).toThrow();
  });

  it("fill works", () => {
    const buf = new PixelBuffer(2, 2);
    buf.fill("#ff0000");
    expect(buf.getPixel(0, 0)).toBe("#ff0000ff");
    expect(buf.getPixel(1, 1)).toBe("#ff0000ff");
  });

  it("fillRect works", () => {
    const buf = new PixelBuffer(4, 4, "#000");
    buf.fillRect(1, 1, 2, 2, "#fff");
    expect(buf.getPixel(0, 0)).toBe("#000000ff");
    expect(buf.getPixel(1, 1)).toBe("#ffffffff");
    expect(buf.getPixel(2, 2)).toBe("#ffffffff");
    expect(buf.getPixel(3, 3)).toBe("#000000ff");
  });

  it("clone is independent", () => {
    const buf = new PixelBuffer(2, 2, "#f00");
    const clone = buf.clone();
    clone.setPixel(0, 0, "#0f0");
    expect(buf.getPixel(0, 0)).toBe("#ff0000ff");
    expect(clone.getPixel(0, 0)).toBe("#00ff00ff");
  });

  it("flipHorizontal works", () => {
    const buf = new PixelBuffer(2, 1);
    buf.setPixel(0, 0, "#f00");
    buf.setPixel(1, 0, "#0f0");
    buf.flipHorizontal();
    expect(buf.getPixel(0, 0)).toBe("#00ff00ff");
    expect(buf.getPixel(1, 0)).toBe("#ff0000ff");
  });

  it("rotate90 changes dimensions", () => {
    const buf = new PixelBuffer(4, 2, "#000");
    buf.rotate90();
    expect(buf.width).toBe(2);
    expect(buf.height).toBe(4);
  });

  it("scale doubles dimensions", () => {
    const buf = new PixelBuffer(2, 2, "#f00");
    buf.setPixel(0, 0, "#0f0");
    buf.scale(2);
    expect(buf.width).toBe(4);
    expect(buf.height).toBe(4);
    // Top-left 2x2 block should be green
    expect(buf.getPixel(0, 0)).toBe("#00ff00ff");
    expect(buf.getPixel(1, 0)).toBe("#00ff00ff");
    expect(buf.getPixel(0, 1)).toBe("#00ff00ff");
    expect(buf.getPixel(1, 1)).toBe("#00ff00ff");
    // Rest should be red
    expect(buf.getPixel(2, 0)).toBe("#ff0000ff");
  });
});
