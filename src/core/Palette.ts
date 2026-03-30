/**
 * Palette — Color palette management
 *
 * Palettes map indices (0, 1, 2, ...) to hex colors.
 * Can be loaded from arrays, JSON files, or use built-in presets.
 */

import { normalizeHex, isValidHex, TRANSPARENT } from "../utils/color.js";

export interface PaletteJSON {
  name?: string;
  colors: string[];
}

export class Palette {
  readonly name: string;
  private readonly colors: string[];

  constructor(colors: string[], name = "custom") {
    if (!Array.isArray(colors) || colors.length === 0) {
      throw new Error("Palette must have at least one color");
    }
    this.colors = colors.map((c) => normalizeHex(c));
    this.name = name;
  }

  /** Create palette from color array */
  static from(colors: string[], name?: string): Palette {
    return new Palette(colors, name);
  }

  /** Create from JSON object */
  static fromObject(json: PaletteJSON): Palette {
    return new Palette(json.colors, json.name);
  }

  /** Parse JSON string */
  static parse(jsonString: string): Palette {
    const data = JSON.parse(jsonString) as PaletteJSON;
    return Palette.fromObject(data);
  }

  /** Get color at index */
  getColor(index: number): string {
    if (index < 0 || index >= this.colors.length) {
      throw new Error(
        `Palette index ${index} out of range (0-${this.colors.length - 1})`,
      );
    }
    return this.colors[index];
  }

  /** Get number of colors */
  get size(): number {
    return this.colors.length;
  }

  /** Get all colors as array */
  toArray(): string[] {
    return [...this.colors];
  }

  /** Export as JSON */
  toJSON(): PaletteJSON {
    return {
      name: this.name,
      colors: [...this.colors],
    };
  }

  /** Find index of a color (or -1) */
  indexOf(color: string): number {
    const normalized = normalizeHex(color);
    return this.colors.findIndex(
      (c) => c === normalized || c.slice(0, 7) === normalized.slice(0, 7),
    );
  }

  // — Built-in presets —

  static readonly presets = {
    gameboy: new Palette(
      ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
      "gameboy",
    ),
    nes: new Palette(
      [
        "#000000", "#fcfcfc", "#f8f8f8", "#bcbcbc",
        "#7c7c7c", "#a4e4fc", "#3cbcfc", "#0078f8",
        "#0000fc", "#b8b8f8", "#6888fc", "#0058f8",
        "#0000bc", "#d8b8f8", "#9878f8", "#6844fc",
      ],
      "nes",
    ),
    grayscale: new Palette(
      [
        "#000000", "#1a1a1a", "#333333", "#4d4d4d",
        "#666666", "#808080", "#999999", "#b3b3b3",
        "#cccccc", "#e6e6e6", "#f2f2f2", "#ffffff",
      ],
      "grayscale",
    ),
    bueroRoyale: new Palette(
      [
        "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57",
        "#ffcd75", "#a7f070", "#38b764", "#257179",
        "#29366f", "#3b5dc9", "#41a6f6", "#73eff7",
        "#f4f4f4", "#94b0c2", "#566c86", "#333c57",
      ],
      "buero-royale",
    ),
  };
}
