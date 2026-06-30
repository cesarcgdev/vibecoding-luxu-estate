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
  image_url: string;
  tag: PropertyTag;
  is_featured: boolean;
  listing_type: string | null;
  created_at: string;
  slug: string;
  images: string[] | null;
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

/** Fetches a paginated page of non-featured market properties */
export async function getMarketProperties(
  page: number,
  pageSize: number
): Promise<PaginatedProperties> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_featured", false)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error fetching market properties:", error);
    return { data: [], count: 0 };
  }

  return { data: (data as Property[]) ?? [], count: count ?? 0 };
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
