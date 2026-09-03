"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import SavedFiltersModal from "./SavedFiltersModal";

const DEBOUNCE_MS = 250;
const OPERATIONS = ["", "sale", "rent"] as const;

export default function SavedToolbar() {
  const { dictionary } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const operation = searchParams.get("operation") || "";

  useEffect(() => {
    if (query.trim() === urlQuery) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const setOperation = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("operation", next);
    else params.delete("operation");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const operationLabel = (value: string) =>
    value === "sale"
      ? dictionary.saved.filterBuy
      : value === "rent"
        ? dictionary.saved.filterRent
        : dictionary.saved.filterAll;

  const pillClass = (value: string) =>
    operation === value
      ? "whitespace-nowrap px-5 py-2 rounded-full bg-nordic-dark dark:bg-white text-white dark:text-nordic-dark text-sm font-medium shadow-lg shadow-nordic-dark/10 transition-transform hover:-translate-y-0.5"
      : "whitespace-nowrap px-5 py-2 rounded-full bg-white dark:bg-[#152e2a] border border-nordic-dark/5 dark:border-white/10 text-nordic-muted dark:text-gray-300 hover:text-nordic-dark dark:hover:text-white hover:border-mosque/50 dark:hover:border-hint-green/50 text-sm font-medium transition-all hover:bg-mosque/5 dark:hover:bg-white/5";

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 pointer-events-none">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dictionary.saved.searchPlaceholder}
            aria-label={dictionary.saved.searchPlaceholder}
            className="w-full h-11 pl-10 pr-10 rounded-lg border border-nordic-dark/10 dark:border-white/10 bg-white dark:bg-[#152e2a] text-nordic-dark dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-mosque dark:focus:ring-hint-green focus:border-mosque dark:focus:border-hint-green transition-all text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-nordic-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-icons text-lg">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto hide-scroll">
          {OPERATIONS.map((value) => (
            <button key={value || "all"} onClick={() => setOperation(value)} className={pillClass(value)}>
              {operationLabel(value)}
            </button>
          ))}
          <div className="w-px h-6 bg-nordic-dark/10 dark:bg-white/20 mx-1"></div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap flex items-center gap-1 px-4 py-2 rounded-full text-nordic-dark dark:text-gray-300 font-medium text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-icons text-base">tune</span> {dictionary.saved.moreFilters}
          </button>
        </div>
      </div>

      <SavedFiltersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        operation={operation}
      />
    </>
  );
}
