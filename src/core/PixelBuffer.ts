/**
 * PixelBuffer — Raw pixel data storage & manipulation
 *
 * Stores pixels as normalized hex color strings in a flat array.
 * Coordinates: (0,0) = top-left.
 */

import { normalizeHex, TRANSPARENT } from "../utils/color.js";
import {
  assertPositiveInt,
  assertNonNegativeInt,
  assertInRange,
} from "../utils/validation.js";
import {
  flipHorizontal,
  flipVertical,
  rotate90,
  rotate180,
  rotate270,
  scaleUp,
} from "../utils/transform.js";

export class PixelBuffer {
  private data: string[];
  private _width: number;
  private _height: number;

  constructor(width: number, height: number, fillColor: string = TRANSPARENT) {
    assertPositiveInt(width, "width");
    assertPositiveInt(height, "height");
    this._width = width;
    this._height = height;
    const fill = normalizeHex(fillColor);
    this.data = new Array(width * height).fill(fill);
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get length(): number {
    return this.data.length;
  }

  /** Get pixel color at (x, y) */
  getPixel(x: number, y: number): string {
    this.assertBounds(x, y);
    return this.data[y * this._width + x];
  }

  /** Set pixel color at (x, y) */
  setPixel(x: number, y: number, color: string): void {
    this.assertBounds(x, y);
    this.data[y * this._width + x] = normalizeHex(color);
  }

  /** Fill entire buffer with one color */
  fill(color: string): void {
    const c = normalizeHex(color);
    this.data.fill(c);
  }

  /** Fill a rectangular region */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    const c = normalizeHex(color);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < this._width && py >= 0 && py < this._height) {
          this.data[py * this._width + px] = c;
        }
      }
    }
  }

  /** Get raw data as array of hex colors */
  getData(): string[] {
    return [...this.data];
  }

  /** Set data from array (must match width×height) */
  setData(data: string[]): void {
    if (data.length !== this._width * this._height) {
      throw new Error(
        `Data length ${data.length} doesn't match ${this._width}×${this._height} = ${this._width * this._height}`,
      );
    }
    this.data = data.map((c) => normalizeHex(c));
  }

  /** Deep clone */
  clone(): PixelBuffer {
    const buf = new PixelBuffer(this._width, this._height);
    buf.data = [...this.data];
    return buf;
  }

  // — Transforms (mutating) —

  flipHorizontal(): void {
    this.data = flipHorizontal(this.data, this._width, this._height);
  }

  flipVertical(): void {
    this.data = flipVertical(this.data, this._width, this._height);
  }

  rotate90(): void {
    const [d, w, h] = rotate90(this.data, this._width, this._height);
    this.data = d;
    this._width = w;
    this._height = h;
  }

  rotate180(): void {
    this.data = rotate180(this.data, this._width, this._height);
  }

  rotate270(): void {
    const [d, w, h] = rotate270(this.data, this._width, this._height);
    this.data = d;
    this._width = w;
    this._height = h;
  }

  scale(factor: number): void {
    const [d, w, h] = scaleUp(this.data, this._width, this._height, factor);
    this.data = d;
    this._width = w;
    this._height = h;
  }

  // — Internal —

  private assertBounds(x: number, y: number): void {
    assertNonNegativeInt(x, "x");
    assertNonNegativeInt(y, "y");
    assertInRange(x, 0, this._width - 1, "x");
    assertInRange(y, 0, this._height - 1, "y");
  }
}
