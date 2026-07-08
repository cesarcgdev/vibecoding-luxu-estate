"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_PRICE = 0;
const MAX_PRICE = 10000000;

function formatPrice(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function FiltersModal({ isOpen, onClose }: FiltersModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initMin = parseInt(searchParams.get("minPrice") || "0", 10) || MIN_PRICE;
  const initMax = parseInt(searchParams.get("maxPrice") || "0", 10) || MAX_PRICE;

  const [rangeMin, setRangeMin] = useState(initMin);
  const [rangeMax, setRangeMax] = useState(initMax);
  const [beds, setBeds] = useState(parseInt(searchParams.get("beds") || "0", 10));
  const [baths, setBaths] = useState(parseInt(searchParams.get("baths") || "0", 10));

  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const getPercent = (val: number) =>
    Math.round(((val - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100);

  const getValueFromX = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const raw = MIN_PRICE + ratio * (MAX_PRICE - MIN_PRICE);
    // snap to 50k increments
    return Math.round(raw / 50000) * 50000;
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current) return;
      const val = getValueFromX(e.clientX);
      if (dragging.current === "min") {
        setRangeMin(Math.min(val, rangeMax - 50000));
      } else {
        setRangeMax(Math.max(val, rangeMin + 50000));
      }
    },
    [getValueFromX, rangeMin, rangeMax]
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
    setRangeMax(MAX_PRICE);
    setBeds(0);
    setBaths(0);
    router.push(pathname, { scroll: false });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    const location = formData.get("location") as string;
    const propertyType = formData.get("propertyType") as string;

    if (location) params.set("location", location);
    else params.delete("location");

    if (rangeMin > MIN_PRICE) params.set("minPrice", rangeMin.toString());
    else params.delete("minPrice");

    if (rangeMax < MAX_PRICE) params.set("maxPrice", rangeMax.toString());
    else params.delete("maxPrice");

    if (propertyType && propertyType !== "Any Type") params.set("type", propertyType);
    else params.delete("type");

    if (beds > 0) params.set("beds", beds.toString());
    else params.delete("beds");

    if (baths > 0) params.set("baths", baths.toString());
    else params.delete("baths");

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
        className="relative z-20 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-30">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Filters
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <span className="material-icons">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scroll p-8 space-y-10">
          {/* Section 1: Location */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Location
            </label>
            <div className="relative group">
              <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#006611] transition-colors">
                location_on
              </span>
              <input
                name="location"
                className="w-full pl-12 pr-4 py-3 bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#006611] focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm outline-none"
                placeholder="City, neighborhood, or address"
                type="text"
                defaultValue={searchParams.get("location") || ""}
              />
            </div>
          </section>

          {/* Section 2: Price Range */}
          <section>
            <div className="flex justify-between items-end mb-5">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price Range
              </label>
              <span className="text-sm font-semibold text-[#006611]">
                {formatPrice(rangeMin)} – {formatPrice(rangeMax)}
              </span>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-10 flex items-center select-none mb-5" ref={sliderRef}>
              {/* Track background */}
              <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
              {/* Active track */}
              <div
                className="absolute h-1.5 bg-[#006611] rounded-full"
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
              />
              {/* Min handle */}
              <div
                onPointerDown={startDrag("min")}
                className="absolute w-6 h-6 bg-white border-2 border-[#006611] rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${minPercent}% - 12px)` }}
              />
              {/* Max handle */}
              <div
                onPointerDown={startDrag("max")}
                className="absolute w-6 h-6 bg-white border-2 border-[#006611] rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
                style={{ left: `calc(${maxPercent}% - 12px)` }}
              />
            </div>


          </section>

          {/* Section 3: Property Details */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Property Type */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Property Type
              </label>
              <div className="relative">
                <select
                  name="propertyType"
                  className="w-full bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg py-3 pl-4 pr-10 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#006611] cursor-pointer outline-none"
                  defaultValue={searchParams.get("type") || "Any Type"}
                >
                  <option>Any Type</option>
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>Penthouse</option>
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
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Bedrooms
                </span>
                <div className="flex items-center gap-2 bg-[#f5f8f6] dark:bg-gray-800 rounded-full px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setBeds(Math.max(0, beds - 1))}
                    disabled={beds === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#006611] disabled:opacity-30 transition-colors"
                  >
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-8 text-center text-gray-900 dark:text-white">
                    {beds === 0 ? "Any" : `${beds}+`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBeds(beds + 1)}
                    className="w-8 h-8 rounded-full bg-[#006611] shadow-sm flex items-center justify-center text-white hover:bg-[#005510] transition-colors"
                  >
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>

              {/* Baths */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Bathrooms
                </span>
                <div className="flex items-center gap-2 bg-[#f5f8f6] dark:bg-gray-800 rounded-full px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setBaths(Math.max(0, baths - 1))}
                    disabled={baths === 0}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#006611] disabled:opacity-30 transition-colors"
                  >
                    <span className="material-icons text-base">remove</span>
                  </button>
                  <span className="text-sm font-semibold w-8 text-center text-gray-900 dark:text-white">
                    {baths === 0 ? "Any" : `${baths}+`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBaths(baths + 1)}
                    className="w-8 h-8 rounded-full bg-[#006611] shadow-sm flex items-center justify-center text-white hover:bg-[#005510] transition-colors"
                  >
                    <span className="material-icons text-base">add</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Amenities */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Amenities &amp; Features
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-[#006611] bg-[#006611]/5 dark:bg-[#006611]/20 text-[#006611] font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-[#006611]/10 peer-checked:border-[#006611] peer-checked:text-[#006611] hover:bg-[#006611]/10">
                  <span className="material-icons text-lg">pool</span>
                  Swimming Pool
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#006611] rounded-full" />
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-[#006611]">fitness_center</span>
                  Gym
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-[#006611]">local_parking</span>
                  Parking
                </div>
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-[#006611]">ac_unit</span>
                  Air Conditioning
                </div>
              </label>

              <label className="cursor-pointer group relative">
                <input defaultChecked className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-[#006611] bg-[#006611]/5 dark:bg-[#006611]/20 text-[#006611] font-medium text-sm flex items-center justify-center gap-2 transition-all peer-checked:bg-[#006611]/10 peer-checked:border-[#006611] peer-checked:text-[#006611] hover:bg-[#006611]/10">
                  <span className="material-icons text-lg">wifi</span>
                  High-speed Wifi
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#006611] rounded-full" />
              </label>

              <label className="cursor-pointer group">
                <input className="peer sr-only" type="checkbox" />
                <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 peer-checked:border-[#006611] peer-checked:bg-[#006611]/5 peer-checked:text-[#006611]">
                  <span className="material-icons text-lg text-gray-400 peer-checked:text-[#006611]">deck</span>
                  Patio / Terrace
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors underline decoration-gray-300 underline-offset-4"
          >
            Clear all filters
          </button>
          <button
            type="submit"
            className="bg-[#006611] hover:bg-[#005510] text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-[#006611]/30 transition-all hover:shadow-[#006611]/40 flex items-center gap-2 active:scale-95"
          >
            Show Properties
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
