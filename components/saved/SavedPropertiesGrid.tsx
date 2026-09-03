"use client";

import React, { useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import type { Property } from "@/lib/properties";

interface Props {
  properties: Property[];
}

/** Holds the fetched page of saved properties locally so unsaving one removes
 * it from the grid immediately, without a full page navigation. */
export default function SavedPropertiesGrid({ properties }: Props) {
  const [items, setItems] = useState(properties);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          initialSaved
          onUnsaved={() =>
            setItems((current) => current.filter((item) => item.id !== property.id))
          }
        />
      ))}
    </div>
  );
}
