"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  buildActiveFilters,
  facetIcon,
  facetLabel,
  groupHeading,
  normalize,
  FOCUS_SEARCH_EVENT,
  PARAM_BY_KIND,
  type Facet,
  type FacetKind,
  type FilterVariant,
} from "@/lib/search-filters";

const RECENT_KEY = "luxestate:recent-searches";
const MAX_RECENT = 5;
const MAX_PER_GROUP = 4;
// Rental modalities lead on /rent; the sales page never supplies a "kind" facet
const KIND_ORDER: FacetKind[] = ["kind", "type", "zone", "beds"];

type Option =
  | { id: string; kind: "facet"; facet: Facet; label: string; icon: string }
  | { id: string; kind: "recent"; term: string; label: string; icon: string }
  | { id: string; kind: "freeText"; term: string; label: string; icon: string };

interface OptionGroup {
  heading: string;
  options: Option[];
}

/**
 * Recent searches live in localStorage, which the server cannot read. Reading
 * them through an external store keeps the server render empty and lets React
 * swap in the stored list after hydration without a mismatch.
 */
const NO_RECENT: string[] = [];
const recentListeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedRecent: string[] = NO_RECENT;

function readRecent(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(RECENT_KEY);
  } catch {
    // Storage can be unavailable (private browsing) — treat it as empty
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedRecent = raw ? JSON.parse(raw) : NO_RECENT;
    } catch {
      cachedRecent = NO_RECENT;
    }
  }
  return cachedRecent;
}

function writeRecent(next: string[]) {
  cachedRaw = JSON.stringify(next);
  cachedRecent = next;
  try {
    localStorage.setItem(RECENT_KEY, cachedRaw);
  } catch {
    // Persisting recent searches is a nicety, never a hard failure
  }
  for (const listener of recentListeners) listener();
}

