"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/** Helper to get a secure Supabase client with the current cookies */
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
            // Ignore if setting cookies fails (e.g. Server Component)
          }
        },
      },
    }
  );
}

/** Check if current user is an admin */
async function requireAdmin() {
  const supabase = await getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized: Not logged in");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleData?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return supabase;
}

export type UserRole = {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

export async function getUsersRoles(): Promise<UserRole[]> {
  try {
    const supabase = await requireAdmin();

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }

    return data as UserRole[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await requireAdmin();

    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating user role:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateUserRole:", error);
    return { success: false, error: error.message };
  }
}
