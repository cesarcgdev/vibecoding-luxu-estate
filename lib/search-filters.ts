import type { Dictionary, Locale } from "./i18n/dictionaries";
import { rentalKindIcon, rentalKindLabel } from "./rental-kinds";
import { formatCurrency, type Currency } from "./currency/currency";

/**
 * The categories a search suggestion can belong to.
 *
 * "kind" is the rental modality and only appears on /rent. There is no
 * buy-vs-rent facet any more: each listing page shows one operation, so a
 * suggestion reading "For sale (57)" on a page of nothing but sales told the
 * visitor nothing.
 */
export type FacetKind = "type" | "zone" | "beds" | "kind";

export interface Facet {
  kind: FacetKind;
  /** Raw value written to the URL — never translated */
  value: string;
  count: number;
}

/** Property types, inferred from the title since there is no property_type column */
export const PROPERTY_TYPES = ["House", "Apartment", "Villa", "Penthouse"];

/** Which search param each facet kind writes to */
export const PARAM_BY_KIND: Record<FacetKind, string> = {
  type: "type",
  zone: "location",
  beds: "beds",
  kind: "kind",
};

export const ICON_BY_KIND: Record<FacetKind, string> = {
  type: "home_work",
  zone: "location_on",
  beds: "bed",
  kind: "category",
};

/** Each rental modality has its own glyph, so it wins over the group default */
export function facetIcon(facet: Facet): string {
  return facet.kind === "kind"
    ? rentalKindIcon(facet.value)
    : ICON_BY_KIND[facet.kind];
}

/**
 * Fired by the navbar magnifier when the search bar is already on screen, so it
 * can take focus instead of triggering a pointless navigation.
 */
export const FOCUS_SEARCH_EVENT = "luxestate:focus-search";

/** Lowercases and strips accents so "atico" matches "Ático" */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Which listing page a set of filters belongs to */
export type FilterVariant = "sale" | "rent";

/**
 * Sale prices are abbreviated because they run to seven figures. Rents do not:
 * rounding 1,200 to "$1K" loses the only digits a tenant is comparing.
 */
function formatPrice(
  value: number,
  variant: FilterVariant,
  currency: Currency,
  locale: Locale | string
): string {
  return formatCurrency(value, currency, locale, variant === "rent" ? "full" : "abbreviated")!;
}

/** Translates a facet for display — zone names are place names and stay as-is */
export function facetLabel(facet: Facet, dictionary: Dictionary): string {
  switch (facet.kind) {
    case "type":
      return translateType(facet.value, dictionary);
    case "zone":
      return facet.value;
    case "beds":
      return dictionary.search.bedsPlus.replace("{n}", facet.value);
    case "kind":
      return rentalKindLabel(facet.value, dictionary);
  }
}

export function translateType(value: string, dictionary: Dictionary): string {
  const labels: Record<string, string> = {
    House: dictionary.filters.house,
    Apartment: dictionary.filters.apartment,
    Villa: dictionary.filters.villa,
    Penthouse: dictionary.filters.penthouse,
  };
  return labels[value] ?? value;
}

export function groupHeading(kind: FacetKind, dictionary: Dictionary): string {
  switch (kind) {
    case "type":
      return dictionary.search.typesGroup;
    case "zone":
      return dictionary.search.zonesGroup;
    case "beds":
      return dictionary.search.bedsGroup;
    case "kind":
      return dictionary.search.kindGroup;
  }
}

/** A criterion currently applied to the listing, rendered as a removable chip */
export interface ActiveFilter {
  /** Search params dropped when this chip is dismissed */
  params: string[];
  label: string;
  icon: string;
}

/**
 * Reads every filter currently in the URL — including the ones set from
 * FiltersModal — so the search bar and the empty state describe the same thing.
 */
export function buildActiveFilters(
  searchParams: URLSearchParams,
  dictionary: Dictionary,
  variant: FilterVariant = "sale",
  currency: Currency = "USD",
  locale: Locale | string = "en"
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const q = searchParams.get("q");
  if (q) {
    filters.push({
      params: ["q"],
      label: dictionary.search.textChip.replace("{q}", q),
      icon: "search",
    });
  }

  const type = searchParams.get("type");
  if (type) {
    filters.push({
      params: ["type"],
      label: translateType(type, dictionary),
      icon: ICON_BY_KIND.type,
    });
  }

  const location = searchParams.get("location");
  if (location) {
    filters.push({
      params: ["location"],
      label: location,
      icon: ICON_BY_KIND.zone,
    });
  }

  const beds = searchParams.get("beds");
  if (beds && beds !== "0") {
    filters.push({
      params: ["beds"],
      label: dictionary.search.bedsPlus.replace("{n}", beds),
      icon: ICON_BY_KIND.beds,
    });
  }

  const baths = searchParams.get("baths");
  if (baths && baths !== "0") {
    filters.push({
      params: ["baths"],
      label: dictionary.search.bathsPlus.replace("{n}", baths),
      icon: "bathtub",
    });
  }

  // Rental criteria. They only ever reach the URL from /rent, but reading them
  // unconditionally keeps this the one place that describes a filtered listing.
  const kind = searchParams.get("kind");
  if (kind) {
    filters.push({
      params: ["kind"],
      label: rentalKindLabel(kind, dictionary),
      icon: rentalKindIcon(kind),
    });
  }

  const minStay = searchParams.get("minStay");
  if (minStay) {
    filters.push({
      params: ["minStay"],
      label: dictionary.rent.minStayChip.replace("{n}", minStay),
      icon: "schedule",
    });
  }

  const maxDeposit = searchParams.get("maxDeposit");
  if (maxDeposit) {
    filters.push({
      params: ["maxDeposit"],
      label: dictionary.rent.depositValue.replace("{n}", maxDeposit),
      icon: "savings",
    });
  }

  if (searchParams.get("furnished") === "true") {
    filters.push({
      params: ["furnished"],
      label: dictionary.rent.furnished,
      icon: "chair",
    });
  }

  if (searchParams.get("utilities") === "true") {
    filters.push({
      params: ["utilities"],
      label: dictionary.rent.utilitiesIncluded,
      icon: "bolt",
    });
  }

  const availableFrom = searchParams.get("availableFrom");
  if (availableFrom) {
    filters.push({
      params: ["availableFrom"],
      label: dictionary.rent.availableChip.replace("{date}", availableFrom),
      icon: "event_available",
    });
  }

  // Price comes from the filters modal as two params but reads as one criterion
  const minPrice = parseInt(searchParams.get("minPrice") || "", 10);
  const maxPrice = parseInt(searchParams.get("maxPrice") || "", 10);
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    let range: string;
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      range = `${formatPrice(minPrice, variant, currency, locale)} – ${formatPrice(maxPrice, variant, currency, locale)}`;
    } else if (!isNaN(minPrice)) {
      range = `${formatPrice(minPrice, variant, currency, locale)}+`;
    } else {
      range = `≤ ${formatPrice(maxPrice, variant, currency, locale)}`;
    }
    // A rent range is per month; a sale price is not
    if (variant === "rent") range += dictionary.rent.perMonth;
    filters.push({
      params: ["minPrice", "maxPrice"],
      label: dictionary.search.priceChip.replace("{range}", range),
      icon: "payments",
    });
  }

  return filters;
}
