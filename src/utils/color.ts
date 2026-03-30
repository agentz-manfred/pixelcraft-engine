/**
 * Color utilities — Hex ↔ RGB ↔ HSL conversion
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

/** Normalize any hex color to 8-char RRGGBBAA */
export function normalizeHex(hex: string): string {
  if (typeof hex !== "string") {
    throw new Error(`Invalid color: expected string, got ${typeof hex}`);
  }

  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);

  // Support: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  switch (h.length) {
    case 3:
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + "ff";
      break;
    case 4:
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      break;
    case 6:
      h = h + "ff";
      break;
    case 8:
      break;
    default:
      throw new Error(
        `Invalid hex color "${hex}": expected 3, 4, 6, or 8 hex digits`,
      );
  }

  if (!/^[0-9a-fA-F]{8}$/.test(h)) {
    throw new Error(`Invalid hex color "${hex}": contains non-hex characters`);
  }

  return "#" + h.toLowerCase();
}

export function hexToRGB(hex: string): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));
  const a = Math.round(Math.max(0, Math.min(255, (rgb.a ?? 1) * 255)));

  const hex =
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0") +
    (a < 255 ? a.toString(16).padStart(2, "0") : "");

  return hex;
}

export function hexToHSL(hex: string): HSL {
  const { r, g, b, a } = hexToRGB(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  };
}

/** Check if a string looks like a valid hex color */
export function isValidHex(value: string): boolean {
  try {
    normalizeHex(value);
    return true;
  } catch {
    return false;
  }
}

/** Transparent color constant */
export const TRANSPARENT = "#00000000";
