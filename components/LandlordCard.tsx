"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { PublicLandlord } from "@/lib/landlords";
import {
  revealLandlordContact,
  type LandlordContact,
} from "@/app/actions/landlords";

/**
 * The landlord block on a property page.
 *
 * Everything rendered on load comes from the `landlords_public` view, which
 * does not contain the phone number or the email. Those arrive only when the
 * visitor asks for them, one landlord at a time — so the page source never
 * carries a contact detail, and there is no request that returns the whole
 * address book.
 */
export default function LandlordCard({
  landlord,
}: {
  landlord: PublicLandlord;
}) {
  const { dictionary } = useLanguage();
  const [contact, setContact] = useState<LandlordContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    setLoading(true);
    setError(null);
    const result = await revealLandlordContact(landlord.id);
    setLoading(false);

    if (result.success) setContact(result.contact);
    else setError(result.error);
  };

  const role =
    landlord.kind === "agency" ? dictionary.rent.agency : dictionary.rent.landlord;

  return (
    <div className="bg-white dark:bg-[#152e2a] p-6 rounded-xl shadow-sm border border-mosque/5 dark:border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-mosque/10 flex items-center justify-center border-2 border-white dark:border-white/10 shadow-sm overflow-hidden text-mosque dark:text-hint-green relative shrink-0">
          {landlord.avatar_url ? (
            <Image
              alt={landlord.display_name}
              src={landlord.avatar_url}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span className="material-icons text-2xl">
              {landlord.kind === "agency" ? "apartment" : "person"}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-nordic-dark dark:text-white truncate">
            {landlord.display_name}
          </h3>
          <p className="text-xs text-nordic-muted dark:text-gray-400">{role}</p>
          {landlord.is_verified && (
            <div className="flex items-center gap-1 text-xs text-mosque dark:text-hint-green font-medium mt-0.5">
              <span className="material-icons text-[14px]">verified</span>
              <span>{dictionary.rent.verified}</span>
            </div>
          )}
        </div>
      </div>

      {landlord.bio && (
        <p className="mt-4 text-sm text-nordic-muted dark:text-gray-400 leading-relaxed">
          {landlord.bio}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-nordic-muted dark:text-gray-400">
        {landlord.member_since && (
          <span className="flex items-center gap-1">
            <span className="material-icons text-[14px]">event</span>
            {dictionary.rent.memberSince.replace(
              "{year}",
              landlord.member_since.slice(0, 4)
            )}
          </span>
        )}
        {landlord.response_time_hours !== null && (
          <span className="flex items-center gap-1">
            <span className="material-icons text-[14px]">bolt</span>
            {dictionary.rent.respondsIn.replace(
              "{n}",
              String(landlord.response_time_hours)
            )}
          </span>
        )}
        {landlord.languages.length > 0 && (
          <span className="flex items-center gap-1 uppercase">
            <span className="material-icons text-[14px]">translate</span>
            {landlord.languages.join(" · ")}
          </span>
        )}
      </div>

      <div className="mt-5">
        {contact ? (
          <div className="space-y-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-sm font-medium text-mosque dark:text-hint-green hover:underline"
              >
                <span className="material-icons text-base">call</span>
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-sm font-medium text-mosque dark:text-hint-green hover:underline break-all"
              >
                <span className="material-icons text-base">mail_outline</span>
                {contact.email}
              </a>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleReveal}
            disabled={loading}
            className="w-full bg-mosque dark:bg-hint-green hover:bg-mosque/90 dark:hover:bg-hint-green/90 text-white dark:text-nordic-dark py-3 px-6 rounded-lg font-medium transition-all shadow-lg shadow-mosque/20 dark:shadow-hint-green/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span className="material-icons text-lg">
              {loading ? "hourglass_empty" : "visibility"}
            </span>
            {loading ? dictionary.rent.loadingContact : dictionary.rent.showContact}
          </button>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">
            {dictionary.rent.contactError} {error}
          </p>
        )}
      </div>
    </div>
  );
}
