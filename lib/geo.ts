/** Shared map coordinate helpers — safe to import from server and client code. */

/** Fallback view for listings that have no coordinates yet (Palo Alto, CA). */
export const DEFAULT_MAP_CENTER: [number, number] = [37.4419, -122.143];

/** Zoom used when a listing has real coordinates */
export const PROPERTY_ZOOM = 15;

/** Zoom used for the "no coordinates yet" overview */
export const FALLBACK_ZOOM = 11;

/** ~11 cm of precision — more decimals than that is noise in a form field */
export function roundCoordinate(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * Reads a coordinate typed into a text input. Returns null for anything that
 * isn't a complete number, so a half-typed "-" or "12." leaves the map alone.
 */
export function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Turns a stored coordinate back into the string the form input holds */
export function coordinateToInput(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}
