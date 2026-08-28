"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PropertyAdminSearchProps {
  /** The query the server rendered with — the source of truth after navigation */
  query: string;
  tab: "active" | "hidden";
}

const DEBOUNCE_MS = 250;

export default function PropertyAdminSearch({
  query,
  tab,
}: PropertyAdminSearchProps) {
  const [value, setValue] = useState(query);
  const router = useRouter();

  useEffect(() => {
    // Already showing these results — nothing to navigate to
    if (value.trim() === query) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (tab === "hidden") params.set("tab", "hidden");
      if (value.trim()) params.set("q", value.trim());

      // `page` is deliberately dropped: a narrower list invalidates it
      const search = params.toString();
      router.replace(
        search ? `/admin/properties?${search}` : "/admin/properties",
        { scroll: false }
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, query, tab, router]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 pointer-events-none">
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by title, location or slug…"
        aria-label="Search properties"
        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-primary/30 bg-white dark:bg-background-dark text-nordic dark:text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          title="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-nordic dark:hover:text-white hover:bg-gray-100 dark:hover:bg-primary/20 transition-colors"
        >
          <span className="material-icons text-lg">close</span>
        </button>
      )}
    </div>
  );
}
