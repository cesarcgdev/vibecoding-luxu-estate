import "server-only";

import { createClient } from "./supabase/server";
import { describeSupabaseError } from "./supabase-errors";
import type { PaginatedProperties, Property } from "./properties";

/** Every criterion the /saved toolbar can put in the URL */
export interface SavedPropertyFilters {
  q?: string;
  /** "sale" | "rent" — omitted (or any other value) means both */
  operation?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
}

function toInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The ids of every property the signed-in visitor has saved, or an empty set if signed out */
export async function getSavedPropertyIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from("saved_properties")
    .select("property_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching saved property ids:", describeSupabaseError(error));
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.property_id as string));
}

/**
 * A page of the signed-in visitor's saved properties, newest-saved first.
 *
 * Filtering and pagination both happen in SQL against the join with `properties`,
 * so a page load fetches exactly one page.
 */
export async function getSavedProperties(
  userId: string,
  page: number,
  pageSize: number,
  filters?: SavedPropertyFilters
): Promise<PaginatedProperties> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("saved_properties")
    .select("created_at, properties!inner(*)", { count: "exact" })
    .eq("user_id", userId)
    .eq("properties.is_active", true);

  if (filters?.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,location.ilike.%${filters.q}%`,
      { referencedTable: "properties" }
    );
  }
  if (filters?.operation === "sale" || filters?.operation === "rent") {
    query = query.eq("properties.listing_type", filters.operation);
  }
  const minPrice = toInt(filters?.minPrice);
  if (minPrice !== null) query = query.gte("properties.price_value", minPrice);
  const maxPrice = toInt(filters?.maxPrice);
  if (maxPrice !== null) query = query.lte("properties.price_value", maxPrice);
  if (filters?.beds && filters.beds !== "0") {
    query = query.gte("properties.beds", parseInt(filters.beds, 10));
  }
  if (filters?.baths && filters.baths !== "0") {
    query = query.gte("properties.baths", parseInt(filters.baths, 10));
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching saved properties:", describeSupabaseError(error));
    return { data: [], count: 0 };
  }

  const rows = (data ?? []) as unknown as { properties: Property }[];
  return { data: rows.map((row) => row.properties), count: count ?? 0 };
}
