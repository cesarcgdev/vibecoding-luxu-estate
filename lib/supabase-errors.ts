/**
 * A failed Supabase call surfaces in two very different shapes:
 *
 * - a PostgrestError — a plain object with `message` / `code` / `details` / `hint`,
 *   where a network failure hides the real cause inside a full stack in `details`
 * - a raw `Error` from `fetch` or GoTrue, whose `message` and `stack` are
 *   non-enumerable, so serializing it for the dev overlay prints `{}`
 *
 * Either way, logging the value directly loses the cause. Unwrap it to one line.
 */
export function describeSupabaseError(error: unknown): string {
  const description = summarize(error);
  return isUnreachable(description) ? `${description}. ${UNREACHABLE_HINT}` : description;
}

function summarize(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause as { code?: string; message?: string } | undefined;
    return cause?.code
      ? `${error.name}: ${error.message} (${cause.code}: ${cause.message ?? "no detail"})`
      : `${error.name}: ${error.message}`;
  }

  if (error && typeof error === "object") {
    const { message, code, details, hint } = error as Record<string, unknown>;
    const parts = [
      message,
      code ? `code ${code}` : null,
      rootCause(details),
      hint,
    ].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }

  return String(error);
}

/** PostgREST puts the whole stack in `details`; only its root cause line adds anything */
function rootCause(details: unknown): string | null {
  if (typeof details !== "string") return null;
  return details.split("\n").find((line) => line.startsWith("Caused by:")) ?? null;
}

const UNREACHABLE_HINT =
  "Supabase is unreachable — check NEXT_PUBLIC_SUPABASE_URL and that the project is not paused";

/** Signatures of a request that never reached Supabase, so the data is not at fault */
const UNREACHABLE_SIGNS =
  /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|UND_ERR_CONNECT_TIMEOUT|fetch failed|Failed to fetch/;

function isUnreachable(description: string): boolean {
  return UNREACHABLE_SIGNS.test(description);
}
