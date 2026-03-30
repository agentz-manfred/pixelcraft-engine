import { describe, it, expect } from "vitest";
import { PixelSprite } from "../../src/core/PixelSprite.js";
import { Animation } from "../../src/core/Animation.js";
import { SpriteSheet } from "../../src/formats/SpriteSheet.js";
import { TRANSPARENT } from "../../src/utils/color.js";

const makeSprite = (w: number, h: number, color: string) =>
  PixelSprite.fromGrid({
    width: w,
    height: h,
    data: new Array(w * h).fill(color),
  });

describe("SpriteSheet", () => {
  describe("constructor / fromSprites", () => {
    it("creates from sprites", () => {
      const sprites = [makeSprite(4, 4, "#f00"), makeSprite(4, 4, "#0f0")];
      const sheet = SpriteSheet.fromSprites(sprites);
      expect(sheet.count).toBe(2);
      expect(sheet.cellWidth).toBe(4);
      expect(sheet.cellHeight).toBe(4);
    });

    it("auto-calculates grid dimensions", () => {
      const sprites = Array.from({ length: 4 }, (_, i) =>
        makeSprite(8, 8, `#${i.toString(16).padStart(2, "0")}0000`),
      );
      const sheet = SpriteSheet.fromSprites(sprites);
      expect(sheet.columns).toBe(2);
      expect(sheet.rows).toBe(2);
    });

    it("respects explicit columns", () => {
      const sprites = Array.from({ length: 6 }, () => makeSprite(4, 4, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, { columns: 3 });
      expect(sheet.columns).toBe(3);
      expect(sheet.rows).toBe(2);
    });

    it("respects explicit rows", () => {
      const sprites = Array.from({ length: 6 }, () => makeSprite(4, 4, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, { rows: 2 });
      expect(sheet.columns).toBe(3);
      expect(sheet.rows).toBe(2);
    });

    it("throws on empty array", () => {
      expect(() => SpriteSheet.fromSprites([])).toThrow();
    });

    it("throws on mismatched sprite sizes", () => {
      expect(() =>
        SpriteSheet.fromSprites([makeSprite(4, 4, "#f00"), makeSprite(8, 8, "#0f0")]),
      ).toThrow("don't match");
    });

    it("throws when grid is too small for sprites", () => {
      const sprites = Array.from({ length: 10 }, () => makeSprite(4, 4, "#f00"));
      expect(() =>
        new SpriteSheet(sprites, { cellWidth: 4, cellHeight: 4, columns: 2, rows: 2 }),
      ).toThrow("cells");
    });
  });

  describe("getSprite / getSpriteAt", () => {
    it("returns correct sprite by index", () => {
      const s1 = makeSprite(4, 4, "#ff0000");
      const s2 = makeSprite(4, 4, "#00ff00");
      const sheet = SpriteSheet.fromSprites([s1, s2]);
      expect(sheet.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
      expect(sheet.getSprite(1).getPixel(0, 0)).toBe("#00ff00ff");
    });

    it("returns correct sprite by grid position", () => {
      const sprites = [
        makeSprite(4, 4, "#f00"),
        makeSprite(4, 4, "#0f0"),
        makeSprite(4, 4, "#00f"),
        makeSprite(4, 4, "#fff"),
      ];
      const sheet = SpriteSheet.fromSprites(sprites, { columns: 2 });
      expect(sheet.getSpriteAt(0, 0).getPixel(0, 0)).toBe("#ff0000ff");
      expect(sheet.getSpriteAt(1, 0).getPixel(0, 0)).toBe("#00ff00ff");
      expect(sheet.getSpriteAt(0, 1).getPixel(0, 0)).toBe("#0000ffff");
      expect(sheet.getSpriteAt(1, 1).getPixel(0, 0)).toBe("#ffffffff");
    });

    it("throws on out-of-range index", () => {
      const sheet = SpriteSheet.fromSprites([makeSprite(4, 4, "#f00")]);
      expect(() => sheet.getSprite(1)).toThrow("out of range");
      expect(() => sheet.getSprite(-1)).toThrow("out of range");
    });
  });

  describe("dimensions", () => {
    it("calculates correct width/height without padding", () => {
      const sprites = Array.from({ length: 4 }, () => makeSprite(8, 8, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, { columns: 2 });
      expect(sheet.width).toBe(16); // 2 * 8
      expect(sheet.height).toBe(16); // 2 * 8
    });

    it("calculates with padding", () => {
      const sprites = Array.from({ length: 4 }, () => makeSprite(8, 8, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, {
        columns: 2,
        paddingX: 2,
        paddingY: 2,
      });
      expect(sheet.width).toBe(18); // 2*8 + 1*2
      expect(sheet.height).toBe(18);
    });

    it("calculates with margin", () => {
      const sprites = Array.from({ length: 4 }, () => makeSprite(8, 8, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, {
        columns: 2,
        margin: 4,
      });
      expect(sheet.width).toBe(24); // 4 + 16 + 4
      expect(sheet.height).toBe(24);
    });

    it("calculates with padding + margin", () => {
      const sprites = Array.from({ length: 4 }, () => makeSprite(8, 8, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites, {
        columns: 2,
        paddingX: 2,
        paddingY: 2,
        margin: 1,
      });
      expect(sheet.width).toBe(20); // 1 + 8 + 2 + 8 + 1
      expect(sheet.height).toBe(20);
    });
  });

  describe("toSprite (export)", () => {
    it("creates composite sprite with correct dimensions", () => {
      const sprites = [
        makeSprite(4, 4, "#f00"),
        makeSprite(4, 4, "#0f0"),
        makeSprite(4, 4, "#00f"),
        makeSprite(4, 4, "#fff"),
      ];
      const sheet = SpriteSheet.fromSprites(sprites, { columns: 2 });
      const composite = sheet.toSprite();
      expect(composite.getWidth()).toBe(8);
      expect(composite.getHeight()).toBe(8);
      // Check pixel colors at cell corners
      expect(composite.getPixel(0, 0)).toBe("#ff0000ff"); // top-left sprite
      expect(composite.getPixel(4, 0)).toBe("#00ff00ff"); // top-right sprite
      expect(composite.getPixel(0, 4)).toBe("#0000ffff"); // bottom-left
      expect(composite.getPixel(4, 4)).toBe("#ffffffff"); // bottom-right
    });

    it("handles padding in composite", () => {
      const sprites = [makeSprite(2, 2, "#f00"), makeSprite(2, 2, "#0f0")];
      const sheet = SpriteSheet.fromSprites(sprites, {
        columns: 2,
        paddingX: 1,
      });
      const composite = sheet.toSprite();
      expect(composite.getWidth()).toBe(5); // 2 + 1 + 2
      expect(composite.getPixel(0, 0)).toBe("#ff0000ff");
      expect(composite.getPixel(2, 0)).toBe(TRANSPARENT); // padding
      expect(composite.getPixel(3, 0)).toBe("#00ff00ff");
    });
  });

  describe("fromComposite (import)", () => {
    it("splits a composite sprite into cells", () => {
      // Create a 4x2 sprite that represents 2 cells of 2x2
      const composite = PixelSprite.fromGrid({
        width: 4,
        height: 2,
        data: [
          "#f00", "#f00", "#0f0", "#0f0",
          "#f00", "#f00", "#0f0", "#0f0",
        ],
      });
      const sheet = SpriteSheet.fromComposite(composite, {
        cellWidth: 2,
        cellHeight: 2,
      });
      expect(sheet.count).toBe(2);
      expect(sheet.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
      expect(sheet.getSprite(1).getPixel(0, 0)).toBe("#00ff00ff");
    });

    it("handles margin in import", () => {
      // 6x6 sprite with 1px margin, containing 2x2 cells in a 2x2 grid
      const w = 6, h = 6;
      const data: string[] = new Array(w * h).fill(TRANSPARENT);
      // Cell at (1,1)→(2,2): red
      data[1 * w + 1] = "#ff0000"; data[1 * w + 2] = "#ff0000";
      data[2 * w + 1] = "#ff0000"; data[2 * w + 2] = "#ff0000";
      // Cell at (3,1)→(4,2): green
      data[1 * w + 3] = "#00ff00"; data[1 * w + 4] = "#00ff00";
      data[2 * w + 3] = "#00ff00"; data[2 * w + 4] = "#00ff00";

      const composite = PixelSprite.fromGrid({ width: w, height: h, data });
      const sheet = SpriteSheet.fromComposite(composite, {
        cellWidth: 2,
        cellHeight: 2,
        margin: 1,
      });
      expect(sheet.count).toBeGreaterThanOrEqual(2);
      expect(sheet.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
      expect(sheet.getSprite(1).getPixel(0, 0)).toBe("#00ff00ff");
    });

    it("throws on too-small source", () => {
      const tiny = makeSprite(1, 1, "#f00");
      expect(() =>
        SpriteSheet.fromComposite(tiny, { cellWidth: 8, cellHeight: 8 }),
      ).toThrow("too small");
    });
  });

  describe("fromAnimation", () => {
    it("creates sheet from animation frames", () => {
      const anim = new Animation({
        frames: [makeSprite(4, 4, "#f00"), makeSprite(4, 4, "#0f0")],
        fps: 10,
      });
      const sheet = SpriteSheet.fromAnimation(anim);
      expect(sheet.count).toBe(2);
      expect(sheet.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
    });
  });

  describe("toAnimation", () => {
    it("converts sheet to animation", () => {
      const sprites = [makeSprite(4, 4, "#f00"), makeSprite(4, 4, "#0f0")];
      const sheet = SpriteSheet.fromSprites(sprites);
      const anim = sheet.toAnimation({ fps: 5 });
      expect(anim.frameCount).toBe(2);
      expect(anim.fps).toBe(5);
    });
  });

  describe("SVG export", () => {
    it("generates valid SVG", () => {
      const sheet = SpriteSheet.fromSprites([makeSprite(2, 2, "#f00")]);
      const svg = sheet.toSVG({ pixelSize: 4 });
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    });
  });

  describe("JSON serialization", () => {
    it("round-trips through JSON", () => {
      const sprites = [
        makeSprite(4, 4, "#ff0000"),
        makeSprite(4, 4, "#00ff00"),
        makeSprite(4, 4, "#0000ff"),
      ];
      const sheet = SpriteSheet.fromSprites(sprites, { columns: 3 });
      const json = sheet.toJSON();

      expect(json.count).toBe(3);
      expect(json.layout.cellWidth).toBe(4);
      expect(json.layout.columns).toBe(3);

      const restored = SpriteSheet.fromJSON(json);
      expect(restored.count).toBe(3);
      expect(restored.getSprite(0).getPixel(0, 0)).toBe("#ff0000ff");
      expect(restored.getSprite(1).getPixel(0, 0)).toBe("#00ff00ff");
      expect(restored.getSprite(2).getPixel(0, 0)).toBe("#0000ffff");
    });

    it("parses from JSON string", () => {
      const sheet = SpriteSheet.fromSprites([makeSprite(2, 2, "#f00")]);
      const str = JSON.stringify(sheet.toJSON());
      const restored = SpriteSheet.parse(str);
      expect(restored.count).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("handles 1×1 sprites", () => {
      const sprites = [makeSprite(1, 1, "#f00"), makeSprite(1, 1, "#0f0")];
      const sheet = SpriteSheet.fromSprites(sprites);
      expect(sheet.count).toBe(2);
      const composite = sheet.toSprite();
      expect(composite.getWidth()).toBe(2);
    });

    it("handles single sprite", () => {
      const sheet = SpriteSheet.fromSprites([makeSprite(8, 8, "#f00")]);
      expect(sheet.columns).toBe(1);
      expect(sheet.rows).toBe(1);
      expect(sheet.width).toBe(8);
    });

    it("handles many sprites (25 in 5×5 grid)", () => {
      const sprites = Array.from({ length: 25 }, () => makeSprite(4, 4, "#f00"));
      const sheet = SpriteSheet.fromSprites(sprites);
      expect(sheet.count).toBe(25);
      expect(sheet.columns).toBe(5);
      expect(sheet.rows).toBe(5);
    });

    it("sprites are cloned (independent)", () => {
      const original = makeSprite(2, 2, "#ff0000");
      const sheet = SpriteSheet.fromSprites([original]);
      sheet.getSprite(0).setPixel(0, 0, "#00ff00");
      // Original sprite shouldn't be affected
      expect(original.getPixel(0, 0)).toBe("#ff0000ff");
    });
  });
});
