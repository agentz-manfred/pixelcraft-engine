/**
 * PixelCraft Engine
 *
 * Lightweight pixel art engine for sprites, animations, and palettes.
 * Canvas/PNG/GIF/SVG rendering. Zero dependencies.
 *
 * @example
 * ```ts
 * import { PixelSprite, Palette, Animation } from "pixelcraft-engine";
 *
 * const sprite = PixelSprite.fromGrid({
 *   width: 4, height: 4,
 *   palette: ["#000", "#fff"],
 *   data: [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0],
 * });
 *
 * sprite.renderToCanvas(document.querySelector("canvas")!, { scale: 8 });
 * ```
 */

// Core
export { PixelSprite } from "./core/PixelSprite.js";
export type { SpriteGridOptions, SpriteCreateOptions, SpriteJSON } from "./core/PixelSprite.js";

export { PixelBuffer } from "./core/PixelBuffer.js";

export { Palette } from "./core/Palette.js";
export type { PaletteJSON } from "./core/Palette.js";

export { Animation } from "./core/Animation.js";
export type { AnimationFrame, AnimationOptions } from "./core/Animation.js";

// Renderers
export { renderToCanvas } from "./renderers/CanvasRenderer.js";
export type { CanvasRenderOptions } from "./renderers/CanvasRenderer.js";

export { renderToSVG, renderSVGToElement } from "./renderers/SVGRenderer.js";
export type { SVGRenderOptions } from "./renderers/SVGRenderer.js";

export { renderToPNGDataURL, renderToPNG } from "./renderers/PNGRenderer.js";
export type { PNGRenderOptions } from "./renderers/PNGRenderer.js";

export {
  encodeGIF,
  encodeAnimatedGIF,
  spriteToGIFDataURL,
  animationToGIFDataURL,
} from "./renderers/GIFRenderer.js";
export type { GIFOptions } from "./renderers/GIFRenderer.js";

// Formats
export { spriteFromJSON, animationFromJSON, animationFromObject } from "./formats/JSONFormat.js";
export type { AnimationJSON } from "./formats/JSONFormat.js";

export { SpriteSheet } from "./formats/SpriteSheet.js";
export type { SpriteSheetLayout, SpriteSheetJSON } from "./formats/SpriteSheet.js";

// Utils
export { normalizeHex, hexToRGB, rgbToHex, hexToHSL, isValidHex, TRANSPARENT } from "./utils/color.js";
export type { RGB, HSL } from "./utils/color.js";
