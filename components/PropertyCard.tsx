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
import SaveButton from "./SaveButton";

interface Props {
  property: Property;
  className?: string;
  initialSaved?: boolean;
  onUnsaved?: () => void;
}

export default function PropertyCard({
  property,
  className = "",
  initialSaved = false,
  onUnsaved,
}: Props) {
  const { dictionary } = useLanguage();
  const isRental = property.listing_type === "rent";

  /**
   * Rent and sale get their own accent. Everything that signals the operation —
   * the chip, the price, the hover ring — uses the same colour, so the two read
   * as different things at a glance rather than as one grid of similar cards.
   */
  const accent = isRental
    ? {
        chip: "bg-mosque text-white dark:bg-hint-green dark:text-nordic-dark",
        price: "text-mosque dark:text-hint-green",
        ring: "hover:border-mosque/40 dark:hover:border-hint-green/50",
      }
    : {
        chip: "bg-nordic-dark text-white dark:bg-white dark:text-nordic-dark",
        price: "text-nordic-dark dark:text-white",
        ring: "hover:border-nordic-dark/30 dark:hover:border-white/30",
      };

  const operation = isRental
    ? dictionary.tags["FOR RENT"]
    : dictionary.tags["FOR SALE"];

  // A sale's own tag ("Exclusive", "New Arrival") is worth keeping as secondary
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

  // A lock-up or a shop has no bedrooms to count
  const hidesRooms = isRental && isSpaceOnly(property.rental_kind);

  return (
    <Link
      href={`/properties/${property.slug || property.id}`}
      className={`block bg-white dark:bg-[#152e2a] rounded-xl overflow-hidden shadow-card dark:shadow-none border border-transparent dark:border-white/10 hover:shadow-soft transition-all duration-300 group cursor-pointer h-full flex flex-col ${accent.ring} ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          alt={property.title}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={property.images?.[0] ?? ""}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <SaveButton
          propertyId={property.id}
          initialSaved={initialSaved}
          onUnsaved={onUnsaved}
          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-nordic-dark/70 rounded-full hover:bg-mosque dark:hover:bg-hint-green hover:text-white dark:hover:text-nordic-dark transition-colors text-nordic-dark dark:text-white z-10"
        />

        {/* Operation first, modality second — what it is, then what kind */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`${accent.chip} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors`}
          >
            {operation}
          </span>
          {secondary && (
            <span className="flex items-center gap-1 bg-white/90 dark:bg-nordic-dark/80 text-nordic-dark dark:text-white text-[10px] font-semibold px-2 py-1 rounded backdrop-blur-sm transition-colors">
              <span className="material-icons text-[12px]">{secondary.icon}</span>
              {secondary.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className={`font-bold text-lg ${accent.price} transition-colors`}>
            {amount}
            {unit && (
              <span className="text-sm font-normal text-nordic-muted dark:text-gray-400 ml-0.5">
                {unit}
              </span>
            )}
          </h3>
        </div>
        <h4 className="text-nordic-dark dark:text-white font-medium truncate mb-1 transition-colors">
          {property.title}
        </h4>
        <p className="text-nordic-muted dark:text-gray-400 text-xs mb-4 transition-colors">
          {property.location}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 transition-colors">
          {!hidesRooms && (
            <>
              <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
                <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">king_bed</span>{" "}
                {property.beds} {dictionary.property.beds}
              </div>
              <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
                <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">bathtub</span>{" "}
                {property.baths} {dictionary.property.baths}
              </div>
            </>
          )}
          <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
            <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">square_foot</span>{" "}
            {property.area}
          </div>
          {/* A rental's commitment is the figure a tenant compares next */}
          {isRental && property.min_stay_months && (
            <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
              <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">schedule</span>{" "}
              {property.min_stay_months}m
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
