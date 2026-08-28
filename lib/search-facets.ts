import { supabase } from "./supabase";
import { describeSupabaseError } from "./supabase-errors";
import { MOCK_PROPERTIES } from "../data/mock-properties";
import { normalize, PROPERTY_TYPES, type Facet } from "./search-filters";

const MAX_BEDS_FACET = 5;

interface FacetSource {
  title: string;
  location: string;
  beds: number;
  listing_type: string | null;
}

/**
 * Builds the suggestion catalogue from every property the market listing can
 * show — Supabase rows plus the mock ones, the same combination
 * getMarketProperties makes, so the counts match what a search will return.
 */
export async function getSearchFacets(): Promise<Facet[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("title, location, beds, listing_type")
    .eq("is_featured", false);

  if (error) {
    // Not fatal — the mock properties still produce a usable suggestion list
    console.error("Error fetching search facets:", describeSupabaseError(error));
  }

  const properties: FacetSource[] = [
    ...((data as FacetSource[]) ?? []),
    ...MOCK_PROPERTIES,
  ];

  return [
    ...buildTypeFacets(properties),
    ...buildZoneFacets(properties),
    ...buildBedsFacets(properties),
    ...buildListingFacets(properties),
  ];
}

function buildTypeFacets(properties: FacetSource[]): Facet[] {
  return PROPERTY_TYPES.map((type) => ({
    kind: "type" as const,
    value: type,
    count: properties.filter((p) => normalize(p.title).includes(normalize(type)))
      .length,
  })).filter((facet) => facet.count > 0);
}

/** Location is a free-text "Neighborhood, City" — both halves are searchable zones */
function buildZoneFacets(properties: FacetSource[]): Facet[] {
  const counts = new Map<string, number>();

  for (const property of properties) {
    const zones = property.location
      .split(",")
      .map((zone) => zone.trim())
      .filter(Boolean);

    for (const zone of new Set(zones)) {
      counts.set(zone, (counts.get(zone) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ kind: "zone" as const, value, count }))
    .sort((a, b) => b.count - a.count);
}

function buildBedsFacets(properties: FacetSource[]): Facet[] {
  return Array.from({ length: MAX_BEDS_FACET }, (_, i) => i + 1)
    .map((beds) => ({
      kind: "beds" as const,
      value: beds.toString(),
      count: properties.filter((p) => p.beds >= beds).length,
    }))
    .filter((facet) => facet.count > 0);
}

function buildListingFacets(properties: FacetSource[]): Facet[] {
  return ["buy", "rent"]
    .map((listing) => ({
      kind: "listing" as const,
      value: listing,
      count: properties.filter((p) => p.listing_type === listing).length,
    }))
    .filter((facet) => facet.count > 0);
}
