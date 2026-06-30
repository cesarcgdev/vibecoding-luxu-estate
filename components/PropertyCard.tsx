import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "../lib/properties";

interface Props {
  property: Property;
  className?: string;
}

export default function PropertyCard({ property, className = "" }: Props) {
  const tagBgClass =
    property.tag === "FOR RENT" ? "bg-mosque/90" : "bg-nordic-dark/90";

  return (
    <Link href={`/properties/${property.slug || property.id}`} className={`block bg-white rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer h-full flex flex-col ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          alt={property.title}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          src={property.images?.[0] ?? ''}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-mosque hover:text-white transition-colors text-nordic-dark z-10">
          <span className="material-icons text-lg">favorite_border</span>
        </button>
        {property.tag && (
          <div className={`absolute bottom-3 left-3 ${tagBgClass} text-white text-xs font-bold px-2 py-1 rounded`}>
            {property.tag}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-lg text-nordic-dark">
            {property.price_display}
            {property.tag === "FOR RENT" && <span className="text-sm font-normal text-nordic-muted">/mo</span>}
          </h3>
        </div>
        <h4 className="text-nordic-dark font-medium truncate mb-1">
          {property.title}
        </h4>
        <p className="text-nordic-muted text-xs mb-4">{property.location}</p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">king_bed</span> {property.beds}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">bathtub</span> {property.baths}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">square_foot</span> {property.area}
          </div>
        </div>
      </div>
    </Link>
  );
}
