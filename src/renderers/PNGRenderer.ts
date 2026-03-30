/**
 * PNGRenderer — Render sprites as PNG via Canvas
 *
 * Note: requires DOM (browser or jsdom). Use PixelSprite.toPNG()/toPNGDataURL()
 * for direct access from sprites.
 */

import { PixelSprite } from "../core/PixelSprite.js";

export interface PNGRenderOptions {
  scale?: number;
}

/** Render sprite to PNG data URL */
export function renderToPNGDataURL(
  sprite: PixelSprite,
  options: PNGRenderOptions = {},
): string {
  const canvas = document.createElement("canvas");
  sprite.renderToCanvas(canvas, { scale: options.scale ?? 1 });
  return canvas.toDataURL("image/png");
}

/** Render sprite to PNG Blob */
export async function renderToPNG(
  sprite: PixelSprite,
  options: PNGRenderOptions = {},
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  sprite.renderToCanvas(canvas, { scale: options.scale ?? 1 });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create PNG blob"));
    }, "image/png");
  });
}
