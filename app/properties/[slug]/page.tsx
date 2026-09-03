import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import PropertyGallery from "../../../components/PropertyGallery";
import MapWrapper from "../../../components/MapWrapper";
import LandlordCard from "../../../components/LandlordCard";
import RentalConditions from "../../../components/RentalConditions";
import SaveButton from "../../../components/SaveButton";
import PropertyAbout from "../../../components/PropertyAbout";
import { getPropertyBySlug } from "../../../lib/properties";
import { getLandlord } from "../../../lib/landlords";
import { getSavedPropertyIds } from "../../../lib/saved-properties";
import {
  pricePeriodSuffix,
  rentalKindIcon,
  rentalKindLabel,
  splitPriceDisplay,
} from "../../../lib/rental-kinds";
import { supabase } from "../../../lib/supabase";
import { cookies } from "next/headers";
import { getDictionary, defaultLocale } from "../../../lib/i18n/dictionaries";
import { defaultCurrency, formatCurrency, type Currency } from "../../../lib/currency/currency";

export const revalidate = 60; // ISR

export async function generateStaticParams() {
  const { data } = await supabase
    .from("properties")
    .select("slug")
    .eq("is_active", true);
  if (!data) return [];
  return data.map((p) => ({
    slug: p.slug,
  }));
}

export default async function PropertyDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || defaultLocale;
  const dictionary = await getDictionary(locale);
  const currency =
    (cookieStore.get("NEXT_CURRENCY")?.value as Currency | undefined) || defaultCurrency;

  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  // images is now the single source of truth
  const images = property.images?.length ? property.images : [];

  const isRental = property.listing_type === "rent";
  // Mock listings and anything created before landlords existed have none
  const [landlord, savedIds] = await Promise.all([
    getLandlord(property.landlord_id),
    getSavedPropertyIds(),
  ]);

  const priceAmount =
    formatCurrency(property.price_value, currency, locale, "full") ??
    splitPriceDisplay(property.price_display, null, dictionary).amount;
  const priceUnit =
    isRental && property.price_period
      ? pricePeriodSuffix(property.price_period, dictionary)
      : null;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 space-y-4">
            <PropertyGallery images={images} title={property.title} />
          </div>

          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-mosque/5">
                <div className="mb-4">
                  {/* Operation and modality, same chips the cards use */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          isRental
                            ? "bg-mosque text-white"
                            : "bg-nordic-dark text-white"
                        }`}
                      >
                        {isRental
                          ? dictionary.tags["FOR RENT"]
                          : dictionary.tags["FOR SALE"]}
                      </span>
                      {isRental && property.rental_kind && (
                        <span className="flex items-center gap-1 bg-mosque/10 text-mosque text-[10px] font-semibold px-2 py-1 rounded">
                          <span className="material-icons text-[12px]">
                            {rentalKindIcon(property.rental_kind)}
                          </span>
                          {rentalKindLabel(property.rental_kind, dictionary)}
                        </span>
                      )}
                    </div>
                    <SaveButton
                      propertyId={property.id}
                      initialSaved={savedIds.has(property.id)}
                      className="p-2 rounded-full hover:bg-mosque/10 text-nordic-muted hover:text-mosque transition-colors"
                      iconClassName="text-2xl"
                      iconHoverClassName="group-hover:text-mosque"
                    />
                  </div>
                  <h1 className="text-2xl font-display font-semibold text-nordic-dark mb-1">
                    {property.title}
                  </h1>
                  <p
                    className={`text-4xl font-display font-light mb-2 ${
                      isRental ? "text-mosque" : "text-nordic-dark"
                    }`}
                  >
                    {priceAmount}
                    {priceUnit && (
                      <span className="text-xl text-nordic-muted ml-1">{priceUnit}</span>
                    )}
                  </p>
                  <p className="text-nordic-muted font-medium flex items-center gap-1">
                    <span className="material-icons text-mosque text-sm">location_on</span>
                    {property.location}
                  </p>
                </div>

                <div className="h-px bg-slate-100 my-6"></div>

                {/* Listings created before landlords existed keep the generic block */}
                {!landlord && (
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-mosque/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-mosque">
                      <span className="material-icons text-2xl">person</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-nordic-dark">{dictionary.property.agent}</h3>
                      <div className="flex items-center gap-1 text-xs text-mosque font-medium">
                        <span className="material-icons text-[14px]">star</span>
                        <span>{dictionary.property.topAgent}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button className="w-full bg-mosque hover:bg-mosque/90 text-white py-4 px-6 rounded-lg font-medium transition-all shadow-lg shadow-mosque/20 flex items-center justify-center gap-2 group">
                    <span className="material-icons text-xl group-hover:scale-110 transition-transform">calendar_today</span>
                    {dictionary.property.schedule}
                  </button>
                  <button className="w-full bg-transparent border border-nordic-dark/10 hover:border-mosque text-nordic-muted hover:text-mosque py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                    <span className="material-icons text-xl">mail_outline</span>
                    {dictionary.property.contact}
                  </button>
                </div>
              </div>

              {landlord && <LandlordCard landlord={landlord} />}

              <div className="bg-white p-2 rounded-xl shadow-sm border border-mosque/5">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                  <MapWrapper
                    location={property.location}
                    latitude={property.latitude}
                    longitude={property.longitude}
                  />
                  <a
                    className="absolute bottom-2 right-2 bg-white/90 text-xs font-medium px-2 py-1 rounded shadow-sm text-nordic-dark hover:text-mosque z-[1000]"
                    href="#"
                  >
                    {dictionary.property.viewMap}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8 -mt-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-mosque/5">
              <h2 className="text-lg font-semibold mb-6 text-nordic-dark">{dictionary.property.features}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">square_foot</span>
                  <span className="text-xl font-bold text-nordic-dark">{property.area}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted text-center">{dictionary.property.size}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">bed</span>
                  <span className="text-xl font-bold text-nordic-dark">{property.beds}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dictionary.property.bedrooms}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">shower</span>
                  <span className="text-xl font-bold text-nordic-dark">{property.baths}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dictionary.property.bathrooms}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-mosque/5 rounded-lg border border-mosque/10">
                  <span className="material-icons text-mosque text-2xl mb-2">directions_car</span>
                  <span className="text-xl font-bold text-nordic-dark">{property.parking ?? 0}</span>
                  <span className="text-xs uppercase tracking-wider text-nordic-muted">{dictionary.property.garage}</span>
                </div>
              </div>
            </div>

            <PropertyAbout property={property} dictionary={dictionary} />

            {/* A mortgage estimate means nothing on a let; the move-in cost is
                the equivalent decision for a tenant */}
            {isRental ? (
              <RentalConditions
                property={property}
                dictionary={dictionary}
                locale={locale}
                currency={currency}
              />
            ) : (
              <div className="bg-mosque/5 p-6 rounded-xl border border-mosque/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full text-mosque shadow-sm">
                    <span className="material-icons">calculate</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-nordic-dark">{dictionary.property.estimatedPayment}</h3>
                    <p className="text-sm text-nordic-muted">{dictionary.property.startingFrom} <strong className="text-mosque">{priceAmount}</strong></p>
                  </div>
                </div>
                <button className="whitespace-nowrap px-4 py-2 bg-white border border-nordic-dark/10 rounded-lg text-sm font-semibold hover:border-mosque transition-colors text-nordic-dark">
                  {dictionary.property.calcMortgage}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-nordic-muted">
            © 2026 LuxeEstate Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
