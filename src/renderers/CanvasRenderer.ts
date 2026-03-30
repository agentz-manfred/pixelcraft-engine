/**
 * CanvasRenderer — Standalone canvas rendering utilities
 */

import { PixelSprite } from "../core/PixelSprite.js";

export interface CanvasRenderOptions {
  scale?: number;
  background?: string;
  gridLines?: boolean;
  gridColor?: string;
}

/** Render a sprite to a canvas with extra options */
export function renderToCanvas(
  sprite: PixelSprite,
  canvas: HTMLCanvasElement,
  options: CanvasRenderOptions = {},
): void {
  const { scale = 1, background, gridLines = false, gridColor = "#ccc" } = options;
  const w = sprite.getWidth();
  const h = sprite.getHeight();

  canvas.width = w * scale;
  canvas.height = h * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2d context");

  // Background
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Pixels
  sprite.renderToCanvas(canvas, { scale, clear: !background });

  // Grid overlay
  if (gridLines && scale >= 4) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, h * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(w * scale, y * scale);
      ctx.stroke();
    }
  }
}
