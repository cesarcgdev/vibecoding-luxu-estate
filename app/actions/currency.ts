"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Currency } from "@/lib/currency/currency";

export async function setCurrency(currency: Currency) {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_CURRENCY", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Revalidate the layout to reflect the new currency
  revalidatePath("/", "layout");
}
