/**
 * GIFRenderer — GIF89a encoder with LZW compression
 *
 * Zero external dependencies. Supports:
 * - Single-frame GIFs
 * - Animated GIFs with per-frame delay
 * - Transparency
 * - Up to 256 colors per frame (auto color quantization)
 *
 * Spec reference: https://www.w3.org/Graphics/GIF/spec-gif89a.txt
 */

import { PixelSprite } from "../core/PixelSprite.js";
import { Animation } from "../core/Animation.js";
import { hexToRGB, TRANSPARENT } from "../utils/color.js";

export interface GIFOptions {
  /** Pixel scale factor (default: 1) */
  scale?: number;
  /** Loop count: 0 = infinite (default), n = loop n times */
  loop?: number;
  /** Default frame delay in ms (default: 100) */
  delay?: number;
}

interface ColorEntry {
  r: number;
  g: number;
  b: number;
}

// ─── LZW Encoder ──────────────────────────────────────────

/**
 * LZW compression for GIF.
 * Takes indexed pixel data and minimum code size, returns compressed bytes.
 */
function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  // Output buffer — we'll grow it as needed
  let output: number[] = [];
  let bitBuf = 0;
  let bitCount = 0;

  function writeBits(code: number, codeSize: number): void {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      output.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  }

  function flushBits(): void {
    if (bitCount > 0) {
      output.push(bitBuf & 0xff);
    }
    bitBuf = 0;
    bitCount = 0;
  }

  // Initialize code table
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxTableSize = 4096; // GIF limit: 12-bit codes

  // Code table: maps string keys to codes
  // For efficiency, we use a Map with composite keys
  let table = new Map<number, number>();

  function resetTable(): void {
    table.clear();
    for (let i = 0; i < clearCode; i++) {
      // Single-character entries are implicit (code = index)
    }
    nextCode = eoiCode + 1;
    codeSize = minCodeSize + 1;
  }

  // Helper: create a composite key for (prefix, suffix) pair
  // prefix can be up to 4095, suffix up to 255
  function makeKey(prefix: number, suffix: number): number {
    return (prefix << 8) | suffix;
  }

  // Begin encoding
  writeBits(clearCode, codeSize);
  resetTable();

  if (pixels.length === 0) {
    writeBits(eoiCode, codeSize);
    flushBits();
    return new Uint8Array(output);
  }

  let current = pixels[0]; // Start with first pixel as current "string"

  for (let i = 1; i < pixels.length; i++) {
    const next = pixels[i];
    const key = makeKey(current, next);

    if (table.has(key)) {
      // String + char exists in table, extend
      current = table.get(key)!;
    } else {
      // Output current code
      writeBits(current, codeSize);

      // Add new entry to table
      if (nextCode < maxTableSize) {
        table.set(key, nextCode);
        nextCode++;
        // Increase code size if needed
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        // Table full — emit clear code and reset
        writeBits(clearCode, codeSize);
        resetTable();
      }

      current = next;
    }
  }

  // Output remaining code
  writeBits(current, codeSize);
  writeBits(eoiCode, codeSize);
  flushBits();

  return new Uint8Array(output);
}

// ─── Color Quantization ──────────────────────────────────

/**
 * Build a color table from pixel data (max 256 colors).
 * Returns: [colorTable, indexedPixels, transparentIndex]
 *
 * If there are more than 255 opaque colors, we do a simple
 * median-cut-like quantization by truncating to 5 bits per channel.
 */
