import { supabase } from "./supabase";
import { describeSupabaseError } from "./supabase-errors";
import {
  ALL_MOCK_PROPERTIES,
  MOCK_FEATURED_PROPERTIES,
  MOCK_PROPERTIES,
} from "../data/mock-properties";

export type PropertyTag =
  | "Exclusive"
  | "New Arrival"
  | "FOR SALE"
  | "FOR RENT"
  | null;

export interface Property {
  id: string;
  title: string;
  location: string;
  /** Map coordinates — null on listings saved before the map picker existed */
  latitude?: number | null;
  longitude?: number | null;
  price_value: number | null;
  price_display: string;
  beds: number;
  baths: number;
  area: string;
  /** Array of image URLs — the single source of truth for property images */
  images: string[];
  tag: PropertyTag;
  is_featured: boolean;
  /** false hides the listing from the public site without deleting it */
  is_active: boolean;
  listing_type: string | null;
  created_at: string;
  slug: string;
}

export interface PaginatedProperties {
  data: Property[];
  count: number;
}

/** Fetches the two featured hero properties */
export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) {
    console.error(
      "Error fetching featured properties:",
      describeSupabaseError(error)
    );
    return MOCK_FEATURED_PROPERTIES;
  }

  const featured = (data as Property[]) ?? [];

  // An empty table would leave the hero band as a bare heading
  return featured.length ? featured : MOCK_FEATURED_PROPERTIES;
}

/** Fetches a paginated page of non-featured market properties */
export async function getMarketProperties(
  page: number,
  pageSize: number,
  filters?: {
    q?: string;
    type?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    listing?: string;
  }
): Promise<PaginatedProperties> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", false)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (filters?.q) {
    query = query.or(`title.ilike.%${filters.q}%,location.ilike.%${filters.q}%`);
  }
  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }
  if (filters?.type && filters.type !== "All" && filters.type !== "Any Type") {
    query = query.ilike("title", `%${filters.type}%`);
  }
  if (filters?.minPrice) {
    query = query.gte("price_value", parseInt(filters.minPrice.replace(/\D/g, ""), 10));
  }
  if (filters?.maxPrice) {
    query = query.lte("price_value", parseInt(filters.maxPrice.replace(/\D/g, ""), 10));
  }
  if (filters?.beds && filters.beds !== "0") {
    query = query.gte("beds", parseInt(filters.beds, 10));
  }
  if (filters?.baths && filters.baths !== "0") {
    query = query.gte("baths", parseInt(filters.baths, 10));
  }
  if (filters?.listing) {
    query = query.eq("listing_type", filters.listing);
  }

  const { data, error, count } = await query;

  const supabaseProperties = (data as Property[]) ?? [];
  let combinedProperties = [...supabaseProperties, ...MOCK_PROPERTIES];

  // Apply filters locally for consistency (important since mock properties aren't in Supabase)
  if (filters?.q) {
    const qLower = filters.q.toLowerCase();
    combinedProperties = combinedProperties.filter(
      (p) =>
        p.title.toLowerCase().includes(qLower) ||
        p.location.toLowerCase().includes(qLower)
    );
  }
  if (filters?.location) {
    const locLower = filters.location.toLowerCase();
    combinedProperties = combinedProperties.filter((p) =>
      p.location.toLowerCase().includes(locLower)
    );
  }
  if (filters?.type && filters.type !== "All" && filters.type !== "Any Type") {
    const typeLower = filters.type.toLowerCase();
    combinedProperties = combinedProperties.filter((p) =>
      p.title.toLowerCase().includes(typeLower)
    );
  }
  if (filters?.minPrice) {
    const min = parseInt(filters.minPrice.replace(/\D/g, ""), 10);
    combinedProperties = combinedProperties.filter(
      (p) => p.price_value !== null && p.price_value >= min
    );
  }
  if (filters?.maxPrice) {
    const max = parseInt(filters.maxPrice.replace(/\D/g, ""), 10);
    combinedProperties = combinedProperties.filter(
      (p) => p.price_value !== null && p.price_value <= max
    );
  }
  if (filters?.beds && filters.beds !== "0") {
    const beds = parseInt(filters.beds, 10);
    combinedProperties = combinedProperties.filter((p) => p.beds >= beds);
  }
  if (filters?.baths && filters.baths !== "0") {
    const baths = parseInt(filters.baths, 10);
    combinedProperties = combinedProperties.filter((p) => p.baths >= baths);
  }
  if (filters?.listing) {
    combinedProperties = combinedProperties.filter(
      (p) => p.listing_type === filters.listing
    );
  }

  const totalCount = combinedProperties.length;
  const paginatedData = combinedProperties.slice(from, to + 1);

  if (error) {
    // Not fatal — the mock properties still fill the grid
    console.error(
      "Error fetching market properties:",
      describeSupabaseError(error)
    );
  }

  return { data: paginatedData, count: totalCount };
}

/** Fetches a single property by its slug */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    // A hidden listing has no public detail page — .single() errors on zero
    // rows, the mock lookup below misses, and the page renders notFound()
    .eq("is_active", true)
    .single();

  if (error) {
    console.error(
      `Error fetching property with slug ${slug}:`,
      describeSupabaseError(error)
    );
    // Mock listings appear in the grid, so their detail pages have to resolve too
    return ALL_MOCK_PROPERTIES.find((property) => property.slug === slug) ?? null;
  }

  return data as Property;
}
