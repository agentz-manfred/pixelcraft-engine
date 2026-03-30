import { describe, it, expect } from "vitest";
import { Palette } from "../../src/core/Palette.js";

describe("Palette", () => {
  it("creates from color array", () => {
    const p = Palette.from(["#000", "#fff"]);
    expect(p.size).toBe(2);
    expect(p.getColor(0)).toBe("#000000ff");
    expect(p.getColor(1)).toBe("#ffffffff");
  });

  it("throws on empty array", () => {
    expect(() => Palette.from([])).toThrow("at least one color");
  });

  it("throws on out-of-range index", () => {
    const p = Palette.from(["#000"]);
    expect(() => p.getColor(1)).toThrow("out of range");
    expect(() => p.getColor(-1)).toThrow("out of range");
  });

  it("finds color index", () => {
    const p = Palette.from(["#ff0000", "#00ff00", "#0000ff"]);
    expect(p.indexOf("#ff0000")).toBe(0);
    expect(p.indexOf("#0000ff")).toBe(2);
    expect(p.indexOf("#ffffff")).toBe(-1);
  });

  it("exports to JSON and back", () => {
    const p = Palette.from(["#123456", "#abcdef"], "test");
    const json = p.toJSON();
    expect(json.name).toBe("test");
    expect(json.colors).toHaveLength(2);
    const p2 = Palette.fromObject(json);
    expect(p2.size).toBe(2);
    expect(p2.name).toBe("test");
  });

  it("has presets", () => {
    expect(Palette.presets.gameboy.size).toBe(4);
    expect(Palette.presets.nes.size).toBe(16);
    expect(Palette.presets.grayscale.size).toBe(12);
    expect(Palette.presets.bueroRoyale.size).toBe(16);
  });

  it("parses from JSON string", () => {
    const p = Palette.parse('{"name":"x","colors":["#f00","#0f0"]}');
    expect(p.size).toBe(2);
    expect(p.name).toBe("x");
  });
});
