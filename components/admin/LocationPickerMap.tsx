"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcon } from "../marker-icon";
import {
  DEFAULT_MAP_CENTER,
  FALLBACK_ZOOM,
  PROPERTY_ZOOM,
  roundCoordinate,
} from "@/lib/geo";

export interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

/** Sets the coordinates wherever the admin clicks on the map */
function ClickToPlace({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(
        roundCoordinate(event.latlng.lat),
        roundCoordinate(event.latlng.lng)
      );
    },
  });
  return null;
}

/**
 * Follows coordinates that changed outside the map (the latitude/longitude
 * inputs). Panning back after a click or a drag would fight the user, so moves
 * the map only made itself are skipped.
 */
function FollowCoordinates({
  position,
  selfMovedTo,
}: {
  position: [number, number] | null;
  selfMovedTo: React.RefObject<string | null>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const key = position.join(",");
    if (selfMovedTo.current === key) return;

    map.setView(position, Math.max(map.getZoom(), PROPERTY_ZOOM));
  }, [map, position, selfMovedTo]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const position = useMemo<[number, number] | null>(
    () => (latitude !== null && longitude !== null ? [latitude, longitude] : null),
    [latitude, longitude]
  );

  // Coordinates the map itself produced, so FollowCoordinates can ignore them
  const selfMovedTo = useRef<string | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const handleMapChange = (nextLat: number, nextLng: number) => {
    selfMovedTo.current = `${nextLat},${nextLng}`;
    onChange(nextLat, nextLng);
  };

  // The card the map lives in can be laid out after the map mounts, which
  // leaves Leaflet with stale tile bounds until it re-measures.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <MapContainer
      ref={mapRef}
      center={position ?? DEFAULT_MAP_CENTER}
      zoom={position ? PROPERTY_ZOOM : FALLBACK_ZOOM}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={handleMapChange} />
      <FollowCoordinates position={position} selfMovedTo={selfMovedTo} />
      {position && (
        <Marker
          position={position}
          icon={markerIcon}
          draggable
          ref={markerRef}
          eventHandlers={{
            dragend() {
              const latLng = markerRef.current?.getLatLng();
              if (!latLng) return;
              handleMapChange(
                roundCoordinate(latLng.lat),
                roundCoordinate(latLng.lng)
              );
            },
          }}
        />
      )}
    </MapContainer>
  );
}
