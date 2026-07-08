import { supabase } from "./supabase";

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
  price_value: number | null;
  price_display: string;
  beds: number;
  baths: number;
  area: string;
  /** Array of image URLs — the single source of truth for property images */
  images: string[];
  tag: PropertyTag;
  is_featured: boolean;
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
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }

  return data as Property[];
}

import { MOCK_PROPERTIES } from "../data/mock-properties";

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
  }
): Promise<PaginatedProperties> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", false)
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

  const totalCount = combinedProperties.length;
  const paginatedData = combinedProperties.slice(from, to + 1);

  if (error) {
    console.error("Error fetching market properties:", error);
    // Still return mock properties if there's an error
    return { data: paginatedData, count: totalCount };
  }

  return { data: paginatedData, count: totalCount };
}

/** Fetches a single property by its slug */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Error fetching property with slug ${slug}:`, error);
    return null;
  }

  return data as Property;
}
