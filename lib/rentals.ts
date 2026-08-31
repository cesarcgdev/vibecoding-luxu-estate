import { supabase } from "./supabase";
import { describeSupabaseError } from "./supabase-errors";
import type { PaginatedProperties, Property } from "./properties";
import { RENTAL_KINDS } from "./rental-kinds";
import { normalize, PROPERTY_TYPES, type Facet } from "./search-filters";

const RENT = "rent";
const MAX_BEDS_FACET = 5;

/** Every criterion /rent can put in the URL */
export interface RentalFilters {
  q?: string;
  type?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  kind?: string;
  /** "I can commit to at most N months" — matches listings asking for N or less */
  minStay?: string;
  /** Ceiling on the deposit, in months of rent */
  maxDeposit?: string;
  furnished?: string;
  utilities?: string;
  availableFrom?: string;
}

function toInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A page of rental listings.
 *
 * Unlike getMarketProperties this talks to Supabase alone — no mock rows mixed
 * in. The generated ones carry sale-sized price_value on listings tagged as
 * rentals, which would poison every price comparison on this page — and their
 * presence would make the result counter disagree with the grid.
 *
 * Filtering and pagination both happen in SQL, so a page load fetches one page.
 */
export async function getRentalProperties(
  page: number,
  pageSize: number,
  filters?: RentalFilters
): Promise<PaginatedProperties> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("listing_type", RENT)
    .eq("is_featured", false)
    .eq("is_active", true);

  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
  }
  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }
  // Property type is inferred from the title, the same way the facets count it,
  // so a suggestion's count always matches what clicking it returns
  if (filters?.type && filters.type !== "All" && filters.type !== "Any Type") {
    query = query.ilike("title", `%${filters.type}%`);
  }
  if (filters?.kind) {
    query = query.eq("rental_kind", filters.kind);
  }

  // Price comparisons run on the generated monthly equivalent, so a 90/night
  // holiday let and a 2,400/month long let sort and filter against each other
  const minPrice = toInt(filters?.minPrice);
  if (minPrice !== null) {
    query = query.gte("rent_monthly_eq", minPrice);
  }
  const maxPrice = toInt(filters?.maxPrice);
  if (maxPrice !== null) {
    query = query.lte("rent_monthly_eq", maxPrice);
  }

  if (filters?.beds && filters.beds !== "0") {
    query = query.gte("beds", parseInt(filters.beds, 10));
  }
  if (filters?.baths && filters.baths !== "0") {
    query = query.gte("baths", parseInt(filters.baths, 10));
  }
  const minStay = toInt(filters?.minStay);
  if (minStay !== null) {
    query = query.lte("min_stay_months", minStay);
  }
  const maxDeposit = toInt(filters?.maxDeposit);
  if (maxDeposit !== null) {
    query = query.lte("deposit_months", maxDeposit);
  }
  if (filters?.furnished === "true") {
    query = query.eq("furnished", true);
  }
  if (filters?.utilities === "true") {
    query = query.eq("utilities_included", true);
  }
  if (filters?.availableFrom) {
    query = query.lte("available_from", filters.availableFrom);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    console.error(
      "Error fetching rental properties:",
      describeSupabaseError(error)
    );
    return { data: [], count: 0 };
  }

  return { data: (data as Property[]) ?? [], count: count ?? 0 };
}

/** The two rentals shown in the /rent hero band */
export async function getFeaturedRentals(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("listing_type", RENT)
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) {
    console.error(
      "Error fetching featured rentals:",
      describeSupabaseError(error)
    );
    return [];
  }

  return (data as Property[]) ?? [];
}

interface RentalFacetSource {
  title: string;
  location: string;
  beds: number;
  rental_kind: string | null;
}

/**
 * The suggestion catalogue for /rent, counted over rental rows only.
 *
 * Counting across the whole catalogue would suggest zones where every match is
 * a sale, so the count on the suggestion would not survive the click.
 */
export async function getRentalFacets(): Promise<Facet[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("title, location, beds, rental_kind")
    .eq("listing_type", RENT)
    .eq("is_featured", false)
    .eq("is_active", true);

  if (error) {
    console.error(
      "Error fetching rental facets:",
      describeSupabaseError(error)
    );
    return [];
  }

  const rentals = (data as RentalFacetSource[]) ?? [];

  return [
    ...buildTypeFacets(rentals),
    ...buildZoneFacets(rentals),
    ...buildBedsFacets(rentals),
    ...buildKindFacets(rentals),
  ];
}

function buildTypeFacets(rentals: RentalFacetSource[]): Facet[] {
  return PROPERTY_TYPES.map((type) => ({
    kind: "type" as const,
    value: type,
    count: rentals.filter((p) => normalize(p.title).includes(normalize(type)))
      .length,
  })).filter((facet) => facet.count > 0);
}

/** Location is a free-text "Neighborhood, City" — both halves are searchable zones */
function buildZoneFacets(rentals: RentalFacetSource[]): Facet[] {
  const counts = new Map<string, number>();

  for (const rental of rentals) {
    const zones = rental.location
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

function buildBedsFacets(rentals: RentalFacetSource[]): Facet[] {
  return Array.from({ length: MAX_BEDS_FACET }, (_, i) => i + 1)
    .map((beds) => ({
      kind: "beds" as const,
      value: beds.toString(),
      count: rentals.filter((p) => p.beds >= beds).length,
    }))
    .filter((facet) => facet.count > 0);
}

function buildKindFacets(rentals: RentalFacetSource[]): Facet[] {
  return RENTAL_KINDS.map((definition) => ({
    kind: "kind" as const,
    value: definition.value,
    count: rentals.filter((p) => p.rental_kind === definition.value).length,
  })).filter((facet) => facet.count > 0);
}

/**
 * What a tenant pays to move in: the first period plus the deposit.
 *
 * This is the rental equivalent of the mortgage estimate on a sale — the number
 * that actually decides whether someone can take the place.
 *
 * Returns null for nightly lets, where a deposit in months of rent is
 * meaningless, and for listings with no price.
 */
export function entryCost(property: Property): number | null {
  if (property.price_period !== "month") return null;
  if (property.price_value === null || property.price_value === undefined) {
    return null;
  }

  const deposit = property.deposit_months ?? 0;
  return property.price_value * (1 + deposit);
}