function subscribeRecent(listener: () => void) {
  recentListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    recentListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export default function SearchBar({
  facets,
  variant = "sale",
}: {
  facets: Facet[];
  /** Decides how price chips are formatted — rents are not abbreviated */
  variant?: FilterVariant;
}) {
  const { dictionary } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const recent = useSyncExternalStore(
    subscribeRecent,
    readRecent,
    () => NO_RECENT
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Focusing the input is enough to open the panel — onFocus does the rest.
   * Covers both the navbar magnifier on this page and landing on /#search
   * from another one.
   */
  useEffect(() => {
    function focusSearch() {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      inputRef.current?.focus({ preventScroll: true });
    }

    if (window.location.hash === "#search") focusSearch();

    window.addEventListener(FOCUS_SEARCH_EVENT, focusSearch);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focusSearch);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFilters = useMemo(
    () =>
      buildActiveFilters(
        new URLSearchParams(searchParams.toString()),
        dictionary,
        variant
      ),
    [searchParams, dictionary, variant]
  );

  const groups = useMemo<OptionGroup[]>(() => {
    const term = query.trim();
    const isApplied = (facet: Facet) =>
      searchParams.get(PARAM_BY_KIND[facet.kind]) === facet.value;

    const toOption = (facet: Facet): Option => ({
      id: `${facet.kind}-${facet.value}`,
      kind: "facet",
      facet,
      label: facetLabel(facet, dictionary),
      icon: facetIcon(facet),
    });

    if (!term) {
      const result: OptionGroup[] = [];

      if (recent.length > 0) {
        result.push({
          heading: dictionary.search.recent,
          options: recent.map((entry) => ({
            id: `recent-${entry}`,
            kind: "recent" as const,
            term: entry,
            label: entry,
            icon: "history",
          })),
        });
      }

      for (const kind of KIND_ORDER) {
        const options = facets
          .filter((facet) => facet.kind === kind && !isApplied(facet))
          .slice(0, MAX_PER_GROUP)
          .map(toOption);
        if (options.length > 0) {
          result.push({ heading: groupHeading(kind, dictionary), options });
        }
      }

      return result;
    }

    const needle = normalize(term);
    const result: OptionGroup[] = [];

    for (const kind of KIND_ORDER) {
      const options = facets
        .filter((facet) => facet.kind === kind && !isApplied(facet))
        // Matches both the raw value and the translated label, so "casa",
        // "house" and "atico" all find something
        .filter(
          (facet) =>
            normalize(facet.value).includes(needle) ||
            normalize(facetLabel(facet, dictionary)).includes(needle)
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_PER_GROUP)
        .map(toOption);
      if (options.length > 0) {
        result.push({ heading: groupHeading(kind, dictionary), options });
      }
    }

    // Free-text search is always offered as a fallback
    result.push({
      heading: "",
      options: [
        {
          id: "free-text",
          kind: "freeText",
          term,
          label: dictionary.search.searchFreeText.replace("{q}", term),
          icon: "search",
        },
      ],
    });

    return result;
  }, [query, facets, recent, dictionary, searchParams]);

  const flatOptions = useMemo(
    () => groups.flatMap((group) => group.options),
    [groups]
  );
  const facetMatchCount = flatOptions.filter((o) => o.kind === "facet").length;
  const hasNoMatches = query.trim() !== "" && facetMatchCount === 0;

  const pushParams = (params: URLSearchParams) => {
    params.delete("page");
    const search = params.toString();
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  const rememberSearch = (term: string) => {
    writeRecent(
      [term, ...recent.filter((entry) => entry !== term)].slice(0, MAX_RECENT)
    );
  };

  const applyOption = (option: Option) => {
    const params = new URLSearchParams(searchParams.toString());

    if (option.kind === "facet") {
      params.set(PARAM_BY_KIND[option.facet.kind], option.facet.value);
    } else {
      params.set("q", option.term);
      rememberSearch(option.term);
    }

    pushParams(params);
    setQuery("");
    setActiveIndex(-1);
    // Panel stays open so criteria can be stacked one after another
    inputRef.current?.focus();
  };

  const removeFilter = (params: string[]) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const param of params) next.delete(param);
    pushParams(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && flatOptions[activeIndex]) {
      applyOption(flatOptions[activeIndex]);
      return;
    }
    const term = query.trim();
    if (!term) return;
    applyOption({
      id: "free-text",
      kind: "freeText",
      term,
      label: term,
      icon: "search",
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (flatOptions.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (current === -1) return step === 1 ? 0 : flatOptions.length - 1;
        return (current + step + flatOptions.length) % flatOptions.length;
      });
      return;
    }

    if (event.key === "Escape") {
      if (isOpen) {
        setIsOpen(false);
        setActiveIndex(-1);
      } else {
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "Backspace" && query === "" && activeFilters.length > 0) {
      event.preventDefault();
      removeFilter(activeFilters[activeFilters.length - 1].params);
    }
  };

  const openPanel = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div
      id="search"
      ref={containerRef}
      className="relative max-w-2xl mx-auto scroll-mt-28"
    >
      <form onSubmit={handleSubmit} className="group">
        <div
          onClick={openPanel}
          className="flex items-center gap-2 w-full pl-3 pr-2 py-2 rounded-xl bg-white dark:bg-[#152e2a] shadow-soft dark:shadow-none cursor-text transition-all hover:shadow-md hover:ring-1 hover:ring-mosque/30 dark:hover:ring-hint-green/30 focus-within:ring-2 focus-within:ring-mosque dark:focus-within:ring-hint-green"
        >
          <button
            type="button"
            onClick={openPanel}
            aria-label={dictionary.search.hint}
            title={dictionary.search.hint}
            className="shrink-0 p-1 rounded-lg text-nordic-muted dark:text-gray-400 group-hover:text-mosque dark:group-hover:text-hint-green group-focus-within:text-mosque dark:group-focus-within:text-hint-green transition-colors"
          >
            <span className="material-icons text-2xl">search</span>
          </button>

          <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
            {activeFilters.map((filter) => (
              <span
                key={filter.params.join("-")}
                className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-mosque/10 dark:bg-hint-green/15 text-mosque dark:text-hint-green text-sm font-medium max-w-full"
              >
                <span className="material-icons text-sm shrink-0">
                  {filter.icon}
                </span>
                <span className="truncate">{filter.label}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFilter(filter.params);
                  }}
                  aria-label={dictionary.search.removeFilter.replace(
                    "{label}",
                    filter.label
                  )}
                  className="shrink-0 p-0.5 rounded-full hover:bg-mosque/20 dark:hover:bg-hint-green/25 transition-colors"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(-1);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeFilters.length > 0
                  ? dictionary.search.hint
                  : dictionary.home.searchPlaceholder
              }
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 && flatOptions[activeIndex]
                  ? `search-option-${flatOptions[activeIndex].id}`
                  : undefined
              }
              className="flex-1 min-w-32 py-2 bg-transparent border-none outline-none text-nordic-dark dark:text-white placeholder-nordic-muted/60 dark:placeholder-gray-400 text-lg"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 self-stretch px-6 bg-mosque hover:bg-mosque/90 dark:bg-hint-green dark:hover:bg-hint-green/90 text-white dark:text-nordic-dark font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-mosque/20 dark:shadow-hint-green/20"
          >
            {dictionary.home.searchBtn}
          </button>
        </div>
      </form>

      <span className="sr-only" aria-live="polite">
        {isOpen
          ? dictionary.search.suggestionsCount.replace(
              "{count}",
              facetMatchCount.toString()
            )
          : ""}
      </span>

      {isOpen && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 py-2 max-h-80 overflow-y-auto hide-scroll bg-white dark:bg-[#152e2a] border border-nordic-dark/5 dark:border-white/10 rounded-xl shadow-dropdown z-50 text-left"
        >
          {hasNoMatches && (
            <div className="flex items-center gap-3 px-4 py-3 text-nordic-muted dark:text-gray-400">
              <span className="material-icons text-xl">search_off</span>
              <p className="text-sm">
                {dictionary.search.noSuggestions.replace("{q}", query.trim())}
              </p>
            </div>
          )}

          {groups.map((group, groupIndex) => {
            const offset = groups
              .slice(0, groupIndex)
              .reduce((total, previous) => total + previous.options.length, 0);

            return (
              <div
                key={group.heading || "free-text"}
                className={
                  group.heading
                    ? ""
                    : "border-t border-nordic-dark/5 dark:border-white/10 mt-1 pt-1"
                }
              >
                {group.heading && (
                  <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-nordic-muted dark:text-gray-400">
                    {group.heading}
                  </p>
                )}
                {group.options.map((option, optionIndex) => {
                  const index = offset + optionIndex;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={option.id}
                      id={`search-option-${option.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => applyOption(option)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive
                          ? "bg-mosque/5 dark:bg-white/5"
                          : "hover:bg-mosque/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="material-icons text-lg text-nordic-muted dark:text-gray-400 shrink-0">
                        {option.icon}
                      </span>
                      <span className="flex-1 truncate text-sm text-nordic-dark dark:text-white">
                        {option.label}
                      </span>
                      {option.kind === "facet" && (
                        <span className="shrink-0 text-xs text-nordic-muted dark:text-gray-400 tabular-nums">
                          {option.facet.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
