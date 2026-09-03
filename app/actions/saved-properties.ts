"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { describeSupabaseError } from "@/lib/supabase-errors";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

export type ToggleSavedResult = {
  success: boolean;
  saved?: boolean;
  error?: "unauthenticated" | string;
};

/** Saves the property if it isn't saved yet, otherwise unsaves it */
export async function toggleSavedProperty(propertyId: string): Promise<ToggleSavedResult> {
  const supabase = await getSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("saved_properties")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .select("id");

  if (deleteError) {
    console.error("Error unsaving property:", describeSupabaseError(deleteError));
    return { success: false, error: deleteError.message };
  }

  if (deleted?.length) {
    revalidatePath("/saved");
    return { success: true, saved: false };
  }

  const { error: insertError } = await supabase
    .from("saved_properties")
    .insert({ user_id: user.id, property_id: propertyId });

  if (insertError) {
    console.error("Error saving property:", describeSupabaseError(insertError));
    return { success: false, error: insertError.message };
  }

  revalidatePath("/saved");
  return { success: true, saved: true };
}
