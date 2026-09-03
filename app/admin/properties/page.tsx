import Image from "next/image";
import Link from "next/link";
import { getAdminProperties } from "@/app/actions/properties";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";
import PropertyVisibilityButton from "@/components/admin/PropertyVisibilityButton";
import PropertyAdminSearch from "@/components/admin/PropertyAdminSearch";
import { normalize } from "@/lib/search-filters";
import { defaultCurrency, formatCurrency, type Currency } from "@/lib/currency/currency";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Property Management | LuxeEstate Admin",
};

const PAGE_SIZE = 10;

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const currency =
    (cookieStore.get("NEXT_CURRENCY")?.value as Currency | undefined) || defaultCurrency;

  const resolvedParams = await searchParams;
  const requestedPage = parseInt(resolvedParams.page as string, 10);
  const tab = resolvedParams.tab === "hidden" ? "hidden" : "active";
  const query =
    typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : "";

  // The admin table lists the rows that actually exist, so the edit and delete
  // buttons always act on real ids — paging happens here rather than in the query.
  const { data: allProperties, error } = await getAdminProperties();

  // Every term has to appear somewhere, so "villa miami" narrows instead of widening
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = terms.length
    ? allProperties.filter((p) => {
        const haystack = normalize(
          [p.title, p.location, p.slug].filter(Boolean).join(" ")
        );
        return terms.every((term) => haystack.includes(term));
      })
    : allProperties;

  // Counting matches per tab tells you which tab the property you searched for is in
  // Rows saved before the is_active column existed read as undefined, not false
  const activeProperties = matches.filter((p) => p.is_active !== false);
  const hiddenProperties = matches.filter((p) => p.is_active === false);
  const scoped = tab === "hidden" ? hiddenProperties : activeProperties;

  const count = scoped.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  );

  const properties = scoped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, count);

  // Every in-page link has to carry the tab and the search, or clicking one
  // silently throws away the filter the admin is looking at
  const buildHref = (next: { tab?: "active" | "hidden"; page?: number }) => {
    const params = new URLSearchParams();
    if ((next.tab ?? tab) === "hidden") params.set("tab", "hidden");
    if (query) params.set("q", query);
    if (next.page && next.page > 1) params.set("page", String(next.page));

    const search = params.toString();
    return search ? `/admin/properties?${search}` : "/admin/properties";
  };

  // Switching tabs starts over at page 1 — the other tab has its own length
  const pageHref = (n: number) => buildHref({ page: n });

  // A search that comes up empty here has usually landed in the other tab
  const otherTab = tab === "hidden" ? "active" : "hidden";
  const otherTabCount =
    tab === "hidden" ? activeProperties.length : hiddenProperties.length;

  const tabClass = (isCurrent: boolean) =>
    isCurrent
      ? "pb-3 text-sm font-semibold text-primary border-b-2 border-primary"
      : "pb-3 text-sm font-medium text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-white transition-colors";

  return (
    <div className="w-full py-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nordic dark:text-white tracking-tight">
            My Properties
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your portfolio and track performance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <PropertyAdminSearch query={query} tab={tab} />
          <Link
            href="/admin/properties/new"
            className="shrink-0 h-11 px-5 bg-nordic hover:bg-nordic-muted text-white dark:bg-white dark:text-nordic dark:hover:bg-gray-100 border border-transparent rounded-lg text-sm font-medium shadow-md transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="material-icons text-base">add</span> Add New
            Property
          </Link>
        </div>
      </div>

      {/* Active / Hidden tabs */}
      <div className="mb-6 flex gap-6 border-b border-nordic/10 dark:border-primary/20 overflow-x-auto">
        <Link
          href={buildHref({ tab: "active" })}
          className={tabClass(tab === "active")}
        >
          Active ({activeProperties.length})
        </Link>
        <Link
          href={buildHref({ tab: "hidden" })}
          className={tabClass(tab === "hidden")}
        >
          Hidden ({hiddenProperties.length})
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
          Could not load properties from Supabase: {error}
        </div>
      )}

      {/* Property List Container */}
      <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-200 dark:border-primary/20 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-primary/10 border-b border-gray-100 dark:border-primary/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">Property Details</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {properties.length === 0 ? (
          <div className="p-10 text-center text-nordic/50 dark:text-gray-400 bg-white dark:bg-background-dark">
            {query ? (
              <>
                No {tab} properties match &ldquo;{query}&rdquo;.
                {otherTabCount > 0 && (
                  <>
                    {" "}
                    <Link
                      href={buildHref({ tab: otherTab })}
                      className="text-primary underline hover:no-underline"
                    >
                      {otherTabCount === 1
                        ? "1 match is"
                        : `${otherTabCount} matches are`}{" "}
                      in the {otherTab === "hidden" ? "Hidden" : "Active"} tab.
                    </Link>
                  </>
                )}
              </>
            ) : tab === "hidden" ? (
              "No hidden properties."
            ) : (
              <>
                No properties found.{" "}
                <Link
                  href="/admin/properties/new"
                  className="text-primary underline hover:no-underline"
                >
                  Add your first property.
                </Link>
              </>
            )}
          </div>
        ) : (
          properties.map((property) => {
            const isActive = property.is_active !== false;

            return (
            <div
              key={property.id}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 dark:border-primary/10 hover:bg-background-light dark:hover:bg-primary/10 transition-colors items-center"
            >
              {/* Property Details */}
              <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                <div className="relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={property.images?.[0] || "/images/placeholder.jpg"}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-nordic dark:text-white group-hover:text-primary transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {property.location}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bed</span>{" "}
                      {property.beds} Beds
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">
                        bathtub
                      </span>{" "}
                      {property.baths} Baths
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{property.listing_type || "Sale"}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-6 md:col-span-2">
                <div className="text-base font-semibold text-nordic dark:text-gray-200">
                  {formatCurrency(property.price_value, currency, "en", "full") ??
                    property.price_display}
                </div>
                <div className="text-xs text-gray-400">
                  Created:{" "}
                  {new Date(property.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-6 md:col-span-2">
                {isActive ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-nordic/10 text-nordic dark:bg-white/10 dark:text-gray-200 border border-nordic/10 dark:border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-nordic dark:bg-white mr-1.5"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                    Hidden
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/properties/${property.id}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-hint-green/30 transition-all"
                  title="Edit Property"
                >
                  <span className="material-icons text-xl">edit</span>
                </Link>
                <PropertyVisibilityButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  isActive={isActive}
                />
                {/* Permanent deletion is a last resort, so it only exists once
                    a property has already been taken off the public site */}
                {!isActive && (
                  <DeletePropertyButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                  />
                )}
              </div>
            </div>
            );
          })
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-primary/10 border-t border-gray-100 dark:border-primary/10">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-nordic dark:text-white">
              {count > 0 ? startItem : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-nordic dark:text-white">
              {endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium text-nordic dark:text-white">
              {count}
            </span>{" "}
            results
          </div>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20"
              >
                Previous
              </Link>
            ) : (
              <button
                className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 opacity-50 cursor-not-allowed"
                disabled
              >
                Previous
              </button>
            )}

            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20"
              >
                Next
              </Link>
            ) : (
              <button
                className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 opacity-50 cursor-not-allowed"
                disabled
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
