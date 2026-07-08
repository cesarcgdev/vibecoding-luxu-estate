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
    .order("created_at", { ascending: true });

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
  pageSize: number
): Promise<PaginatedProperties> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // We fetch a larger subset from Supabase just in case, but rely heavily on local pagination
  const { data, error, count } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", false)
    .order("created_at", { ascending: true });

  const supabaseProperties = (data as Property[]) ?? [];
  const combinedProperties = [...supabaseProperties, ...MOCK_PROPERTIES];
  const totalCount = combinedProperties.length;

  const paginatedData = combinedProperties.slice(from, to + 1);

  if (error) {
    console.error("Error fetching market properties:", error);
    // Still return mock properties if there's an error
    return { data: MOCK_PROPERTIES.slice(from, to + 1), count: MOCK_PROPERTIES.length };
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
