"use client";

import { useState } from "react";
import type { Property } from "../lib/properties";
import type { Dictionary } from "../lib/i18n/dictionaries";

export default function PropertyAbout({
  property,
  dictionary,
}: {
  property: Property;
  dictionary: Dictionary;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-[#152e2a] p-8 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10 transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-nordic-dark dark:text-white">{dictionary.property.about}</h2>
      <div className="prose prose-slate dark:prose-invert max-w-none text-nordic-muted dark:text-gray-400 leading-relaxed">
        <p className="mb-4">
          {dictionary.property.aboutDesc.replace("{title}", property.title).replace("{location}", property.location)}
        </p>
        {/* This used to interpolate listing_type, so a rental read
            "this rent offers spacious interiors" */}
        <p className={isExpanded ? "mb-4" : ""}>
          {dictionary.property.aboutDesc2.replace("{type}", property.property_type?.toLowerCase() || dictionary.property.home)}
        </p>
        {isExpanded && (
          <>
            <p className="mb-4">
              {dictionary.property.aboutDesc3.replace("{location}", property.location)}
            </p>
            <p>
              {dictionary.property.aboutDesc4
                .replace("{beds}", String(property.beds))
                .replace("{baths}", String(property.baths))
                .replace("{area}", property.area)}
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-4 text-mosque dark:text-hint-green font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
      >
        {isExpanded ? dictionary.property.readLess : dictionary.property.readMore}
        <span className="material-icons text-sm">{isExpanded ? "expand_less" : "arrow_forward"}</span>
      </button>
    </div>
  );
}
