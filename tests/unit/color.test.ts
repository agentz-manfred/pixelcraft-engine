import { describe, it, expect } from "vitest";
import {
  normalizeHex,
  hexToRGB,
  rgbToHex,
  hexToHSL,
  isValidHex,
} from "../../src/utils/color.js";

describe("color utils", () => {
  describe("normalizeHex", () => {
    it("normalizes #RGB", () => {
      expect(normalizeHex("#f00")).toBe("#ff0000ff");
    });

    it("normalizes #RGBA", () => {
      expect(normalizeHex("#f008")).toBe("#ff000088");
    });

    it("normalizes #RRGGBB", () => {
      expect(normalizeHex("#ff0000")).toBe("#ff0000ff");
    });

    it("passes through #RRGGBBAA", () => {
      expect(normalizeHex("#ff000080")).toBe("#ff000080");
    });

    it("handles no hash", () => {
      expect(normalizeHex("ff0000")).toBe("#ff0000ff");
    });

    it("throws on invalid", () => {
      expect(() => normalizeHex("#xyz")).toThrow();
      expect(() => normalizeHex("")).toThrow();
      expect(() => normalizeHex("#12345")).toThrow();
    });

    it("throws on non-string", () => {
      expect(() => normalizeHex(123 as any)).toThrow();
    });
  });

  describe("hexToRGB", () => {
    it("converts red", () => {
      const rgb = hexToRGB("#ff0000");
      expect(rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it("handles alpha", () => {
      const rgb = hexToRGB("#ff000080");
      expect(rgb.r).toBe(255);
      expect(rgb.a).toBeCloseTo(0.502, 2);
    });
  });

  describe("rgbToHex", () => {
    it("converts back", () => {
      expect(rgbToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
    });

    it("includes alpha when < 1", () => {
      const hex = rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(hex).toBe("#ff000080");
    });
  });

  describe("hexToHSL", () => {
    it("red is 0°", () => {
      const hsl = hexToHSL("#ff0000");
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });
  });

  describe("isValidHex", () => {
    it("validates correctly", () => {
      expect(isValidHex("#f00")).toBe(true);
      expect(isValidHex("#ff0000")).toBe(true);
      expect(isValidHex("#ff000080")).toBe(true);
      expect(isValidHex("nope")).toBe(false);
      expect(isValidHex("")).toBe(false);
    });
  });
});
