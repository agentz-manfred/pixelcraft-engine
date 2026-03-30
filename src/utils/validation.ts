/**
 * Input validation helpers
 */

export function assertPositiveInt(
  value: number,
  name: string,
): asserts value is number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, got ${value}`);
  }
}

export function assertNonNegativeInt(
  value: number,
  name: string,
): asserts value is number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${name} must be a non-negative integer, got ${value}`,
    );
  }
}

export function assertInRange(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  if (value < min || value > max) {
    throw new Error(
      `${name} must be between ${min} and ${max}, got ${value}`,
    );
  }
}

export function assertPositiveNumber(
  value: number,
  name: string,
): asserts value is number {
  if (typeof value !== "number" || value <= 0 || !isFinite(value)) {
    throw new Error(`${name} must be a positive number, got ${value}`);
  }
}
