"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcon } from "./marker-icon";
import { DEFAULT_MAP_CENTER, FALLBACK_ZOOM, PROPERTY_ZOOM } from "@/lib/geo";

interface MapProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function Map({ location, latitude, longitude }: MapProps) {
  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  // Listings saved before the map picker existed still have to render a map
  const center: [number, number] = hasCoordinates
    ? [latitude, longitude]
    : DEFAULT_MAP_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={hasCoordinates ? PROPERTY_ZOOM : FALLBACK_ZOOM}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasCoordinates && (
        <Marker position={center} icon={markerIcon}>
          <Popup>{location}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
