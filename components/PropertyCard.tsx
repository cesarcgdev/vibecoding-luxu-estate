"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "../lib/properties";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  property: Property;
  className?: string;
}

export default function PropertyCard({ property, className = "" }: Props) {
  const { dictionary } = useLanguage();
  const tagBgClass =
    property.tag === "FOR RENT" ? "bg-mosque/90 dark:bg-hint-green/90 dark:text-nordic-dark" : "bg-nordic-dark/90 dark:bg-white/90 dark:text-nordic-dark";

  return (
    <Link href={`/properties/${property.slug || property.id}`} className={`block bg-white dark:bg-[#152e2a] rounded-xl overflow-hidden shadow-card dark:shadow-none border border-transparent dark:border-white/10 hover:shadow-soft dark:hover:border-hint-green/50 transition-all duration-300 group cursor-pointer h-full flex flex-col ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          alt={property.title}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={property.images?.[0] ?? ''}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-nordic-dark/70 rounded-full hover:bg-mosque dark:hover:bg-hint-green hover:text-white dark:hover:text-nordic-dark transition-colors text-nordic-dark dark:text-white z-10">
          <span className="material-icons text-lg">favorite_border</span>
        </button>
        {property.tag && (
          <div className={`absolute bottom-3 left-3 ${tagBgClass} text-white text-xs font-bold px-2 py-1 rounded transition-colors`}>
            {property.tag}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-lg text-nordic-dark dark:text-white transition-colors">
            {property.price_display}
            {property.tag === "FOR RENT" && <span className="text-sm font-normal text-nordic-muted dark:text-gray-400">/mo</span>}
          </h3>
        </div>
        <h4 className="text-nordic-dark dark:text-white font-medium truncate mb-1 transition-colors">
          {property.title}
        </h4>
        <p className="text-nordic-muted dark:text-gray-400 text-xs mb-4 transition-colors">{property.location}</p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 transition-colors">
          <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
            <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">king_bed</span> {property.beds} {dictionary.property.beds}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
            <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">bathtub</span> {property.baths} {dictionary.property.baths}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted dark:text-gray-400 text-xs">
            <span className="material-icons text-sm text-mosque/80 dark:text-hint-green/80">square_foot</span> {property.area}
          </div>
        </div>
      </div>
    </Link>
  );
}
