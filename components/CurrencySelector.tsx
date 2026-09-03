"use client";

import React from "react";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { CURRENCY_SYMBOLS, type Currency } from "@/lib/currency/currency";

const OTHER: Record<Currency, Currency> = {
  USD: "EUR",
  EUR: "USD",
};

/** A compact two-state toggle — there are only 2 currencies, so a dropdown like
 * LanguageSelector would be one click heavier for no benefit. */
export default function CurrencySelector() {
  const { currency, changeCurrency, isPending } = useCurrency();

  return (
    <button
      type="button"
      onClick={() => changeCurrency(OTHER[currency])}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-nordic-dark/5 transition-colors text-sm font-medium text-nordic-dark disabled:opacity-60"
      aria-label={`Switch currency to ${OTHER[currency]}`}
      title={`Switch currency to ${OTHER[currency]}`}
    >
      <span>{CURRENCY_SYMBOLS[currency]}</span>
      <span className="uppercase">{currency}</span>
    </button>
  );
}
