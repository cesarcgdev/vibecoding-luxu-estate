"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type LandlordContact = {
  phone: string | null;
  email: string | null;
};

export type LandlordContactResult =
  | { success: true; contact: LandlordContact }
  | { success: false; error: string };

/**
 * Reveals one landlord's contact details.
 *
 * `phone` and `email_public` live on `landlords`, which has no public select
 * policy and is not part of the `landlords_public` view — so they never reach
 * the browser with the page. Reading them needs the service-role key, and this
 * action only ever returns a single row.
 *
 * That stops the bulk case: there is no request that hands out all forty
 * numbers at once. It does not stop someone walking the listings one by one;
 * rate limiting would, and is not part of this feature.
 */
export async function revealLandlordContact(
  landlordId: string
): Promise<LandlordContactResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      success: false,
      error:
        "Contact details are unavailable: SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to .env.local and restart the dev server.",
    };
  }

  const { data, error } = await supabase
    .from("landlords")
    .select("phone, email_public")
    .eq("id", landlordId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error revealing landlord contact:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "That landlord no longer exists." };
  }

  return {
    success: true,
    contact: { phone: data.phone, email: data.email_public },
  };
}
