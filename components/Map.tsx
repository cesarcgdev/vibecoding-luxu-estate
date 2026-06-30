"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in leaflet with Next.js/Webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface MapProps {
  location: string;
}

// Since we only have a location string and no geocoding yet, we default to Palo Alto.
const DEFAULT_COORDS: [number, number] = [37.4419, -122.1430];

export default function Map({ location }: MapProps) {
  return (
    <MapContainer
      center={DEFAULT_COORDS}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={DEFAULT_COORDS} icon={icon}>
        <Popup>{location}</Popup>
      </Marker>
    </MapContainer>
  );
}
