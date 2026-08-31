import React from "react";
import type { Property } from "../lib/properties";
import type { Dictionary } from "../lib/i18n/dictionaries";
import { entryCost } from "../lib/rentals";
import { rentalKindIcon, rentalKindLabel } from "../lib/rental-kinds";

function money(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Row {
  icon: string;
  label: string;
  value: string;
}

/**
 * The rental counterpart of the mortgage estimate shown on a sale.
 *
 * A tenant's decision hangs on the move-in cost — first period plus deposit —
 * far more than on the headline rent, so that number gets the emphasis a
 * mortgage button gets on the sales side.
 */
export default function RentalConditions({
  property,
  dictionary,
  locale,
}: {
  property: Property;
  dictionary: Dictionary;
  locale: string;
}) {
  const rows: Row[] = [];

  if (property.rental_kind) {
    rows.push({
      icon: rentalKindIcon(property.rental_kind),
      label: dictionary.rent.modality,
      value: rentalKindLabel(property.rental_kind, dictionary),
    });
  }

  if (property.min_stay_months) {
    rows.push({
      icon: "schedule",
      label: dictionary.rent.minStay,
      value: dictionary.rent.minStayValue.replace(
        "{n}",
        String(property.min_stay_months)
      ),
    });
  }

  rows.push({
    icon: "savings",
    label: dictionary.rent.deposit,
    value: property.deposit_months
      ? dictionary.rent.depositValue.replace(
          "{n}",
          String(property.deposit_months)
        )
      : dictionary.rent.depositNone,
  });

  rows.push({
    icon: "bolt",
    label: dictionary.rent.utilities,
    value: property.utilities_included
      ? dictionary.rent.utilitiesIncluded
      : dictionary.rent.utilitiesExcluded,
  });

  rows.push({
    icon: "chair",
    label: dictionary.rent.furnished,
    value: property.furnished
      ? dictionary.rent.furnishedYes
      : dictionary.rent.furnishedNo,
  });

  if (property.available_from) {
    // A date already in the past reads better as "now" than as an old date
    const isPast = new Date(property.available_from) <= new Date();
    rows.push({
      icon: "event_available",
      label: dictionary.rent.availableFrom,
      value: isPast
        ? dictionary.rent.availableNow
        : formatDate(property.available_from, locale),
    });
  }

  const moveIn = entryCost(property);

  return (
    <div className="bg-mosque/5 dark:bg-hint-green/5 p-6 rounded-xl border border-mosque/10 dark:border-hint-green/10">
      <h3 className="font-semibold text-nordic-dark dark:text-white mb-5">
        {dictionary.rent.conditions}
      </h3>

      <dl className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt className="flex items-center gap-2 text-nordic-muted dark:text-gray-400">
              <span className="material-icons text-base text-mosque dark:text-hint-green">
                {row.icon}
              </span>
              {row.label}
            </dt>
            <dd className="font-medium text-nordic-dark dark:text-white text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {moveIn !== null && property.price_value !== null && (
        <div className="mt-5 pt-5 border-t border-mosque/10 dark:border-hint-green/10">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-nordic-dark dark:text-white">
              {dictionary.rent.moveInCost}
            </span>
            <span className="text-2xl font-semibold text-mosque dark:text-hint-green">
              {money(moveIn)}
            </span>
          </div>
          <p className="mt-1 text-xs text-nordic-muted dark:text-gray-400">
            {dictionary.rent.moveInBreakdown
              .replace("{rent}", money(property.price_value!))
              .replace(
                "{deposit}",
                money(property.price_value! * (property.deposit_months ?? 0))
              )}
          </p>
        </div>
      )}
    </div>
  );
}
