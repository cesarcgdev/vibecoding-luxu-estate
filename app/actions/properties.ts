"use server";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, MISSING_SERVICE_ROLE_MESSAGE } from "@/lib/supabase/admin";

const BUCKET = "property-images";

/** Helper to get a Supabase server client bound to the visitor's session */
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

/**
 * Server Actions are reachable by direct POST, so the admin check lives here
 * rather than only in the proxy. Returns the client that should perform the write:
 * the service-role client when configured, otherwise the session client.
 */
async function getWriteClient(): Promise<SupabaseClient> {
  const sessionClient = await getSupabaseClient();

  if (process.env.ADMIN_DEV_BYPASS !== "true") {
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) throw new Error("Unauthorized: not signed in");

    const { data: roleData } = await sessionClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }
  }

  return createAdminClient() ?? sessionClient;
}

export type PropertyFormData = {
  title: string;
  price_value: number | null;
  price_display: string;
  listing_type: string;
  property_type: string;
  description: string;
  location: string;
  area: string;
  year_built: string;
  beds: number;
  baths: number;
  parking: number;
  amenities: string[];
  is_featured: boolean;
  slug: string;
  /** Existing image URLs (already in Supabase) */
  existing_images: string[];
};

export type PropertyActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

/** Slugify a string */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Maps the form payload onto the `properties` table columns */
function toPropertyRow(data: PropertyFormData, imageUrls: string[], slug: string) {
  const year = parseInt(data.year_built, 10);

  return {
    title: data.title,
    price_value: data.price_value,
    price_display: data.price_display,
    listing_type: data.listing_type,
    property_type: data.property_type,
    description: data.description,
    location: data.location,
    area: data.area,
    year_built: Number.isFinite(year) ? year : null,
    beds: data.beds,
    baths: data.baths,
    parking: data.parking,
    amenities: data.amenities,
    is_featured: data.is_featured,
    slug,
    images: imageUrls,
    tag: data.listing_type === "rent" ? "FOR RENT" : "FOR SALE",
  };
}

/** Turns a Supabase error into a message that says what to actually do about it */
function explainWriteError(error: { code?: string; message: string }): string {
  if (error.code === "42501") return MISSING_SERVICE_ROLE_MESSAGE;
  if (error.code === "PGRST204" || error.code === "42703") {
    return `${error.message} — run supabase/migrations/0001_property_admin.sql in the Supabase SQL editor.`;
  }
  if (error.code === "23505") {
    return "That URL slug is already taken by another property.";
  }
  return error.message;
}

/** Creates the storage bucket on first use so uploads don't fail on a fresh project */
async function ensureBucket(supabase: SupabaseClient): Promise<string | null> {
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (bucket) return null;

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: "5MB",
  });

  // Another concurrent upload may have won the race
  if (error && !/already exists/i.test(error.message)) {
    return (
      `Could not create the "${BUCKET}" storage bucket: ${error.message}. ` +
      "Run supabase/migrations/0001_property_admin.sql in the Supabase SQL editor, " +
      "or set SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  return null;
}

/** Upload a single image file to Supabase Storage.
 * Returns the public URL or an error message.
 */
export async function uploadPropertyImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  let supabase: SupabaseClient;
  try {
    supabase = await getWriteClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const bucketError = await ensureBucket(supabase);
  if (bucketError) return { error: bucketError };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return { url: urlData.publicUrl };
}

/** Remove an image from Supabase Storage by its public URL */
export async function deletePropertyImage(
  publicUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getWriteClient();

  // Extract the path after the bucket name
  const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(bucketPrefix);

  // Seeded/mock listings point at external URLs — nothing to remove from storage
  if (idx === -1) return { success: true };

  const filePath = publicUrl.slice(idx + bucketPrefix.length);

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

/** Create a new property */
export async function createProperty(
  data: PropertyFormData,
  imageUrls: string[]
): Promise<PropertyActionResult> {
  let supabase: SupabaseClient;
  try {
    supabase = await getWriteClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const slug = data.slug || slugify(data.title);

  const { error } = await supabase
    .from("properties")
    .insert(toPropertyRow(data, imageUrls, slug))
    .select("id")
    .single();

  if (error) {
    console.error("Error creating property:", error);
    return { success: false, error: explainWriteError(error) };
  }

  revalidatePath("/admin/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}

/** Update an existing property */
export async function updateProperty(
  id: string,
  data: PropertyFormData,
  imageUrls: string[]
): Promise<PropertyActionResult> {
  let supabase: SupabaseClient;
  try {
    supabase = await getWriteClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const slug = data.slug || slugify(data.title);

  const { data: updated, error } = await supabase
    .from("properties")
    .update(toPropertyRow(data, imageUrls, slug))
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Error updating property:", error);
    return { success: false, error: explainWriteError(error) };
  }

  // RLS rejects reads and writes silently, so an empty result is a real failure
  if (!updated?.length) {
    return { success: false, error: MISSING_SERVICE_ROLE_MESSAGE };
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/properties/${slug}`);
  revalidatePath("/");
  redirect("/admin/properties");
}

/** Delete a property and its images */
export async function deleteProperty(
  id: string
): Promise<PropertyActionResult> {
  let supabase: SupabaseClient;
  try {
    supabase = await getWriteClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
  }

  // Get images first so we can delete them from storage
  const { data: property } = await supabase
    .from("properties")
    .select("images")
    .eq("id", id)
    .single();

  if (property?.images?.length) {
    for (const url of property.images) {
      await deletePropertyImage(url).catch(console.error);
    }
  }

  const { data: deleted, error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Error deleting property:", error);
    return { success: false, error: explainWriteError(error) };
  }

  // A delete blocked by RLS reports no error and removes no rows
  if (!deleted?.length) {
    return { success: false, error: MISSING_SERVICE_ROLE_MESSAGE };
  }

  revalidatePath("/admin/properties");
  revalidatePath("/");
  return { success: true, id };
}

/** Fetch a single property by ID for the edit form */
export async function getPropertyById(id: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching property:", error);
    return null;
  }

  return data;
}

/**
 * Every property in the database, newest first.
 *
 * The public grid mixes in generated mock listings and hides featured ones; the
 * admin table must show exactly the rows that exist, or its edit and delete
 * buttons act on ids that aren't there.
 */
export async function getAdminProperties() {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin properties:", error);
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}
