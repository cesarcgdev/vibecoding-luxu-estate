import type { Dictionary } from "./i18n/dictionaries";

/** The categories a search suggestion can belong to */
export type FacetKind = "type" | "zone" | "beds" | "listing";

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
  listing: "listing",
};

export const ICON_BY_KIND: Record<FacetKind, string> = {
  type: "home_work",
  zone: "location_on",
  beds: "bed",
  listing: "sell",
};

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

function formatPrice(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
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
    case "listing":
      return facet.value === "rent"
        ? dictionary.home.filterRent
        : dictionary.home.filterBuy;
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
    case "listing":
      return dictionary.search.listingGroup;
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
  dictionary: Dictionary
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

  const listing = searchParams.get("listing");
  if (listing) {
    filters.push({
      params: ["listing"],
      label:
        listing === "rent" ? dictionary.home.filterRent : dictionary.home.filterBuy,
      icon: ICON_BY_KIND.listing,
    });
  }

  // Price comes from the filters modal as two params but reads as one criterion
  const minPrice = parseInt(searchParams.get("minPrice") || "", 10);
  const maxPrice = parseInt(searchParams.get("maxPrice") || "", 10);
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    let range: string;
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      range = `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
    } else if (!isNaN(minPrice)) {
      range = `${formatPrice(minPrice)}+`;
    } else {
      range = `≤ ${formatPrice(maxPrice)}`;
    }
    filters.push({
      params: ["minPrice", "maxPrice"],
      label: dictionary.search.priceChip.replace("{range}", range),
      icon: "payments",
    });
  }

  return filters;
}
