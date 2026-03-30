import { describe, it, expect } from "vitest";
import { Animation } from "../../src/core/Animation.js";
import { PixelSprite } from "../../src/core/PixelSprite.js";

const makeFrame = (color: string) =>
  PixelSprite.fromGrid({ width: 1, height: 1, data: [color] });

describe("Animation", () => {
  it("creates with frames", () => {
    const anim = new Animation({
      frames: [makeFrame("#f00"), makeFrame("#0f0")],
      fps: 2,
    });
    expect(anim.frameCount).toBe(2);
    expect(anim.fps).toBe(2);
  });

  it("throws on empty frames", () => {
    expect(() => new Animation({ frames: [] })).toThrow("at least one frame");
  });

  it("throws on invalid fps", () => {
    expect(() =>
      new Animation({ frames: [makeFrame("#f00")], fps: 0 }),
    ).toThrow();
    expect(() =>
      new Animation({ frames: [makeFrame("#f00")], fps: -1 }),
    ).toThrow();
  });

  it("calculates total duration", () => {
    const anim = new Animation({
      frames: [makeFrame("#f00"), makeFrame("#0f0")],
      fps: 2,
    });
    expect(anim.totalDuration).toBe(1000); // 2 frames at 500ms each
  });

  it("calculates duration with per-frame overrides", () => {
    const anim = new Animation({
      frames: [
        { sprite: makeFrame("#f00"), duration: 200 },
        { sprite: makeFrame("#0f0"), duration: 800 },
      ],
    });
    expect(anim.totalDuration).toBe(1000);
  });

  it("accesses frames", () => {
    const f1 = makeFrame("#f00");
    const f2 = makeFrame("#0f0");
    const anim = new Animation({ frames: [f1, f2] });
    expect(anim.getFrame(0)).toBe(f1);
    expect(anim.getFrame(1)).toBe(f2);
  });

  it("throws on out-of-range frame", () => {
    const anim = new Animation({ frames: [makeFrame("#f00")] });
    expect(() => anim.getFrame(1)).toThrow("out of range");
    expect(() => anim.getFrame(-1)).toThrow("out of range");
  });

  it("setFPS works", () => {
    const anim = new Animation({ frames: [makeFrame("#f00")], fps: 10 });
    anim.setFPS(30);
    expect(anim.fps).toBe(30);
  });

  it("getFrames returns all sprites", () => {
    const anim = new Animation({
      frames: [makeFrame("#f00"), makeFrame("#0f0")],
    });
    expect(anim.getFrames()).toHaveLength(2);
  });
});
