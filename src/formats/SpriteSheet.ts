/**
 * SpriteSheet — Import/Export spritesheets
 *
 * A spritesheet packs multiple sprites (or animation frames) into a single
 * image grid. This module handles:
 * - Extracting sprites from a flat pixel grid (import)
 * - Packing sprites into a grid (export)
 * - Converting between spritesheets and Animations
 */

import { PixelSprite } from "../core/PixelSprite.js";
import { PixelBuffer } from "../core/PixelBuffer.js";
import { Animation } from "../core/Animation.js";
import { TRANSPARENT } from "../utils/color.js";
import { assertPositiveInt } from "../utils/validation.js";

export interface SpriteSheetLayout {
  /** Width of each cell/sprite in pixels */
  cellWidth: number;
  /** Height of each cell/sprite in pixels */
  cellHeight: number;
  /** Number of columns (auto-calculated if omitted) */
  columns?: number;
  /** Number of rows (auto-calculated if omitted) */
  rows?: number;
  /** Horizontal padding between cells (default: 0) */
  paddingX?: number;
  /** Vertical padding between cells (default: 0) */
  paddingY?: number;
  /** Margin around the entire sheet (default: 0) */
  margin?: number;
}

export interface SpriteSheetJSON {
  /** Sheet dimensions */
  width: number;
  height: number;
  /** Layout info */
  layout: SpriteSheetLayout;
  /** Number of sprites */
  count: number;
  /** All pixel data as flat array */
  data: string[];
}

export class SpriteSheet {
  private sprites: PixelSprite[];
  private layout: Required<SpriteSheetLayout>;

  constructor(sprites: PixelSprite[], layout: SpriteSheetLayout) {
    if (!sprites || sprites.length === 0) {
      throw new Error("SpriteSheet must have at least one sprite");
    }

    assertPositiveInt(layout.cellWidth, "cellWidth");
    assertPositiveInt(layout.cellHeight, "cellHeight");

    // Validate all sprites match cell dimensions
    for (let i = 0; i < sprites.length; i++) {
      const s = sprites[i];
      if (s.getWidth() !== layout.cellWidth || s.getHeight() !== layout.cellHeight) {
        throw new Error(
          `Sprite ${i} dimensions (${s.getWidth()}×${s.getHeight()}) don't match cell size (${layout.cellWidth}×${layout.cellHeight})`,
        );
      }
    }

    const paddingX = layout.paddingX ?? 0;
    const paddingY = layout.paddingY ?? 0;
    const margin = layout.margin ?? 0;

    // Auto-calculate columns/rows
    let columns = layout.columns;
    let rows = layout.rows;

    if (columns && rows) {
      if (columns * rows < sprites.length) {
        throw new Error(
          `Grid ${columns}×${rows} = ${columns * rows} cells, but ${sprites.length} sprites provided`,
        );
      }
    } else if (columns) {
      rows = Math.ceil(sprites.length / columns);
    } else if (rows) {
      columns = Math.ceil(sprites.length / rows);
    } else {
      // Auto: try to make roughly square
      columns = Math.ceil(Math.sqrt(sprites.length));
      rows = Math.ceil(sprites.length / columns);
    }

    this.sprites = sprites.map((s) => s.clone());
    this.layout = {
      cellWidth: layout.cellWidth,
      cellHeight: layout.cellHeight,
      columns: columns!,
      rows: rows!,
      paddingX,
      paddingY,
      margin,
    };
  }

  // ─── Getters ─────────────────────────────────────────

  get count(): number {
    return this.sprites.length;
  }

  get columns(): number {
    return this.layout.columns;
  }

  get rows(): number {
    return this.layout.rows;
  }

  get cellWidth(): number {
    return this.layout.cellWidth;
  }

  get cellHeight(): number {
    return this.layout.cellHeight;
  }

  /** Total sheet width in pixels */
  get width(): number {
    const { cellWidth, columns, paddingX, margin } = this.layout;
    return margin * 2 + columns * cellWidth + (columns - 1) * paddingX;
  }

  /** Total sheet height in pixels */
  get height(): number {
    const { cellHeight, rows, paddingY, margin } = this.layout;
    return margin * 2 + rows * cellHeight + (rows - 1) * paddingY;
  }

  // ─── Sprite Access ───────────────────────────────────

  /** Get sprite at index */
  getSprite(index: number): PixelSprite {
    if (index < 0 || index >= this.sprites.length) {
      throw new Error(
        `Sprite index ${index} out of range (0-${this.sprites.length - 1})`,
      );
    }
    return this.sprites[index];
  }

  /** Get sprite at grid position */
  getSpriteAt(col: number, row: number): PixelSprite {
    const index = row * this.layout.columns + col;
    return this.getSprite(index);
  }

  /** Get all sprites */
  getSprites(): PixelSprite[] {
    return [...this.sprites];
  }

  // ─── Export ──────────────────────────────────────────

  /** Export the spritesheet as a single composite PixelSprite */
  toSprite(): PixelSprite {
    const { cellWidth, cellHeight, columns, paddingX, paddingY, margin } =
      this.layout;
    const sheetW = this.width;
    const sheetH = this.height;

    const sheet = PixelSprite.create({
      width: sheetW,
      height: sheetH,
      fill: TRANSPARENT,
    });

    for (let i = 0; i < this.sprites.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const startX = margin + col * (cellWidth + paddingX);
      const startY = margin + row * (cellHeight + paddingY);
      const spriteData = this.sprites[i].getData();

      for (let y = 0; y < cellHeight; y++) {
        for (let x = 0; x < cellWidth; x++) {
          const color = spriteData[y * cellWidth + x];
          if (color !== TRANSPARENT) {
            sheet.setPixel(startX + x, startY + y, color);
          }
        }
      }
    }

    return sheet;
  }