function buildColorTable(
  pixelData: string[],
  width: number,
  height: number,
  scale: number,
): {
  colorTable: ColorEntry[];
  indexedPixels: Uint8Array;
  transparentIndex: number;
  minCodeSize: number;
} {
  // Collect unique colors (scaled)
  const scaledW = width * scale;
  const scaledH = height * scale;
  const totalPixels = scaledW * scaledH;

  // Build scaled pixel array
  const scaledPixels: string[] = new Array(totalPixels);
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < scaledW; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      scaledPixels[y * scaledW + x] = pixelData[srcY * width + srcX];
    }
  }

  // Find unique colors
  const colorMap = new Map<string, number>(); // normalized hex -> index
  let hasTransparency = false;

  for (const pixel of scaledPixels) {
    if (pixel === TRANSPARENT || (pixel.length === 9 && pixel.endsWith("00"))) {
      hasTransparency = true;
      continue;
    }
    // Check alpha
    if (pixel.length === 9) {
      const alpha = parseInt(pixel.slice(7, 9), 16);
      if (alpha < 128) {
        hasTransparency = true;
        continue;
      }
    }
    const key = pixel.slice(0, 7); // strip alpha for color comparison
    if (!colorMap.has(key)) {
      colorMap.set(key, 0); // placeholder
    }
  }

  // Build color table
  const maxColors = hasTransparency ? 255 : 256;
  let colors: ColorEntry[];
  let colorLookup: Map<string, number>;

  if (colorMap.size <= maxColors) {
    // All colors fit — use exact mapping
    colors = [];
    colorLookup = new Map();
    let idx = hasTransparency ? 1 : 0; // Reserve 0 for transparency if needed
    for (const hex of colorMap.keys()) {
      const rgb = hexToRGB(hex);
      colors.push({ r: rgb.r, g: rgb.g, b: rgb.b });
      colorLookup.set(hex, idx);
      idx++;
    }
  } else {
    // Too many colors — quantize by truncating to fewer bits
    colorLookup = new Map();
    const quantized = new Map<string, ColorEntry>();

    for (const hex of colorMap.keys()) {
      const rgb = hexToRGB(hex);
      // Truncate to 5 bits per channel (32 levels each = max 32768 combos)
      const qr = (rgb.r >> 3) << 3;
      const qg = (rgb.g >> 3) << 3;
      const qb = (rgb.b >> 3) << 3;
      const qkey = `${qr},${qg},${qb}`;
      if (!quantized.has(qkey)) {
        quantized.set(qkey, { r: qr, g: qg, b: qb });
      }
      colorLookup.set(hex, 0); // will be reassigned below
    }

    // If still too many, further reduce (4 bits)
    if (quantized.size > maxColors) {
      quantized.clear();
      for (const hex of colorMap.keys()) {
        const rgb = hexToRGB(hex);
        const qr = (rgb.r >> 4) << 4;
        const qg = (rgb.g >> 4) << 4;
        const qb = (rgb.b >> 4) << 4;
        const qkey = `${qr},${qg},${qb}`;
        if (!quantized.has(qkey)) {
          quantized.set(qkey, { r: qr, g: qg, b: qb });
        }
      }
    }

    // Still too many? Brute force: take first 255
    colors = [...quantized.values()].slice(0, maxColors);

    // Build nearest-color lookup
    const startIdx = hasTransparency ? 1 : 0;
    const indexedColors: Array<{ r: number; g: number; b: number; idx: number }> = [];
    for (let i = 0; i < colors.length; i++) {
      indexedColors.push({ ...colors[i], idx: i + startIdx });
    }

    // Re-map all original colors to nearest quantized color
    for (const hex of colorMap.keys()) {
      const rgb = hexToRGB(hex);
      let bestIdx = startIdx;
      let bestDist = Infinity;
      for (const ic of indexedColors) {
        const dr = rgb.r - ic.r;
        const dg = rgb.g - ic.g;
        const db = rgb.b - ic.b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = ic.idx;
        }
      }
      colorLookup.set(hex, bestIdx);
    }
  }

  // Determine color table size (must be power of 2, min 2)
  const transparentIndex = hasTransparency ? 0 : -1;
  const totalColors = colors.length + (hasTransparency ? 1 : 0);
  let tableSize = 2;
  while (tableSize < totalColors) tableSize *= 2;
  if (tableSize > 256) tableSize = 256;

  // Build final color table with padding
  const finalTable: ColorEntry[] = new Array(tableSize).fill(null).map(() => ({
    r: 0,
    g: 0,
    b: 0,
  }));

  const startIdx = hasTransparency ? 1 : 0;
  for (let i = 0; i < colors.length && i + startIdx < tableSize; i++) {
    finalTable[i + startIdx] = colors[i];
  }

  // Build indexed pixel data
  const indexed = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const pixel = scaledPixels[i];
    if (
      pixel === TRANSPARENT ||
      (pixel.length === 9 && parseInt(pixel.slice(7, 9), 16) < 128)
    ) {
      indexed[i] = transparentIndex >= 0 ? transparentIndex : 0;
    } else {
      const key = pixel.slice(0, 7);
      indexed[i] = colorLookup.get(key) ?? 0;
    }
  }

  // Min code size = bits needed for color table
  const bits = Math.max(2, Math.ceil(Math.log2(tableSize)));
  return {
    colorTable: finalTable,
    indexedPixels: indexed,
    transparentIndex,
    minCodeSize: bits,
  };
}

