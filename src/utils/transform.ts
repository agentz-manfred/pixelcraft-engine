/**
 * Pixel buffer transformation utilities
 */

/** Flip pixel data horizontally */
export function flipHorizontal(
  data: string[],
  width: number,
  height: number,
): string[] {
  const result = new Array<string>(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[y * width + x] = data[y * width + (width - 1 - x)];
    }
  }
  return result;
}

/** Flip pixel data vertically */
export function flipVertical(
  data: string[],
  width: number,
  height: number,
): string[] {
  const result = new Array<string>(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[y * width + x] = data[(height - 1 - y) * width + x];
    }
  }
  return result;
}

/** Rotate 90° clockwise. Returns [newData, newWidth, newHeight] */
export function rotate90(
  data: string[],
  width: number,
  height: number,
): [string[], number, number] {
  const newWidth = height;
  const newHeight = width;
  const result = new Array<string>(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[x * newWidth + (height - 1 - y)] = data[y * width + x];
    }
  }
  return [result, newWidth, newHeight];
}

/** Rotate 180° */
export function rotate180(
  data: string[],
  _width: number,
  _height: number,
): string[] {
  return [...data].reverse();
}

/** Rotate 270° clockwise (= 90° counter-clockwise) */
export function rotate270(
  data: string[],
  width: number,
  height: number,
): [string[], number, number] {
  const newWidth = height;
  const newHeight = width;
  const result = new Array<string>(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[(width - 1 - x) * newWidth + y] = data[y * width + x];
    }
  }
  return [result, newWidth, newHeight];
}

/** Scale pixel data by integer factor (nearest-neighbor) */
export function scaleUp(
  data: string[],
  width: number,
  height: number,
  factor: number,
): [string[], number, number] {
  if (factor < 1 || !Number.isInteger(factor)) {
    throw new Error(`Scale factor must be a positive integer, got ${factor}`);
  }
  const newWidth = width * factor;
  const newHeight = height * factor;
  const result = new Array<string>(newWidth * newHeight);
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x / factor);
      const srcY = Math.floor(y / factor);
      result[y * newWidth + x] = data[srcY * width + srcX];
    }
  }
  return [result, newWidth, newHeight];
}
