import React from "react";
import { cookies } from "next/headers";
import Navbar from "../../components/Navbar";
import FeaturedPropertyCard from "../../components/FeaturedPropertyCard";
import PropertyCard from "../../components/PropertyCard";
import Pagination from "../../components/Pagination";
import RentalKindBar from "../../components/RentalKindBar";
import SearchBar from "../../components/SearchBar";
import NoResults from "../../components/NoResults";
import { getDictionary, defaultLocale } from "../../lib/i18n/dictionaries";
import {
  getFeaturedRentals,
  getRentalFacets,
  getRentalProperties,
  type RentalFilters,
} from "../../lib/rentals";
import { getSavedPropertyIds } from "../../lib/saved-properties";

const PAGE_SIZE = 8;

export default async function Rent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const dictionary = await getDictionary(locale);

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt((params.page as string) ?? "1", 10));

  const filters: RentalFilters = {
    q: params.q as string | undefined,
    type: params.type as string | undefined,
    location: params.location as string | undefined,
    minPrice: params.minPrice as string | undefined,
    maxPrice: params.maxPrice as string | undefined,
    beds: params.beds as string | undefined,
    baths: params.baths as string | undefined,
    kind: params.kind as string | undefined,
    minStay: params.minStay as string | undefined,
    maxDeposit: params.maxDeposit as string | undefined,
    furnished: params.furnished as string | undefined,
    utilities: params.utilities as string | undefined,
    availableFrom: params.availableFrom as string | undefined,
  };
  const isSearchActive = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  const [featuredRentals, { data: rentals, count }, facets, savedIds] = await Promise.all([
    getFeaturedRentals(),
    getRentalProperties(currentPage, PAGE_SIZE, filters),
    getRentalFacets(),
    getSavedPropertyIds(),
  ]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-nordic-dark dark:text-white leading-tight transition-colors">
              {dictionary.rent.heroPrefix}
              <span className="relative inline-block">
                <span className="relative z-10 font-medium">
                  {dictionary.rent.heroHighlight}
                </span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-mosque/20 dark:bg-hint-green/30 -rotate-1 z-0"></span>
              </span>
              {dictionary.rent.heroSuffix}
            </h1>
            <SearchBar facets={facets} variant="rent" />
            <RentalKindBar />
          </div>
        </section>

        {/* Hiding the band during a search keeps the grid answering the query */}
        {!isSearchActive && featuredRentals.length > 0 && (
          <section className="mb-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-light text-nordic-dark dark:text-white transition-colors">
                  {dictionary.rent.featuredTitle}
                </h2>
                <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm transition-colors">
                  {dictionary.rent.featuredDesc}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredRentals.map((property) => (
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
                {dictionary.rent.title}
              </h2>
              <p className="text-nordic-muted dark:text-gray-400 mt-1 text-sm transition-colors">
                {dictionary.rent.desc}{" "}
                <span className="text-mosque dark:text-hint-green font-medium">
                  {dictionary.rent.resultsCount.replace("{count}", count.toString())}
                </span>
              </p>
            </div>
          </div>
          {rentals.length === 0 ? (
            <NoResults variant="rent" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rentals.map((property) => (
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