// ─── GIF Binary Writer ───────────────────────────────────

class GIFWriter {
  private parts: Uint8Array[] = [];

  writeBytes(...bytes: number[]): void {
    this.parts.push(new Uint8Array(bytes));
  }

  writeUint16LE(value: number): void {
    this.writeBytes(value & 0xff, (value >> 8) & 0xff);
  }

  writeString(str: string): void {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    this.parts.push(bytes);
  }

  writeChunk(data: Uint8Array): void {
    this.parts.push(data);
  }

  /** Write LZW data as sub-blocks (max 255 bytes each) */
  writeSubBlocks(data: Uint8Array): void {
    let offset = 0;
    while (offset < data.length) {
      const chunkSize = Math.min(255, data.length - offset);
      this.writeBytes(chunkSize);
      this.parts.push(data.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }
    this.writeBytes(0); // Block terminator
  }

  toUint8Array(): Uint8Array {
    const totalLen = this.parts.reduce((s, p) => s + p.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const part of this.parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }
}

// ─── Public API ──────────────────────────────────────────

/**
 * Encode a single sprite as a GIF image.
 * Returns raw GIF bytes.
 */
export function encodeGIF(sprite: PixelSprite, options: GIFOptions = {}): Uint8Array {
  const { scale = 1 } = options;
  const w = sprite.getWidth();
  const h = sprite.getHeight();
  const pixelData = sprite.getData();

  const { colorTable, indexedPixels, transparentIndex, minCodeSize } =
    buildColorTable(pixelData, w, h, scale);

  const gif = new GIFWriter();
  const canvasW = w * scale;
  const canvasH = h * scale;

  // Header
  gif.writeString("GIF89a");

  // Logical Screen Descriptor
  gif.writeUint16LE(canvasW);
  gif.writeUint16LE(canvasH);
  const colorBits = Math.ceil(Math.log2(colorTable.length));
  const packed = 0x80 | ((colorBits - 1) << 4) | (colorBits - 1);
  gif.writeBytes(packed); // packed: global color table flag + size
  gif.writeBytes(0); // background color index
  gif.writeBytes(0); // pixel aspect ratio

  // Global Color Table
  for (const color of colorTable) {
    gif.writeBytes(color.r, color.g, color.b);
  }

  // Graphic Control Extension (for transparency)
  if (transparentIndex >= 0) {
    gif.writeBytes(0x21, 0xf9, 0x04);
    gif.writeBytes(0x01); // transparent color flag
    gif.writeUint16LE(0); // delay
    gif.writeBytes(transparentIndex);
    gif.writeBytes(0x00); // terminator
  }

  // Image Descriptor
  gif.writeBytes(0x2c); // image separator
  gif.writeUint16LE(0); // left
  gif.writeUint16LE(0); // top
  gif.writeUint16LE(canvasW);
  gif.writeUint16LE(canvasH);
  gif.writeBytes(0x00); // no local color table, no interlace

  // Image Data (LZW)
  gif.writeBytes(minCodeSize);
  const compressed = lzwEncode(indexedPixels, minCodeSize);
  gif.writeSubBlocks(compressed);

  // Trailer
  gif.writeBytes(0x3b);

  return gif.toUint8Array();
}

/**
 * Encode an animation as an animated GIF.
 * Returns raw GIF bytes.
 */
export function encodeAnimatedGIF(
  animation: Animation,
  options: GIFOptions = {},
): Uint8Array {
  const { scale = 1, loop = 0, delay } = options;
  const frames = animation.getFrames();

  if (frames.length === 0) {
    throw new Error("Animation has no frames");
  }

  const firstFrame = frames[0];
  const w = firstFrame.getWidth();
  const h = firstFrame.getHeight();
  const canvasW = w * scale;
  const canvasH = h * scale;

  // Pre-compute all frame color tables
  const frameDatas = frames.map((frame) => {
    if (frame.getWidth() !== w || frame.getHeight() !== h) {
      throw new Error(
        `All frames must have the same dimensions. Expected ${w}×${h}, got ${frame.getWidth()}×${frame.getHeight()}`,
      );
    }
    return buildColorTable(frame.getData(), w, h, scale);
  });

  const gif = new GIFWriter();

  // Header
  gif.writeString("GIF89a");

  // Logical Screen Descriptor — use first frame's color table as global
  gif.writeUint16LE(canvasW);
  gif.writeUint16LE(canvasH);
  const colorBits = Math.ceil(Math.log2(frameDatas[0].colorTable.length));
  const packed = 0x80 | ((colorBits - 1) << 4) | (colorBits - 1);
  gif.writeBytes(packed);
  gif.writeBytes(0);
  gif.writeBytes(0);

  // Global Color Table (from first frame)
  for (const color of frameDatas[0].colorTable) {
    gif.writeBytes(color.r, color.g, color.b);
  }

  // Netscape Looping Application Extension
  gif.writeBytes(0x21, 0xff, 0x0b);
  gif.writeString("NETSCAPE2.0");
  gif.writeBytes(0x03, 0x01);
  gif.writeUint16LE(loop); // loop count (0 = infinite)
  gif.writeBytes(0x00);

  // Default frame delay
  const defaultDelayMs = delay ?? Math.round(1000 / animation.fps);

  // Write each frame
  for (let i = 0; i < frames.length; i++) {
    const fd = frameDatas[i];
    const frameDelayMs = defaultDelayMs; // Could add per-frame override
    const delayCs = Math.max(1, Math.round(frameDelayMs / 10)); // GIF uses centiseconds

    // Graphic Control Extension
    gif.writeBytes(0x21, 0xf9, 0x04);
    const disposalMethod = 2; // Restore to background
    let gceFlags = (disposalMethod << 2);
    if (fd.transparentIndex >= 0) {
      gceFlags |= 0x01; // transparent color flag
    }
    gif.writeBytes(gceFlags);
    gif.writeUint16LE(delayCs);
    gif.writeBytes(fd.transparentIndex >= 0 ? fd.transparentIndex : 0);
    gif.writeBytes(0x00);

    // Image Descriptor
    gif.writeBytes(0x2c);
    gif.writeUint16LE(0); // left
    gif.writeUint16LE(0); // top
    gif.writeUint16LE(canvasW);
    gif.writeUint16LE(canvasH);

    // Use local color table if different from global (frame > 0)
    if (i > 0) {
      const localBits = Math.ceil(Math.log2(fd.colorTable.length));
      gif.writeBytes(0x80 | (localBits - 1)); // local color table flag
      for (const color of fd.colorTable) {
        gif.writeBytes(color.r, color.g, color.b);
      }
    } else {
      gif.writeBytes(0x00); // use global color table
    }

    // Image Data
    gif.writeBytes(fd.minCodeSize);
    const compressed = lzwEncode(fd.indexedPixels, fd.minCodeSize);
    gif.writeSubBlocks(compressed);
  }

  // Trailer
  gif.writeBytes(0x3b);

  return gif.toUint8Array();
}

/**
 * Convenience: encode sprite to GIF and return as base64 data URL
 */
export function spriteToGIFDataURL(sprite: PixelSprite, options: GIFOptions = {}): string {
  const bytes = encodeGIF(sprite, options);
  return "data:image/gif;base64," + uint8ToBase64(bytes);
}

/**
 * Convenience: encode animation to GIF and return as base64 data URL
 */
export function animationToGIFDataURL(
  animation: Animation,
  options: GIFOptions = {},
): string {
  const bytes = encodeAnimatedGIF(animation, options);
  return "data:image/gif;base64," + uint8ToBase64(bytes);
}

// ─── Base64 Utility ──────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  // Works in both browser and Node.js
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  // Node.js fallback (globalThis.Buffer)
  if (typeof globalThis !== "undefined" && (globalThis as any).Buffer) {
    return (globalThis as any).Buffer.from(bytes).toString("base64");
  }
  throw new Error("No base64 encoder available (neither btoa nor Buffer found)");
}
