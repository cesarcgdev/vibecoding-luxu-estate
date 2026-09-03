import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import FeaturedPropertyCard from "../components/FeaturedPropertyCard";
import PropertyCard from "../components/PropertyCard";
import Pagination from "../components/Pagination";
import FilterCategoryBar from "../components/FilterCategoryBar";
import SearchBar from "../components/SearchBar";
import NoResults from "../components/NoResults";
import { cookies } from "next/headers";
import { getDictionary, defaultLocale } from "../lib/i18n/dictionaries";
import { getFeaturedProperties, getMarketProperties } from "../lib/properties";
import { getSearchFacets } from "../lib/search-facets";
import { getSavedPropertyIds } from "../lib/saved-properties";

const PAGE_SIZE = 8;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const dictionary = await getDictionary(locale);

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt((params.page as string) ?? "1", 10));

  const filters = {
    q: params.q as string | undefined,
    type: params.type as string | undefined,
    location: params.location as string | undefined,
    minPrice: params.minPrice as string | undefined,
    maxPrice: params.maxPrice as string | undefined,
    beds: params.beds as string | undefined,
    baths: params.baths as string | undefined,
  };
  const isSearchActive = Object.values(filters).some(val => val !== undefined && val !== "");

  const [featuredProperties, { data: marketProperties, count }, facets, savedIds] =
    await Promise.all([
      getFeaturedProperties(),
      getMarketProperties(currentPage, PAGE_SIZE, filters),
      getSearchFacets(),
      getSavedPropertyIds(),
    ]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-nordic-dark dark:text-white leading-tight transition-colors">
              {dictionary.home.heroPrefix}
              <span className="relative inline-block">
                <span className="relative z-10 font-medium">{dictionary.home.heroHighlight}</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-mosque/20 dark:bg-hint-green/30 -rotate-1 z-0"></span>
              </span>
              {dictionary.home.heroSuffix}
            </h1>
            <SearchBar facets={facets} />
            <FilterCategoryBar />
          </div>
        </section>

        {!isSearchActive && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light text-nordic-dark dark:text-white transition-colors">
                  {dictionary.home.featuredTitle}
                </h2>
                <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm transition-colors">
                  {dictionary.home.featuredDesc}
                </p>
              </div>
              <a
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque dark:text-hint-green hover:opacity-70 transition-opacity"
                href="#"
              >
                {dictionary.home.viewAll} <span className="material-icons text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredProperties.map((property) => (
                <FeaturedPropertyCard
                  key={property.id}
                  property={property}
                  initialSaved={savedIds.has(property.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-nordic-dark dark:text-white transition-colors">
                {dictionary.home.newMarketTitle}
              </h2>
              <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm transition-colors">
                {dictionary.home.newMarketDesc}{" "}
                <span className="text-mosque dark:text-hint-green font-medium">{dictionary.home.propertiesCount.replace("{count}", count.toString())}</span>
              </p>
            </div>
            {/* Buy and rent are separate pages now, so these navigate rather
                than filter — they were three dead buttons before. */}
            <div className="hidden md:flex bg-white dark:bg-[#152e2a] p-1 rounded-lg transition-colors">
              <span className="px-4 py-1.5 rounded-md text-sm font-medium bg-nordic-dark dark:bg-white text-white dark:text-nordic-dark shadow-sm transition-colors">
                {dictionary.home.filterBuy}
              </span>
              <Link
                href="/rent"
                className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted dark:text-gray-400 hover:text-nordic-dark dark:hover:text-white transition-colors"
              >
                {dictionary.home.filterRent}
              </Link>
            </div>
          </div>
          {marketProperties.length === 0 ? (
            <NoResults />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {marketProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  initialSaved={savedIds.has(property.id)}
                />
              ))}
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </section>
      </main>
    </>
  );
}
