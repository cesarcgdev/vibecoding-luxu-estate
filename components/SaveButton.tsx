"use client";

import React, { useState, useTransition } from "react";
import { toggleSavedProperty } from "@/app/actions/saved-properties";
import { AUTH_GATE_EVENT } from "@/lib/auth-gate";
import { showToast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POP_MS = 400;

interface Props {
  propertyId: string;
  initialSaved: boolean;
  /** Called after a successful unsave — lets /saved drop the card from its grid */
  onUnsaved?: () => void;
  className?: string;
  iconClassName?: string;
  /** Icon color on hover — must contrast with this button's own hover background */
  iconHoverClassName?: string;
}

/** The heart button on PropertyCard / FeaturedPropertyCard / the property detail page */
export default function SaveButton({
  propertyId,
  initialSaved,
  onUnsaved,
  className = "",
  iconClassName = "text-lg",
  iconHoverClassName = "group-hover:text-white dark:group-hover:text-nordic-dark",
}: Props) {
  const { dictionary } = useLanguage();
  const [saved, setSaved] = useState(initialSaved);
  const [pop, setPop] = useState(false);
  const [, startTransition] = useTransition();

  // Mock/fallback listings (id like "mock-0") aren't real rows — nothing to save
  if (!UUID_RE.test(propertyId)) return null;

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const nextSaved = !saved;
    setSaved(nextSaved);

    if (nextSaved) {
      setPop(true);
      setTimeout(() => setPop(false), POP_MS);
    }

    startTransition(async () => {
      const result = await toggleSavedProperty(propertyId);

      if (!result.success) {
        setSaved(saved);
        if (result.error === "unauthenticated") {
          window.dispatchEvent(new Event(AUTH_GATE_EVENT));
        } else {
          console.error("Could not update saved property:", result.error);
          showToast(dictionary.saved.saveError, "error");
        }
        return;
      }

      showToast(result.saved ? dictionary.saved.savedToast : dictionary.saved.removedToast);
      if (!result.saved) onUnsaved?.();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Unsave property" : "Save property"}
      className={`group ${className}`}
    >
      {/* The hover background reuses the accent color (mosque/hint-green), which
          is also the saved-state icon color — without an explicit hover color
          here the filled heart turns invisible against its own hover fill. */}
      <span
        className={`material-icons ${iconClassName} ${saved ? "text-mosque dark:text-hint-green" : ""} ${iconHoverClassName} ${pop ? "animate-heart-pop" : ""}`}
      >
        {saved ? "favorite" : "favorite_border"}
      </span>
    </button>
  );
}
