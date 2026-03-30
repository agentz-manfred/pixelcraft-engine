import { describe, it, expect } from "vitest";
import { PixelSprite } from "../../src/core/PixelSprite.js";

describe("PixelSprite", () => {
  it("creates from palette indices", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 2,
      palette: ["#000", "#fff"],
      data: [0, 1, 1, 0],
    });
    expect(sprite.getWidth()).toBe(2);
    expect(sprite.getHeight()).toBe(2);
    expect(sprite.getPixel(0, 0)).toBe("#000000ff");
    expect(sprite.getPixel(1, 0)).toBe("#ffffffff");
  });

  it("creates from hex strings", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff0000", "#00ff00"],
    });
    expect(sprite.getPixel(0, 0)).toBe("#ff0000ff");
    expect(sprite.getPixel(1, 0)).toBe("#00ff00ff");
  });

  it("throws when data length mismatches", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 2, height: 2, data: [0, 1] }),
    ).toThrow("doesn't match");
  });

  it("throws when using numbers without palette", () => {
    expect(() =>
      PixelSprite.fromGrid({ width: 1, height: 1, data: [0] }),
    ).toThrow("require a palette");
  });

  it("creates empty sprite", () => {
    const sprite = PixelSprite.create({ width: 8, height: 8, fill: "#123456" });
    expect(sprite.getWidth()).toBe(8);
    expect(sprite.getPixel(4, 4)).toBe("#123456ff");
  });

  it("manipulates pixels", () => {
    const sprite = PixelSprite.create({ width: 4, height: 4 });
    sprite.setPixel(2, 2, "#ff0000");
    expect(sprite.getPixel(2, 2)).toBe("#ff0000ff");
  });

  it("fill and fillRect", () => {
    const sprite = PixelSprite.create({ width: 4, height: 4 });
    sprite.fill("#111111");
    sprite.fillRect(1, 1, 2, 2, "#ff0000");
    expect(sprite.getPixel(0, 0)).toBe("#111111ff");
    expect(sprite.getPixel(1, 1)).toBe("#ff0000ff");
  });

  it("transforms are chainable", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 2,
      data: ["#f00", "#0f0", "#00f", "#fff"],
    });
    const result = sprite.flipHorizontal().flipVertical();
    expect(result).toBe(sprite); // chainable
    expect(sprite.getWidth()).toBe(2);
  });

  it("clone is independent", () => {
    const sprite = PixelSprite.create({ width: 2, height: 2, fill: "#f00" });
    const clone = sprite.clone();
    clone.setPixel(0, 0, "#0f0");
    expect(sprite.getPixel(0, 0)).toBe("#ff0000ff");
    expect(clone.getPixel(0, 0)).toBe("#00ff00ff");
  });

  it("serializes to JSON and back", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 2,
      palette: ["#000", "#fff"],
      data: [0, 1, 1, 0],
    });
    sprite.name = "test";
    const json = sprite.toJSON();
    expect(json.name).toBe("test");
    expect(json.width).toBe(2);
    const restored = PixelSprite.fromObject(json);
    expect(restored.getWidth()).toBe(2);
  });

  it("parses from JSON string", () => {
    const json = '{"width":2,"height":1,"data":["#ff0000","#00ff00"]}';
    const sprite = PixelSprite.parse(json);
    expect(sprite.getPixel(0, 0)).toBe("#ff0000ff");
  });

  it("generates SVG", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff0000", "#00ff00"],
    });
    const svg = sprite.toSVG({ pixelSize: 4 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="8"');
    expect(svg).toContain("#ff0000");
    expect(svg).toContain("#00ff00");
  });

  it("remaps color", () => {
    const sprite = PixelSprite.fromGrid({
      width: 2,
      height: 1,
      data: ["#ff0000", "#00ff00"],
    });
    sprite.remapColor("#ff0000", "#0000ff");
    expect(sprite.getPixel(0, 0)).toBe("#0000ffff");
    expect(sprite.getPixel(1, 0)).toBe("#00ff00ff");
  });
});
