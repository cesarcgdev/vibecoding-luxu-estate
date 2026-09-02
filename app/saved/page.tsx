import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import Navbar from "../../components/Navbar";
import Pagination from "../../components/Pagination";
import SavedToolbar from "../../components/saved/SavedToolbar";
import SavedPropertiesGrid from "../../components/saved/SavedPropertiesGrid";
import { getDictionary, defaultLocale } from "../../lib/i18n/dictionaries";
import { getSavedProperties, type SavedPropertyFilters } from "../../lib/saved-properties";
import { createClient } from "../../lib/supabase/server";

const PAGE_SIZE = 10;

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const dictionary = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center text-center py-20 px-6 rounded-2xl border border-dashed border-nordic-dark/10 dark:border-white/10 transition-colors">
            <span className="material-icons text-5xl text-nordic-muted/50 dark:text-gray-500">
              favorite_border
            </span>
            <h1 className="mt-4 text-2xl font-medium text-nordic-dark dark:text-white transition-colors">
              {dictionary.saved.loggedOutTitle}
            </h1>
            <p className="mt-2 max-w-md text-sm text-nordic-muted dark:text-gray-400 transition-colors">
              {dictionary.saved.loggedOutDesc}
            </p>
            <Link
              href="/login"
              className="mt-6 px-6 py-3 rounded-lg bg-mosque dark:bg-hint-green text-white dark:text-nordic-dark text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-mosque/20 dark:shadow-hint-green/20"
            >
              {dictionary.saved.loggedOutCta}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt((params.page as string) ?? "1", 10));

  const filters: SavedPropertyFilters = {
    q: params.q as string | undefined,
    operation: params.operation as string | undefined,
    minPrice: params.minPrice as string | undefined,
    maxPrice: params.maxPrice as string | undefined,
    beds: params.beds as string | undefined,
    baths: params.baths as string | undefined,
  };
  const isSearchActive = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  const { data: properties, count } = await getSavedProperties(
    user.id,
    currentPage,
    PAGE_SIZE,
    filters
  );
  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-nordic-dark dark:text-white transition-colors">
            {dictionary.saved.title}
          </h1>
          <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm transition-colors">
            {dictionary.saved.desc}{" "}
            {count > 0 && (
              <span className="text-mosque dark:text-hint-green font-medium">
                {dictionary.saved.resultsCount.replace("{count}", count.toString())}
              </span>
            )}
          </p>
        </div>

        <div className="mb-8">
          <SavedToolbar />
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 px-6 rounded-2xl border border-dashed border-nordic-dark/10 dark:border-white/10 transition-colors">
            <span className="material-icons text-5xl text-nordic-muted/50 dark:text-gray-500">
              {isSearchActive ? "search_off" : "favorite_border"}
            </span>
            <h3 className="mt-4 text-xl font-medium text-nordic-dark dark:text-white transition-colors">
              {isSearchActive ? dictionary.search.noResultsTitle : dictionary.saved.emptyTitle}
            </h3>
            <p className="mt-2 max-w-md text-sm text-nordic-muted dark:text-gray-400 transition-colors">
              {isSearchActive ? dictionary.saved.noMatchesDesc : dictionary.saved.emptyDesc}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {isSearchActive ? (
                <Link
                  href="/saved"
                  className="px-5 py-2.5 rounded-lg bg-mosque dark:bg-hint-green text-white dark:text-nordic-dark text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-mosque/20 dark:shadow-hint-green/20"
                >
                  {dictionary.search.clearAll}
                </Link>
              ) : (
                <>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg bg-white dark:bg-[#152e2a] border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white text-sm font-medium hover:border-mosque dark:hover:border-hint-green transition-all"
                  >
                    {dictionary.saved.emptyCtaBuy}
                  </Link>
                  <Link
                    href="/rent"
                    className="px-5 py-2.5 rounded-lg bg-mosque dark:bg-hint-green text-white dark:text-nordic-dark text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-mosque/20 dark:shadow-hint-green/20"
                  >
                    {dictionary.saved.emptyCtaRent}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <SavedPropertiesGrid
            key={JSON.stringify({ currentPage, filters })}
            properties={properties}
          />
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </main>
    </>
  );
}
