import { describe, it, expect } from "vitest";
import {
  flipHorizontal,
  flipVertical,
  rotate90,
  rotate180,
  rotate270,
  scaleUp,
} from "../../src/utils/transform.js";

describe("transforms", () => {
  // 2x2 grid: [A, B, C, D] →
  //   A B
  //   C D
  const data = ["A", "B", "C", "D"];

  it("flipHorizontal", () => {
    const result = flipHorizontal(data, 2, 2);
    expect(result).toEqual(["B", "A", "D", "C"]);
  });

  it("flipVertical", () => {
    const result = flipVertical(data, 2, 2);
    expect(result).toEqual(["C", "D", "A", "B"]);
  });

  it("rotate90", () => {
    const [result, w, h] = rotate90(data, 2, 2);
    expect(w).toBe(2);
    expect(h).toBe(2);
    // Expected: C A / D B
    expect(result).toEqual(["C", "A", "D", "B"]);
  });

  it("rotate180", () => {
    const result = rotate180(data, 2, 2);
    expect(result).toEqual(["D", "C", "B", "A"]);
  });

  it("rotate270", () => {
    const [result, w, h] = rotate270(data, 2, 2);
    expect(w).toBe(2);
    expect(h).toBe(2);
    expect(result).toEqual(["B", "D", "A", "C"]);
  });

  it("scaleUp 2x", () => {
    const [result, w, h] = scaleUp(["A", "B", "C", "D"], 2, 2, 2);
    expect(w).toBe(4);
    expect(h).toBe(4);
    // Row 0: A A B B
    expect(result.slice(0, 4)).toEqual(["A", "A", "B", "B"]);
    // Row 1: A A B B
    expect(result.slice(4, 8)).toEqual(["A", "A", "B", "B"]);
    // Row 2: C C D D
    expect(result.slice(8, 12)).toEqual(["C", "C", "D", "D"]);
  });

  it("scaleUp rejects non-integer", () => {
    expect(() => scaleUp(data, 2, 2, 1.5)).toThrow();
  });
});
