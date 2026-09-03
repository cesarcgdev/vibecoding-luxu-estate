"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { buildActiveFilters, type FilterVariant } from "@/lib/search-filters";

/** Shown instead of the property grid when no listing matches the active filters */
export default function NoResults({
  variant = "sale",
}: {
  variant?: FilterVariant;
}) {
  const { dictionary, locale } = useLanguage();
  const { currency } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilters = buildActiveFilters(
    new URLSearchParams(searchParams.toString()),
    dictionary,
    variant,
    currency,
    locale
  );

  const clearLast = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const param of activeFilters[activeFilters.length - 1].params) {
      params.delete(param);
    }
    params.delete("page");
    const search = params.toString();
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center text-center py-20 px-6 rounded-2xl border border-dashed border-nordic-dark/10 dark:border-white/10 transition-colors">
      <span className="material-icons text-5xl text-nordic-muted/50 dark:text-gray-500">
        search_off
      </span>
      <h3 className="mt-4 text-xl font-medium text-nordic-dark dark:text-white transition-colors">
        {dictionary.search.noResultsTitle}
      </h3>

      {activeFilters.length > 0 && (
        <>
          <p className="mt-2 max-w-md text-sm text-nordic-muted dark:text-gray-400 transition-colors">
            {dictionary.search.noResultsDesc.replace(
              "{criteria}",
              activeFilters.map((filter) => filter.label).join(" · ")
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={clearLast}
              className="px-5 py-2.5 rounded-lg bg-white dark:bg-[#152e2a] border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white text-sm font-medium hover:border-mosque dark:hover:border-hint-green transition-all"
            >
              {dictionary.search.clearLast}
            </button>
            <button
              onClick={() => router.push(pathname, { scroll: false })}
              className="px-5 py-2.5 rounded-lg bg-mosque dark:bg-hint-green text-white dark:text-nordic-dark text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-mosque/20 dark:shadow-hint-green/20"
            >
              {dictionary.search.clearAll}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