  /** Export as Animation (useful for frame-based spritesheets) */
  toAnimation(options: { fps?: number; loop?: boolean } = {}): Animation {
    return new Animation({
      frames: this.sprites.map((s) => s.clone()),
      fps: options.fps ?? 10,
      loop: options.loop ?? true,
    });
  }

  /** Render the sheet to an HTML5 Canvas */
  renderToCanvas(
    canvas: HTMLCanvasElement,
    options: { scale?: number; gridLines?: boolean; gridColor?: string } = {},
  ): void {
    const sheet = this.toSprite();
    sheet.renderToCanvas(canvas, { scale: options.scale ?? 1 });

    // Optionally draw grid lines
    if (options.gridLines) {
      const scale = options.scale ?? 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = options.gridColor ?? "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 1;

      const { cellWidth, cellHeight, columns, rows, paddingX, paddingY, margin } =
        this.layout;

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
          const x = (margin + col * (cellWidth + paddingX)) * scale;
          const y = (margin + row * (cellHeight + paddingY)) * scale;

          if (col <= columns) {
            ctx.strokeRect(
              x,
              (margin + row * (cellHeight + paddingY) - (row > 0 ? paddingY : 0)) * scale,
              cellWidth * scale,
              cellHeight * scale,
            );
          }
        }
      }
    }
  }

  /** Export as SVG */
  toSVG(options: { pixelSize?: number } = {}): string {
    return this.toSprite().toSVG(options);
  }

  /** Export as JSON (serializable) */
  toJSON(): SpriteSheetJSON {
    const sheet = this.toSprite();
    return {
      width: this.width,
      height: this.height,
      layout: { ...this.layout },
      count: this.sprites.length,
      data: sheet.getData(),
    };
  }

  // ─── Import (Static Factories) ──────────────────────

  /** Create from array of sprites */
  static fromSprites(sprites: PixelSprite[], layout?: Partial<SpriteSheetLayout>): SpriteSheet {
    if (!sprites.length) throw new Error("No sprites provided");
    const first = sprites[0];
    return new SpriteSheet(sprites, {
      cellWidth: layout?.cellWidth ?? first.getWidth(),
      cellHeight: layout?.cellHeight ?? first.getHeight(),
      ...layout,
    });
  }

  /** Create from an Animation's frames */
  static fromAnimation(animation: Animation, layout?: Partial<SpriteSheetLayout>): SpriteSheet {
    const frames = animation.getFrames();
    if (!frames.length) throw new Error("Animation has no frames");
    return SpriteSheet.fromSprites(frames, layout);
  }

  /**
   * Import: Extract sprites from a composite sprite (spritesheet image).
   * The source sprite is sliced into cells based on layout.
   */
  static fromComposite(
    source: PixelSprite,
    layout: SpriteSheetLayout,
  ): SpriteSheet {
    assertPositiveInt(layout.cellWidth, "cellWidth");
    assertPositiveInt(layout.cellHeight, "cellHeight");

    const paddingX = layout.paddingX ?? 0;
    const paddingY = layout.paddingY ?? 0;
    const margin = layout.margin ?? 0;

    const srcW = source.getWidth();
    const srcH = source.getHeight();
    const srcData = source.getData();

    // Calculate how many cells fit
    const effectiveW = srcW - margin * 2;
    const effectiveH = srcH - margin * 2;

    const columns =
      layout.columns ??
      Math.floor(
        (effectiveW + paddingX) / (layout.cellWidth + paddingX),
      );
    const rows =
      layout.rows ??
      Math.floor(
        (effectiveH + paddingY) / (layout.cellHeight + paddingY),
      );

    if (columns <= 0 || rows <= 0) {
      throw new Error(
        `Source sprite ${srcW}×${srcH} is too small for cell size ${layout.cellWidth}×${layout.cellHeight}`,
      );
    }

    const sprites: PixelSprite[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const startX = margin + col * (layout.cellWidth + paddingX);
        const startY = margin + row * (layout.cellHeight + paddingY);

        const cellData: string[] = [];
        for (let y = 0; y < layout.cellHeight; y++) {
          for (let x = 0; x < layout.cellWidth; x++) {
            const sx = startX + x;
            const sy = startY + y;
            if (sx < srcW && sy < srcH) {
              cellData.push(srcData[sy * srcW + sx]);
            } else {
              cellData.push(TRANSPARENT);
            }
          }
        }

        const sprite = PixelSprite.create({
          width: layout.cellWidth,
          height: layout.cellHeight,
        });
        // Set data by pixel — we need to use the internal method
        for (let y = 0; y < layout.cellHeight; y++) {
          for (let x = 0; x < layout.cellWidth; x++) {
            sprite.setPixel(x, y, cellData[y * layout.cellWidth + x]);
          }
        }
        sprites.push(sprite);
      }
    }

    return new SpriteSheet(sprites, {
      ...layout,
      columns,
      rows,
    });
  }

  /** Import from JSON */
  static fromJSON(json: SpriteSheetJSON): SpriteSheet {
    const source = PixelSprite.fromGrid({
      width: json.width,
      height: json.height,
      data: json.data,
    });
    return SpriteSheet.fromComposite(source, json.layout);
  }

  /** Parse from JSON string */
  static parse(jsonString: string): SpriteSheet {
    return SpriteSheet.fromJSON(JSON.parse(jsonString));
  }
}
