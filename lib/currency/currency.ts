import type { Locale } from "@/lib/i18n/dictionaries";

export type Currency = "USD" | "EUR";

export const defaultCurrency: Currency = "USD";

export const CURRENCIES: Currency[] = ["USD", "EUR"];

/**
 * Manually-updated placeholder rate — there is no live exchange-rate feed or
 * scheduled refresh. Update this value to keep EUR prices roughly current.
 */
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
};

/** Intl.NumberFormat needs a BCP-47 tag, not the bare locale codes the dictionaries use */
const NUMBER_LOCALES: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

export function convertFromUsd(valueUsd: number, currency: Currency): number {
  return valueUsd * EXCHANGE_RATES[currency];
}

/**
 * Formats a USD-stored amount (property.price_value) in the visitor's chosen
 * currency, grouped per their chosen language. `price_value` never changes —
 * only how it is displayed. Returns null when there is nothing to format, so
 * callers fall back to whatever free-text price_display already holds (e.g.
 * "Price on request").
 */
export function formatCurrency(
  valueUsd: number | null | undefined,
  currency: Currency,
  locale: Locale | string,
  variant: "full" | "abbreviated" = "full"
): string | null {
  if (valueUsd == null) return null;

  const converted = convertFromUsd(valueUsd, currency);
  const numberLocale = NUMBER_LOCALES[locale as Locale] ?? "en-US";

  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    notation: variant === "abbreviated" ? "compact" : "standard",
    maximumFractionDigits: variant === "abbreviated" ? 1 : 0,
  }).format(converted);
}
