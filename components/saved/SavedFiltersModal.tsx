"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { formatCurrency } from "@/lib/currency/currency";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** "" (all), "sale" or "rent" — decides which price scale to show */
  operation: string;
}

const MIN_PRICE = 0;

/** Same scaling problem FiltersModal solves: a rent maxes out around 15,000, a sale around 10M */
const PRICE_BOUNDS: Record<"sale" | "rent", { max: number; step: number }> = {
  sale: { max: 10000000, step: 50000 },
  rent: { max: 15000, step: 50 },
};

/** A trimmed FiltersModal for /saved: price range + beds/baths only — no
 * location/property-type/amenities, and no rent-only fields, since the list
 * mixes sale and rental properties together. */
export default function SavedFiltersModal({ isOpen, onClose, operation }: Props) {
  const { dictionary, locale } = useLanguage();
  const { currency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isRent = operation === "rent";
  const { max: maxPrice, step: priceStep } = PRICE_BOUNDS[isRent ? "rent" : "sale"];

  // Abbreviating a rent would drop the digits a tenant is comparing
  const formatPrice = (value: number) =>
    formatCurrency(value, currency, locale, isRent ? "full" : "abbreviated")!;

  const initMin = parseInt(searchParams.get("minPrice") || "0", 10) || MIN_PRICE;
  const initMax = parseInt(searchParams.get("maxPrice") || "0", 10) || maxPrice;

  const [rangeMin, setRangeMin] = useState(initMin);
  const [rangeMax, setRangeMax] = useState(Math.min(initMax, maxPrice));
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("beds");
    params.delete("baths");
    params.delete("page");
    const search = params.toString();
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    const apply = (name: string, value: string | null) => {
      if (value) params.set(name, value);
      else params.delete(name);
    };

    apply("minPrice", rangeMin > MIN_PRICE ? rangeMin.toString() : null);
    apply("maxPrice", rangeMax < maxPrice ? rangeMax.toString() : null);
    apply("beds", beds > 0 ? beds.toString() : null);
    apply("baths", baths > 0 ? baths.toString() : null);

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    onClose();
  };

  if (!isOpen) return null;

  const minPercent = getPercent(rangeMin);
  const maxPercent = getPercent(rangeMax);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-20 w-full max-w-lg bg-white dark:bg-[#152e2a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        <header className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#152e2a] sticky top-0 z-30 transition-colors">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-nordic-dark dark:text-white transition-colors">
            {dictionary.filters.title}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
          >
            <span className="material-icons">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto hide-scroll p-4 sm:p-8 space-y-8 sm:space-y-10">
          <section>
            <div className="flex justify-between items-end mb-5">
              <label className="block text-xs font-semibold text-nordic-muted dark:text-gray-400 uppercase tracking-wider transition-colors">
                {dictionary.filters.priceRange}
              </label>
              <span className="text-sm font-semibold text-mosque dark:text-hint-green transition-colors">
                {formatPrice(rangeMin)} – {formatPrice(rangeMax)}
                {isRent && dictionary.rent.perMonth}
              </span>
            </div>

            <div className="relative h-10 flex items-center select-none mb-5" ref={sliderRef}>
              <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors" />
              <div
                className="absolute h-1.5 bg-mosque dark:bg-hint-green rounded-full transition-colors"
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
              />
              <div
                onPointerDown={startDrag("min")}
                className="absolute w-6 h-6 bg-white border-2 border-mosque dark:border-hint-green rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${minPercent}% - 12px)` }}
              />
              <div
                onPointerDown={startDrag("max")}
                className="absolute w-6 h-6 bg-white border-2 border-mosque dark:border-hint-green rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${maxPercent}% - 12px)` }}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                {dictionary.filters.bedrooms}
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
                  {beds === 0 ? dictionary.filters.any : `${beds}+`}
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

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-nordic-dark dark:text-gray-100 transition-colors">
                {dictionary.filters.bathrooms}
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
                  {baths === 0 ? dictionary.filters.any : `${baths}+`}
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
          </section>
        </div>

        <footer className="bg-white dark:bg-[#152e2a] border-t border-gray-100 dark:border-white/10 px-4 sm:px-8 py-4 sm:py-6 sticky bottom-0 z-30 flex items-center justify-between gap-3 transition-colors">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-nordic-dark dark:hover:text-white transition-colors underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4 whitespace-nowrap"
          >
            {dictionary.filters.clearAll}
          </button>
          <button
            type="submit"
            className="bg-mosque dark:bg-hint-green hover:bg-mosque/90 dark:hover:bg-hint-green/90 text-white dark:text-nordic-dark px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium shadow-lg shadow-mosque/30 dark:shadow-hint-green/30 transition-all hover:shadow-mosque/40 dark:hover:shadow-hint-green/40 flex items-center gap-2 active:scale-95 whitespace-nowrap"
          >
            {dictionary.filters.showProperties}
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
