import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for admin writes.
 *
 * The admin panel runs without a Supabase session while `ADMIN_DEV_BYPASS` is on,
 * so every insert/update/delete made with the anon key is silently rejected by RLS.
 * This client bypasses RLS and must therefore never reach the browser — only
 * import it from `"use server"` files, and always behind an admin check.
 *
 * Returns null when `SUPABASE_SERVICE_ROLE_KEY` is not configured.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const MISSING_SERVICE_ROLE_MESSAGE =
  "Supabase rejected the write (row-level security). Add SUPABASE_SERVICE_ROLE_KEY " +
  "to .env.local and restart the dev server, or sign in with an account that has the " +
  "admin role in user_roles.";
