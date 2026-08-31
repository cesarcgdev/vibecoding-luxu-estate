/**
 * The rental modality catalogue — the single source of truth shared by the
 * seed script, the admin form, the modality bar and the search facets.
 *
 * Kept free of any Supabase import so client components can use it too.
 */

import type { Dictionary } from "./i18n/dictionaries";

export type RentalKind =
  | "long"
  | "seasonal"
  | "student"
  | "room"
  | "vacation"
  | "commercial"
  | "coliving"
  | "rent_to_own"
  | "storage"
  | "corporate";

/** The unit price_value is quoted in */
export type PricePeriod = "month" | "night";

export interface RentalKindDefinition {
  /** Raw value written to the database and to the URL — never translated */
  value: RentalKind;
  /**
   * A modality determines how it is priced: a holiday let is quoted per night,
   * everything else per month. This is why a property carries one modality and
   * not several — two modalities would mean two price units on one listing.
   */
  pricePeriod: PricePeriod;
  icon: string;
}

export const RENTAL_KINDS: RentalKindDefinition[] = [
  { value: "long", pricePeriod: "month", icon: "calendar_month" },
  { value: "seasonal", pricePeriod: "month", icon: "date_range" },
  { value: "student", pricePeriod: "month", icon: "school" },
  { value: "room", pricePeriod: "month", icon: "single_bed" },
  { value: "coliving", pricePeriod: "month", icon: "diversity_3" },
  { value: "vacation", pricePeriod: "night", icon: "beach_access" },
  { value: "corporate", pricePeriod: "month", icon: "business_center" },
  { value: "rent_to_own", pricePeriod: "month", icon: "handshake" },
  { value: "commercial", pricePeriod: "month", icon: "storefront" },
  { value: "storage", pricePeriod: "month", icon: "warehouse" },
];

/**
 * Modalities that are not somewhere to live, so bedroom and bathroom counts
 * are meaningless on them and the cards hide those figures.
 */
const SPACE_ONLY_KINDS: RentalKind[] = ["storage", "commercial"];

export function isSpaceOnly(kind: string | null | undefined): boolean {
  return SPACE_ONLY_KINDS.includes(kind as RentalKind);
}

export const RENTAL_KIND_VALUES: string[] = RENTAL_KINDS.map((k) => k.value);

export function isRentalKind(value: string | null | undefined): value is RentalKind {
  return !!value && RENTAL_KIND_VALUES.includes(value);
}

export function pricePeriodFor(kind: RentalKind): PricePeriod {
  return RENTAL_KINDS.find((k) => k.value === kind)?.pricePeriod ?? "month";
}

export function rentalKindIcon(kind: string): string {
  return RENTAL_KINDS.find((k) => k.value === kind)?.icon ?? "home_work";
}

/** Translates a modality for display — falls back to the raw value */
export function rentalKindLabel(kind: string, dictionary: Dictionary): string {
  const labels = dictionary.rent?.kinds as Record<string, string> | undefined;
  return labels?.[kind] ?? kind;
}

/** Translates a period into the suffix shown after a price, e.g. "/mo" */
export function pricePeriodSuffix(
  period: PricePeriod | null | undefined,
  dictionary: Dictionary
): string {
  return period === "night"
    ? dictionary.rent?.perNight ?? "/night"
    : dictionary.rent?.perMonth ?? "/mo";
}

/**
 * Splits a stored price_display into the figure and its unit, so a card can
 * give the amount the weight and leave the unit quiet beside it.
 *
 * The unit is taken from price_period rather than from the stored string: the
 * string was written in English ("/mo") whichever language the visitor reads.
 * Anything the seed or the admin form appended after a slash is dropped.
 */
export function splitPriceDisplay(
  priceDisplay: string,
  pricePeriod: PricePeriod | null | undefined,
  dictionary: Dictionary
): { amount: string; unit: string | null } {
  const amount = priceDisplay.split("/")[0].trim();
  return {
    amount,
    unit: pricePeriod ? pricePeriodSuffix(pricePeriod, dictionary) : null,
  };
}
