"use client";

import dynamic from "next/dynamic";
import type { LocationPickerMapProps } from "./LocationPickerMap";

// Leaflet touches `window` on import, so the picker is client-only
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">
      <span className="material-icons text-mosque/40 text-3xl">map</span>
    </div>
  ),
});

/**
 * Interactive map for the admin property form. Renders whether or not the
 * property has coordinates yet: with none it opens on a default view and a
 * click drops the marker, with some it centers on them and the marker can be
 * dragged.
 */
export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
      <LocationPickerMap
        latitude={latitude}
        longitude={longitude}
        onChange={onChange}
      />
      <div className="absolute bottom-2 left-2 right-2 z-[1000] pointer-events-none">
        <p className="inline-flex items-center gap-1.5 bg-white/90 text-nordic text-[11px] font-medium font-sf-pro px-2.5 py-1 rounded shadow-sm">
          <span className="material-icons text-sm text-mosque">
            {hasCoordinates ? "open_with" : "touch_app"}
          </span>
          {hasCoordinates
            ? "Drag the marker or click the map to adjust"
            : "Click the map to set the property location"}
        </p>
      </div>
    </div>
  );
}
