/**
 * PixelSprite — Main API for creating and manipulating pixel art sprites
 */

import { PixelBuffer } from "./PixelBuffer.js";
import { Palette } from "./Palette.js";
import { normalizeHex, isValidHex, TRANSPARENT } from "../utils/color.js";
import { assertPositiveInt } from "../utils/validation.js";

export interface SpriteGridOptions {
  width: number;
  height: number;
  /** Palette colors — if provided, data values are palette indices */
  palette?: string[] | Palette;
  /** Pixel data: palette indices (number[]) or hex colors (string[]) */
  data: (number | string)[];
}

export interface SpriteCreateOptions {
  width: number;
  height: number;
  fill?: string;
}

export interface SpriteJSON {
  name?: string;
  width: number;
  height: number;
  palette?: string[];
  data: (number | string)[];
}

export class PixelSprite {
  private buffer: PixelBuffer;
  private _palette: Palette | null;
  name: string;

  private constructor(buffer: PixelBuffer, palette: Palette | null, name = "") {
    this.buffer = buffer;
    this._palette = palette;
    this.name = name;
  }

  /** Create sprite from grid data */
  static fromGrid(options: SpriteGridOptions): PixelSprite {
    const { width, height, data } = options;
    assertPositiveInt(width, "width");
    assertPositiveInt(height, "height");

    if (data.length !== width * height) {
      throw new Error(
        `Data length ${data.length} doesn't match ${width}×${height} = ${width * height}`,
      );
    }

    const palette =
      options.palette instanceof Palette
        ? options.palette
        : options.palette
          ? Palette.from(options.palette)
          : null;

    const buffer = new PixelBuffer(width, height);
    const colors: string[] = data.map((value) => {
      if (typeof value === "number") {
        if (!palette) {
          throw new Error(
            "Numeric data values require a palette. Provide palette option or use hex strings.",
          );
        }
        return palette.getColor(value);
      }
      return normalizeHex(value);
    });
    buffer.setData(colors);

    return new PixelSprite(buffer, palette);
  }

  /** Create empty sprite */
  static create(options: SpriteCreateOptions): PixelSprite {
    const { width, height, fill = TRANSPARENT } = options;
    return new PixelSprite(new PixelBuffer(width, height, fill), null);
  }

  /** Create from JSON object */
  static fromObject(json: SpriteJSON): PixelSprite {
    const sprite = PixelSprite.fromGrid({
      width: json.width,
      height: json.height,
      palette: json.palette,
      data: json.data,
    });
    sprite.name = json.name ?? "";
    return sprite;
  }

  /** Parse JSON string */
  static parse(jsonString: string): PixelSprite {
    return PixelSprite.fromObject(JSON.parse(jsonString));
  }

  // — Getters —

  getWidth(): number {
    return this.buffer.width;
  }

  getHeight(): number {
    return this.buffer.height;
  }

  getPalette(): Palette | null {
    return this._palette;
  }

  // — Pixel manipulation —

  getPixel(x: number, y: number): string {
    return this.buffer.getPixel(x, y);
  }

  setPixel(x: number, y: number, color: string): void {
    this.buffer.setPixel(x, y, color);
  }

  fill(color: string): void {
    this.buffer.fill(color);
  }

  fillRect(x: number, y: number, w: number, h: number, color: string): void {
    this.buffer.fillRect(x, y, w, h, color);
  }

  // — Transforms —

  flipHorizontal(): PixelSprite {
    this.buffer.flipHorizontal();
    return this;
  }

  flipVertical(): PixelSprite {
    this.buffer.flipVertical();
    return this;
  }

  rotate90(): PixelSprite {
    this.buffer.rotate90();
    return this;
  }

  rotate180(): PixelSprite {
    this.buffer.rotate180();
    return this;
  }

  rotate270(): PixelSprite {
    this.buffer.rotate270();
    return this;
  }

  scale(factor: number): PixelSprite {
    this.buffer.scale(factor);
    return this;
  }

  // — Palette operations —

  /** Apply a new palette (remaps indexed colors) */
  applyPalette(newPalette: Palette): void {
    if (!this._palette) {
      throw new Error("Cannot remap palette — sprite has no palette assigned");
    }
    const data = this.buffer.getData();
    const remapped = data.map((color) => {
      const idx = this._palette!.indexOf(color);
      if (idx >= 0 && idx < newPalette.size) {
        return newPalette.getColor(idx);
      }
      return color;
    });
    this.buffer.setData(remapped);
    this._palette = newPalette;
  }

  /** Remap a single color */
  remapColor(oldColor: string, newColor: string): void {
    const oldNorm = normalizeHex(oldColor);
    const newNorm = normalizeHex(newColor);
    const data = this.buffer.getData();
    const remapped = data.map((c) =>
      c === oldNorm || c.slice(0, 7) === oldNorm.slice(0, 7) ? newNorm : c,
    );
    this.buffer.setData(remapped);
  }

  // — Rendering —

  /** Render to an HTML5 Canvas */
  renderToCanvas(
    canvas: HTMLCanvasElement,
    options: { scale?: number; clear?: boolean } = {},
  ): void {
    const { scale = 1, clear = true } = options;
    const w = this.buffer.width;
    const h = this.buffer.height;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas 2d context");

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = this.buffer.getPixel(x, y);
        if (color === TRANSPARENT) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  /** Export as PNG data URL */
  async toPNGDataURL(options: { scale?: number } = {}): Promise<string> {
    const canvas = document.createElement("canvas");
    this.renderToCanvas(canvas, options);
    return canvas.toDataURL("image/png");
  }

  /** Export as PNG Blob */
  async toPNG(options: { scale?: number } = {}): Promise<Blob> {
    const canvas = document.createElement("canvas");
    this.renderToCanvas(canvas, options);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create PNG blob"));
      }, "image/png");
    });
  }

  /** Export as SVG string */
  toSVG(options: { pixelSize?: number } = {}): string {
    const { pixelSize = 1 } = options;
    const w = this.buffer.width;
    const h = this.buffer.height;
    const rects: string[] = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = this.buffer.getPixel(x, y);
        if (color === TRANSPARENT) continue;
        rects.push(
          `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color.slice(0, 7)}"${color.length > 7 ? ` opacity="${(parseInt(color.slice(7), 16) / 255).toFixed(2)}"` : ""}/>`,
        );
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * pixelSize}" height="${h * pixelSize}" viewBox="0 0 ${w * pixelSize} ${h * pixelSize}">\n${rects.join("\n")}\n</svg>`;
  }

  // — Serialization —

  /** Deep clone */
  clone(): PixelSprite {
    return new PixelSprite(
      this.buffer.clone(),
      this._palette,
      this.name,
    );
  }

  /** Export as JSON */
  toJSON(): SpriteJSON {
    return {
      name: this.name || undefined,
      width: this.buffer.width,
      height: this.buffer.height,
      palette: this._palette?.toArray(),
      data: this.buffer.getData(),
    };
  }

  /** Get raw pixel data */
  getData(): string[] {
    return this.buffer.getData();
  }
}
