import { supabase } from "./supabase";
import { describeSupabaseError } from "./supabase-errors";

/**
 * A landlord as the public is allowed to see them.
 *
 * These are exactly the columns of the `landlords_public` view. The underlying
 * table has no public select policy: the anon key ships in the browser bundle,
 * so a readable `landlords` table would put every phone number one request
 * away. Contact details come from revealLandlordContact instead.
 */
export interface PublicLandlord {
  id: string;
  slug: string;
  display_name: string;
  kind: "individual" | "agency";
  avatar_url: string | null;
  bio: string | null;
  languages: string[];
  is_verified: boolean;
  member_since: string | null;
  response_time_hours: number | null;
}

/** The landlord shown on a property page, or null if none is assigned */
export async function getLandlord(
  landlordId: string | null | undefined
): Promise<PublicLandlord | null> {
  if (!landlordId) return null;

  const { data, error } = await supabase
    .from("landlords_public")
    .select("*")
    .eq("id", landlordId)
    .maybeSingle();

  if (error) {
    // A listing without its landlord card is still a usable listing
    console.error("Error fetching landlord:", describeSupabaseError(error));
    return null;
  }

  return (data as PublicLandlord) ?? null;
}

/** Every landlord the admin property form can assign, ordered by name */
export async function getLandlordOptions(): Promise<PublicLandlord[]> {
  const { data, error } = await supabase
    .from("landlords_public")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    console.error(
      "Error fetching landlord options:",
      describeSupabaseError(error)
    );
    return [];
  }

  return (data as PublicLandlord[]) ?? [];
}
