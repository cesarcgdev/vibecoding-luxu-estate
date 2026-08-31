"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "../lib/properties";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  isSpaceOnly,
  rentalKindIcon,
  rentalKindLabel,
  splitPriceDisplay,
} from "@/lib/rental-kinds";

interface Props {
  property: Property;
}

export default function FeaturedPropertyCard({ property }: Props) {
  const { dictionary } = useLanguage();
  const isRental = property.listing_type === "rent";

  // Same accent system as PropertyCard, so a rental reads the same either way
  const accent = isRental
    ? "bg-mosque text-white dark:bg-hint-green dark:text-nordic-dark"
    : "bg-nordic-dark text-white dark:bg-white dark:text-nordic-dark";

  const operation = isRental
    ? dictionary.tags["FOR RENT"]
    : dictionary.tags["FOR SALE"];

  const secondary =
    isRental && property.rental_kind
      ? {
          label: rentalKindLabel(property.rental_kind, dictionary),
          icon: rentalKindIcon(property.rental_kind),
        }
      : property.tag === "Exclusive" || property.tag === "New Arrival"
        ? { label: dictionary.tags[property.tag], icon: "star" }
        : null;

  const { amount, unit } = splitPriceDisplay(
    property.price_display,
    isRental ? property.price_period : null,
    dictionary
  );

  const hidesRooms = isRental && isSpaceOnly(property.rental_kind);

  return (
    <Link href={`/properties/${property.slug || property.id}`} className="block group relative rounded-xl overflow-hidden shadow-soft dark:shadow-none border border-transparent dark:border-white/10 bg-white dark:bg-[#152e2a] hover:shadow-lg dark:hover:border-hint-green/50 cursor-pointer transition-all duration-300">
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        <Image
          alt={property.title}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          src={property.images?.[0] ?? ''}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <span
            className={`${accent} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors`}
          >
            {operation}
          </span>
          {secondary && (
            <span className="flex items-center gap-1 bg-white/90 dark:bg-[#1a3833]/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-nordic-dark dark:text-white transition-colors">
              <span className="material-icons text-[14px]">{secondary.icon}</span>
              {secondary.label}
            </span>
          )}
        </div>
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-[#1a3833]/90 backdrop-blur-sm flex items-center justify-center text-nordic-dark dark:text-white hover:bg-mosque dark:hover:bg-hint-green hover:text-white dark:hover:text-nordic-dark transition-all z-10">
          <span className="material-icons text-xl">favorite_border</span>
        </button>
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 dark:from-[#0f231f]/80 to-transparent opacity-60"></div>
      </div>
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-medium text-nordic-dark dark:text-white group-hover:text-mosque dark:group-hover:text-hint-green transition-colors">
              {property.title}
            </h3>
            <p className="text-nordic-muted dark:text-gray-400 text-sm flex items-center gap-1 mt-1 transition-colors">
              <span className="material-icons text-sm">place</span> {property.location}
            </p>
          </div>
          <span
            className={`text-xl font-semibold whitespace-nowrap transition-colors ${
              isRental
                ? "text-mosque dark:text-hint-green"
                : "text-nordic-dark dark:text-white"
            }`}
          >
            {amount}
            {unit && (
              <span className="text-sm font-normal text-nordic-muted dark:text-gray-400 ml-0.5">
                {unit}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-nordic-dark/5 dark:border-white/10 transition-colors">
          {!hidesRooms && (
            <>
              <div className="flex items-center gap-2 text-nordic-muted dark:text-gray-400 text-sm transition-colors">
                <span className="material-icons text-lg">king_bed</span> {property.beds} {dictionary.property.beds}
              </div>
              <div className="flex items-center gap-2 text-nordic-muted dark:text-gray-400 text-sm transition-colors">
                <span className="material-icons text-lg">bathtub</span> {property.baths} {dictionary.property.baths}
              </div>
            </>
          )}
          <div className="flex items-center gap-2 text-nordic-muted dark:text-gray-400 text-sm transition-colors">
            <span className="material-icons text-lg">square_foot</span> {property.area}
          </div>
        </div>
      </div>
    </Link>
  );
}
