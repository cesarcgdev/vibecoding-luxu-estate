"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">
      <span className="material-icons text-mosque/40 text-4xl">map</span>
    </div>
  ),
});

export default function MapWrapper({
  location,
  latitude,
  longitude,
}: {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return <Map location={location} latitude={latitude} longitude={longitude} />;
}
