"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { FilterVariant } from "@/lib/search-filters";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** "rent" rescales the price slider and adds the rental criteria */
  variant?: FilterVariant;
}

const MIN_PRICE = 0;

/**
 * The price slider has to be scaled to the operation. A track that runs to ten
 * million puts a 1,200 a month rental inside the first 0.012% of its width —
 * the handle cannot be placed there, and the 50,000 snap would round the value
 * to zero. Rents get their own ceiling and their own step.
 *
 * The rent ceiling is set against rent_monthly_eq, not the headline price: a
 * holiday let at 450 a night normalises to 13,500 a month, so a 10,000 ceiling
 * would put the most expensive rentals permanently out of reach of the filter.
 */
const PRICE_BOUNDS: Record<FilterVariant, { max: number; step: number }> = {
  sale: { max: 10000000, step: 50000 },
  rent: { max: 15000, step: 50 },
};

function formatPrice(value: number, variant: FilterVariant): string {
  // Abbreviating a rent would drop the digits a tenant is comparing
  if (variant === "rent") return `$${value.toLocaleString()}`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function FiltersModal({
  isOpen,
  onClose,
  variant = "sale",
}: FiltersModalProps) {
  const { dictionary } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isRent = variant === "rent";
  const { max: maxPrice, step: priceStep } = PRICE_BOUNDS[variant];

  const initMin = parseInt(searchParams.get("minPrice") || "0", 10) || MIN_PRICE;
  const initMax = parseInt(searchParams.get("maxPrice") || "0", 10) || maxPrice;

  const [rangeMin, setRangeMin] = useState(initMin);
  const [rangeMax, setRangeMax] = useState(initMax);
  const [beds, setBeds] = useState(parseInt(searchParams.get("beds") || "0", 10));
  const [baths, setBaths] = useState(parseInt(searchParams.get("baths") || "0", 10));

  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const getPercent = (val: number) =>
    Math.round(((val - MIN_PRICE) / (maxPrice - MIN_PRICE)) * 100);

  const getValueFromX = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const raw = MIN_PRICE + ratio * (maxPrice - MIN_PRICE);
      return Math.round(raw / priceStep) * priceStep;
    },
    [maxPrice, priceStep]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const val = getValueFromX(e.clientX);
      if (dragging.current === "min") {
        setRangeMin(Math.min(val, rangeMax - priceStep));
      } else {
        setRangeMax(Math.max(val, rangeMin + priceStep));
      }
    },
    [getValueFromX, rangeMin, rangeMax, priceStep]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const startDrag = (handle: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = handle;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Keep listeners up-to-date
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const handleClear = () => {
    setRangeMin(MIN_PRICE);
    setRangeMax(maxPrice);
    setBeds(0);
    setBaths(0);
    // The modality tab lives in the same URL and is not a modal filter
    const kind = searchParams.get("kind");
    router.push(kind ? `${pathname}?kind=${kind}` : pathname, { scroll: false });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    /** Writes a param when there is a value, and drops it when there is not */
    const apply = (name: string, value: string | null) => {
      if (value) params.set(name, value);
      else params.delete(name);
    };

    apply("location", formData.get("location") as string);
    apply("minPrice", rangeMin > MIN_PRICE ? rangeMin.toString() : null);
    apply("maxPrice", rangeMax < maxPrice ? rangeMax.toString() : null);

    const propertyType = formData.get("propertyType") as string;
    apply("type", propertyType && propertyType !== "Any Type" ? propertyType : null);

    apply("beds", beds > 0 ? beds.toString() : null);
    apply("baths", baths > 0 ? baths.toString() : null);

    if (isRent) {
      apply("minStay", formData.get("minStay") as string);
      apply("maxDeposit", formData.get("maxDeposit") as string);
      apply("availableFrom", formData.get("availableFrom") as string);
      apply("furnished", formData.get("furnished") ? "true" : null);
      apply("utilities", formData.get("utilities") ? "true" : null);
    }

    params.delete("page");
    router.push(pathname + "?" + params.toString(), { scroll: false });
    onClose();
  };

  if (!isOpen) return null;

  const minPercent = getPercent(rangeMin);
  const maxPercent = getPercent(rangeMax);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-20 w-full max-w-2xl bg-white dark:bg-[#152e2a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#152e2a] sticky top-0 z-30 transition-colors">
          <h1 className="text-2xl font-semibold tracking-tight text-nordic-dark dark:text-white transition-colors">
            {dictionary.filters?.title || "Filters"}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
          >
            <span className="material-icons">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scroll p-8 space-y-10">
          {/* Section 1: Location */}
          <section>
            <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors">
              {dictionary.filters?.location || "Location"}
            </label>
            <div className="relative group">
              <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-mosque dark:group-focus-within:text-hint-green transition-colors">
                location_on
              </span>
              <input
                name="location"
                className="w-full pl-12 pr-4 py-3 bg-[#f5f8f6] dark:bg-[#1a3833] border-0 rounded-lg text-nordic-dark dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-mosque dark:focus:ring-hint-green focus:bg-white dark:focus:bg-[#0f231f] transition-all shadow-sm outline-none"
                placeholder={dictionary.filters?.locationPlaceholder || "City, neighborhood, or address"}
                type="text"
                defaultValue={searchParams.get("location") || ""}
              />
            </div>
          </section>

          {/* Section 2: Price Range */}
          <section>
            <div className="flex justify-between items-end mb-5">
              <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider transition-colors">
                {dictionary.filters?.priceRange || "Price Range"}
              </label>
              <span className="text-sm font-semibold text-mosque dark:text-hint-green transition-colors">
                {formatPrice(rangeMin, variant)} – {formatPrice(rangeMax, variant)}
                {isRent && dictionary.rent.perMonth}
              </span>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-10 flex items-center select-none mb-5" ref={sliderRef}>
              {/* Track background */}
              <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors" />
              {/* Active track */}
              <div
                className="absolute h-1.5 bg-mosque dark:bg-hint-green rounded-full transition-colors"
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
              />
              {/* Min handle */}
              <div
                onPointerDown={startDrag("min")}
                className="absolute w-6 h-6 bg-white border-2 border-mosque dark:border-hint-green rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${minPercent}% - 12px)` }}
              />
              {/* Max handle */}
              <div
                onPointerDown={startDrag("max")}
                className="absolute w-6 h-6 bg-white border-2 border-mosque dark:border-hint-green rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${maxPercent}% - 12px)` }}
              />
            </div>


          </section>

          {/* Section 3: Property Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Property Type */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider transition-colors">
                {dictionary.filters?.propertyType || "Property Type"}
              </label>
              <div className="relative">
                <select
                  name="propertyType"
                  className="w-full bg-[#f5f8f6] dark:bg-[#1a3833] border-0 rounded-lg py-3 pl-4 pr-10 text-nordic-dark dark:text-white appearance-none focus:ring-2 focus:ring-mosque dark:focus:ring-hint-green cursor-pointer outline-none transition-colors"
                  defaultValue={searchParams.get("type") || "Any Type"}
                >
                  <option value="Any Type">{dictionary.filters?.anyType || "Any Type"}</option>
                  <option value="House">{dictionary.filters?.house || "House"}</option>
                  <option value="Apartment">{dictionary.filters?.apartment || "Apartment"}</option>
                  <option value="Villa">{dictionary.filters?.villa || "Villa"}</option>
                  <option value="Penthouse">{dictionary.filters?.penthouse || "Penthouse"}</option>
                </select>
                <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Rooms */}
            <div className="space-y-4">
              {/* Beds */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                  {dictionary.filters?.bedrooms || "Bedrooms"}
                </span>
                <div className="flex items-center gap-2 bg-[#f5f8f6] dark:bg-[#1a3833] rounded-full px-1 py-1 transition-colors">
                  <button
                    type="button"
                    onClick={() => setBeds(Math.max(0, beds - 1))}
                    disabled={beds === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-mosque dark:hover:text-hint-green disabled:opacity-30 transition-colors"
                  >
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-8 text-center text-nordic-dark dark:text-white transition-colors">
                    {beds === 0 ? (dictionary.filters?.any || "Any") : `${beds}+`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBeds(beds + 1)}
                    className="w-8 h-8 rounded-full bg-mosque dark:bg-hint-green shadow-sm flex items-center justify-center text-white dark:text-nordic-dark hover:bg-mosque/90 dark:hover:bg-hint-green/90 transition-colors"
                  >
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>

              {/* Baths */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                  {dictionary.filters?.bathrooms || "Bathrooms"}
                </span>
                <div className="flex items-center gap-2 bg-[#f5f8f6] dark:bg-[#1a3833] rounded-full px-1 py-1 transition-colors">
                  <button
                    type="button"
                    onClick={() => setBaths(Math.max(0, baths - 1))}
                    disabled={baths === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-mosque dark:hover:text-hint-green disabled:opacity-30 transition-colors"
                  >
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-8 text-center text-nordic-dark dark:text-white transition-colors">
                    {baths === 0 ? (dictionary.filters?.any || "Any") : `${baths}+`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBaths(baths + 1)}
                    className="w-8 h-8 rounded-full bg-mosque dark:bg-hint-green shadow-sm flex items-center justify-center text-white dark:text-nordic-dark hover:bg-mosque/90 dark:hover:bg-hint-green/90 transition-colors"
                  >
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Rental terms — only meaningful on /rent */}
          {isRent && (
            <section className="space-y-6">
              <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider transition-colors">
                {dictionary.rent.conditions}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="block text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                    {dictionary.rent.minStay}
                  </span>
                  <div className="relative">
                    <select
                      name="minStay"
                      className="w-full bg-[#f5f8f6] dark:bg-[#1a3833] border-0 rounded-lg py-3 pl-4 pr-10 text-nordic-dark dark:text-white appearance-none focus:ring-2 focus:ring-mosque dark:focus:ring-hint-green cursor-pointer outline-none transition-colors"
                      defaultValue={searchParams.get("minStay") || ""}
                    >
                      <option value="">{dictionary.rent.minStayAny}</option>
                      {[1, 3, 6, 9, 12].map((months) => (
                        <option key={months} value={months}>
                          {dictionary.rent.minStayChip.replace("{n}", String(months))}
                        </option>
                      ))}
                    </select>
                    <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                    {dictionary.rent.deposit}
                  </span>
                  <div className="relative">
                    <select
                      name="maxDeposit"
                      className="w-full bg-[#f5f8f6] dark:bg-[#1a3833] border-0 rounded-lg py-3 pl-4 pr-10 text-nordic-dark dark:text-white appearance-none focus:ring-2 focus:ring-mosque dark:focus:ring-hint-green cursor-pointer outline-none transition-colors"
                      defaultValue={searchParams.get("maxDeposit") || ""}
                    >
                      <option value="">{dictionary.filters?.any || "Any"}</option>
                      {[1, 2, 3].map((months) => (
                        <option key={months} value={months}>
                          {dictionary.rent.depositValue.replace("{n}", String(months))}
                        </option>
                      ))}
                    </select>
                    <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                    {dictionary.rent.availableFrom}
                  </span>
                  <input
                    name="availableFrom"
                    type="date"
                    defaultValue={searchParams.get("availableFrom") || ""}
                    className="w-full bg-[#f5f8f6] dark:bg-[#1a3833] border-0 rounded-lg py-3 px-4 text-nordic-dark dark:text-white focus:ring-2 focus:ring-mosque dark:focus:ring-hint-green outline-none transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg bg-[#f5f8f6] dark:bg-[#1a3833] transition-colors">
                    <input
                      name="furnished"
                      type="checkbox"
                      defaultChecked={searchParams.get("furnished") === "true"}
                      className="w-4 h-4 accent-mosque dark:accent-hint-green"
                    />
                    <span className="material-icons text-lg text-gray-400">chair</span>
                    <span className="text-sm font-medium text-nordic-dark dark:text-gray-100">
                      {dictionary.rent.furnished}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg bg-[#f5f8f6] dark:bg-[#1a3833] transition-colors">
                    <input
                      name="utilities"
                      type="checkbox"
                      defaultChecked={searchParams.get("utilities") === "true"}
                      className="w-4 h-4 accent-mosque dark:accent-hint-green"
                    />
                    <span className="material-icons text-lg text-gray-400">bolt</span>
                    <span className="text-sm font-medium text-nordic-dark dark:text-gray-100">
                      {dictionary.rent.utilitiesIncluded}
                    </span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Section 5: Amenities */}
          <section>
            <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider mb-4 transition-colors">
              {dictionary.filters?.amenities || "Amenities & Features"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-mosque dark:border-hint-green bg-mosque/5 dark:bg-hint-green/10 text-mosque dark:text-hint-green font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-mosque/10 dark:peer-checked:bg-hint-green/20 peer-checked:border-mosque dark:peer-checked:border-hint-green hover:bg-mosque/10 dark:hover:bg-hint-green/20">
                  <span className="material-icons text-lg">pool</span>
                  {dictionary.filters?.swimmingPool || "Swimming Pool"}
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-mosque dark:bg-hint-green rounded-full transition-colors" />
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a3833] text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-white/20 peer-checked:border-mosque dark:peer-checked:border-hint-green peer-checked:bg-mosque/5 dark:peer-checked:bg-hint-green/10 peer-checked:text-mosque dark:peer-checked:text-hint-green">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-mosque dark:peer-checked:text-hint-green">fitness_center</span>
                  {dictionary.filters?.gym || "Gym"}
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a3833] text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-white/20 peer-checked:border-mosque dark:peer-checked:border-hint-green peer-checked:bg-mosque/5 dark:peer-checked:bg-hint-green/10 peer-checked:text-mosque dark:peer-checked:text-hint-green">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-mosque dark:peer-checked:text-hint-green">local_parking</span>
                  {dictionary.filters?.parking || "Parking"}
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a3833] text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-white/20 peer-checked:border-mosque dark:peer-checked:border-hint-green peer-checked:bg-mosque/5 dark:peer-checked:bg-hint-green/10 peer-checked:text-mosque dark:peer-checked:text-hint-green">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-mosque dark:peer-checked:text-hint-green">ac_unit</span>
                  {dictionary.filters?.airConditioning || "Air Conditioning"}
                </div>
              </label>

              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-mosque dark:border-hint-green bg-mosque/5 dark:bg-hint-green/10 text-mosque dark:text-hint-green font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-mosque/10 dark:peer-checked:bg-hint-green/20 peer-checked:border-mosque dark:peer-checked:border-hint-green hover:bg-mosque/10 dark:hover:bg-hint-green/20">
                  <span className="material-icons text-lg">wifi</span>
                  {dictionary.filters?.wifi || "High-speed Wifi"}
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-mosque dark:bg-hint-green rounded-full transition-colors" />
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a3833] text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-white/20 peer-checked:border-mosque dark:peer-checked:border-hint-green peer-checked:bg-mosque/5 dark:peer-checked:bg-hint-green/10 peer-checked:text-mosque dark:peer-checked:text-hint-green">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-mosque dark:peer-checked:text-hint-green">deck</span>
                  {dictionary.filters?.patio || "Patio / Terrace"}
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#152e2a] border-t border-gray-100 dark:border-white/10 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between transition-colors">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-nordic-dark dark:hover:text-white transition-colors underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4"
          >
            {dictionary.filters?.clearAll || "Clear all filters"}
          </button>
          <button
            type="submit"
            className="bg-mosque dark:bg-hint-green hover:bg-mosque/90 dark:hover:bg-hint-green/90 text-white dark:text-nordic-dark px-8 py-3 rounded-lg font-medium shadow-lg shadow-mosque/30 dark:shadow-hint-green/30 transition-all hover:shadow-mosque/40 dark:hover:shadow-hint-green/40 flex items-center gap-2 active:scale-95"
          >
            {dictionary.filters?.showProperties || "Show Properties"}
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
