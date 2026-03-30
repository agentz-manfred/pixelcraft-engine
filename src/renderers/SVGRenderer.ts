/**
 * SVGRenderer — Render sprites as scalable SVG
 */

import { PixelSprite } from "../core/PixelSprite.js";

export interface SVGRenderOptions {
  pixelSize?: number;
  className?: string;
  id?: string;
}

/** Render sprite to SVG string */
export function renderToSVG(
  sprite: PixelSprite,
  options: SVGRenderOptions = {},
): string {
  return sprite.toSVG(options);
}

/** Render sprite and insert into a DOM element */
export function renderSVGToElement(
  sprite: PixelSprite,
  element: HTMLElement,
  options: SVGRenderOptions = {},
): SVGSVGElement {
  const svgString = sprite.toSVG(options);
  element.innerHTML = svgString;
  return element.querySelector("svg") as SVGSVGElement;
}
