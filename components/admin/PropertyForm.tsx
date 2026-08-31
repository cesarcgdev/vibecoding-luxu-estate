"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createProperty,
  updateProperty,
  uploadPropertyImage,
  deletePropertyImage,
  type PropertyFormData,
} from "@/app/actions/properties";
import LocationPicker from "./LocationPicker";
import {
  coordinateToInput,
  isValidLatitude,
  isValidLongitude,
  parseCoordinate,
} from "@/lib/geo";
import { RENTAL_KINDS, pricePeriodFor, type RentalKind } from "@/lib/rental-kinds";
import type { PublicLandlord } from "@/lib/landlords";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

interface ImageItem {
  /** Unique id in the UI (not DB id) */
  key: string;
  /** Preview src — either an object URL (new) or a Supabase URL (existing) */
  src: string;
  /** The raw File — only present for new (not-yet-uploaded) images */
  file?: File;
  /** Whether the image already exists in Supabase Storage */
  isExisting: boolean;
  /** Whether the image is marked for deletion */
  markedForDelete: boolean;
}

interface PropertyFormProps {
  /** If provided the form is in edit mode */
  property?: Record<string, unknown> | null;
  /** Landlords available to assign. New profiles are added in Supabase. */
  landlords?: PublicLandlord[];
}

/** Human-readable labels for the modality select */
const RENTAL_KIND_LABELS: Record<RentalKind, string> = {
  long: "Long term",
  seasonal: "Short term",
  student: "Students",
  room: "Room",
  coliving: "Coliving",
  vacation: "Holiday",
  corporate: "Corporate",
  rent_to_own: "Rent to own",
  commercial: "Commercial",
  storage: "Garage / Storage",
};

const AMENITY_OPTIONS = [
  "Swimming Pool",
  "Garden",
  "Air Conditioning",
  "Smart Home",
  "Gym",
  "Garage",
  "Security System",
  "Terrace",
];

const LISTING_TYPES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "sold", label: "Sold" },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial" },
  { value: "penthouse", label: "Penthouse" },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(value: number | null): string {
  if (!value) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ─────────────────────────────────────────────
   Stepper
───────────────────────────────────────────── */

function Stepper({
  label,
  icon,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  icon: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-nordic font-sf-pro flex items-center gap-2">
        <span className="material-icons text-gray-400 text-sm">{icon}</span>
        {label}
      </label>
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100"
        >
          -
        </button>
        <span className="w-10 text-center text-nordic text-sm font-medium font-sf-pro">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

export default function PropertyForm({
  property,
  landlords = [],
}: PropertyFormProps) {
  const isEdit = Boolean(property?.id);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Form state ─────────────────────── */
  const [title, setTitle] = useState((property?.title as string) ?? "");
  const [priceValue, setPriceValue] = useState<number | "">(
    (property?.price_value as number) ?? ""
  );
  const [listingType, setListingType] = useState(
    (property?.listing_type as string) ?? "sale"
  );
  const [propertyType, setPropertyType] = useState(
    (property?.property_type as string) ?? "apartment"
  );
  const [description, setDescription] = useState(
    (property?.description as string) ?? ""
  );
  const [location, setLocation] = useState(
    (property?.location as string) ?? ""
  );
  const [latitude, setLatitude] = useState(
    coordinateToInput(property?.latitude)
  );
  const [longitude, setLongitude] = useState(
    coordinateToInput(property?.longitude)
  );
  const [area, setArea] = useState((property?.area as string) ?? "");
  const [yearBuilt, setYearBuilt] = useState(
    (property?.year_built as string | number)?.toString() ?? ""
  );
  const [beds, setBeds] = useState((property?.beds as number) ?? 1);
  const [baths, setBaths] = useState((property?.baths as number) ?? 1);
  const [parking, setParking] = useState((property?.parking as number) ?? 0);
  const [isFeatured, setIsFeatured] = useState(
    (property?.is_featured as boolean) ?? false
  );
  // New listings and rows saved before the column existed are visible
  const [isActive, setIsActive] = useState(
    (property?.is_active as boolean) ?? true
  );
  const [slug, setSlug] = useState((property?.slug as string) ?? "");
  const [amenities, setAmenities] = useState<string[]>(
    (property?.amenities as string[]) ?? []
  );

  /* ── Rental state — written only when listingType is "rent" ── */
  const [rentalKind, setRentalKind] = useState<RentalKind>(
    (property?.rental_kind as RentalKind) ?? "long"
  );
  const [minStayMonths, setMinStayMonths] = useState(
    (property?.min_stay_months as number | null)?.toString() ?? ""
  );
  const [depositMonths, setDepositMonths] = useState(
    (property?.deposit_months as number | null)?.toString() ?? ""
  );
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(
    (property?.utilities_included as boolean) ?? false
  );
  const [furnished, setFurnished] = useState(
    (property?.furnished as boolean) ?? false
  );
  const [availableFrom, setAvailableFrom] = useState(
    (property?.available_from as string) ?? ""
  );
  const [landlordId, setLandlordId] = useState(
    (property?.landlord_id as string) ?? ""
  );

  const isRental = listingType === "rent";
  // The modality dictates the unit, so the two can never disagree
  const pricePeriod = pricePeriodFor(rentalKind);

  /* ── Image state ────────────────────── */
  const existingImages = (property?.images as string[]) ?? [];
  const [images, setImages] = useState<ImageItem[]>(
    existingImages.map((url, i) => ({
      key: `existing-${i}`,
      src: url,
      isExisting: true,
      markedForDelete: false,
    }))
  );

  /* ── Slug auto-generation ───────────── */
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEdit) setSlug(slugify(v));
  };

  /* ── Amenity toggle ─────────────────── */
  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  /* ── Coordinates ────────────────────── */
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  // A coordinate outside its range would put the marker nowhere real
  const mapLatitude =
    parsedLatitude !== null && isValidLatitude(parsedLatitude)
      ? parsedLatitude
      : null;
  const mapLongitude =
    parsedLongitude !== null && isValidLongitude(parsedLongitude)
      ? parsedLongitude
      : null;

  const handleMapPick = (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
  };

  /* ── Image handling ─────────────────── */
  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newItems: ImageItem[] = Array.from(files).map((file) => ({
        key: `new-${Date.now()}-${Math.random()}`,
        src: URL.createObjectURL(file),
        file,
        isExisting: false,
        markedForDelete: false,
      }));
      setImages((prev) => [...prev, ...newItems]);
    },
    []
  );

  const removeImage = (key: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.key === key
          ? { ...img, markedForDelete: true }
          : img
      )
    );
  };

  const activeImages = images.filter((img) => !img.markedForDelete);

  /* ── Submit ─────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Property title is required.");
      return;
    }
    if (!location.trim()) {
      setError("Address is required.");
      return;
    }
    if (latitude.trim() && mapLatitude === null) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (longitude.trim() && mapLongitude === null) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }
    if ((mapLatitude === null) !== (mapLongitude === null)) {
      setError("Set both latitude and longitude, or leave both empty.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Delete images marked for deletion from Supabase Storage
      const toDelete = images.filter(
        (img) => img.isExisting && img.markedForDelete
      );
      await Promise.all(toDelete.map((img) => deletePropertyImage(img.src)));

      // 2. Upload new images
      const uploadedUrls: string[] = [];
      const newImages = images.filter(
        (img) => !img.isExisting && !img.markedForDelete && img.file
      );

      for (const img of newImages) {
        const fd = new FormData();
        fd.append("file", img.file!);
        const result = await uploadPropertyImage(fd);
        if ("error" in result) {
          throw new Error(`Image upload failed: ${result.error}`);
        }
        uploadedUrls.push(result.url);
      }

      // 3. Combine remaining existing + new URLs
      const keepExisting = images
        .filter((img) => img.isExisting && !img.markedForDelete)
        .map((img) => img.src);
      const allImageUrls = [...keepExisting, ...uploadedUrls];

      // A rental price is meaningless without its unit, and price_display is
      // what every card renders verbatim
      const priceSuffix = isRental
        ? pricePeriod === "night"
          ? "/night"
          : "/mo"
        : "";

      const formData: PropertyFormData = {
        title: title.trim(),
        price_value: priceValue !== "" ? Number(priceValue) : null,
        price_display:
          priceValue !== ""
            ? `${formatPrice(Number(priceValue))}${priceSuffix}`
            : "Price on request",
        listing_type: listingType,
        property_type: propertyType,
        // The CHECK in migration 0004 rejects rental fields on a non-rental
        rental_kind: isRental ? rentalKind : null,
        price_period: isRental ? pricePeriod : null,
        min_stay_months: isRental && minStayMonths ? Number(minStayMonths) : null,
        deposit_months: isRental && depositMonths ? Number(depositMonths) : null,
        utilities_included: isRental ? utilitiesIncluded : null,
        furnished: isRental ? furnished : null,
        available_from: isRental && availableFrom ? availableFrom : null,
        landlord_id: landlordId || null,
        description: description.trim(),
        location: location.trim(),
        latitude: mapLatitude,
        longitude: mapLongitude,
        area: area.trim(),
        year_built: yearBuilt.trim(),
        beds,
        baths,
        parking,
        amenities,
        is_featured: isFeatured,
        is_active: isActive,
        slug: slug.trim() || slugify(title.trim()),
        existing_images: keepExisting,
      };

      setIsUploading(false);

      startTransition(async () => {
        const result = isEdit
          ? await updateProperty(property!.id as string, formData, allImageUrls)
          : await createProperty(formData, allImageUrls);

        // A successful save redirects, so anything returned here is a failure
        if (result && !result.success) {
          setError(result.error ?? "The property could not be saved.");
        }
      });
    } catch (err: unknown) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  const isLoading = isPending || isUploading;

  /* ─────────────────────────────────────
     Render
  ───────────────────────────────────── */
  return (
    <form
      id="property-form"
      onSubmit={handleSubmit}
      className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
    >
      {/* ── Left column ─────────────────── */}
      <div className="xl:col-span-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium font-sf-pro flex items-center gap-2">
            <span className="material-icons text-base">error_outline</span>
            {error}
          </div>
        )}

        {/* ── Basic Information ──────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">info</span>
            </div>
            <h2 className="text-xl font-bold text-nordic">Basic Information</h2>
          </div>
          <div className="p-8 space-y-6">
            {/* Title */}
            <div className="group">
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                htmlFor="prop-title"
              >
                Property Title <span className="text-red-500">*</span>
              </label>
              <input
                id="prop-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Modern Penthouse with Ocean View"
                className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro outline-none"
                required
              />
            </div>

            {/* Price / Status / Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                  htmlFor="prop-price"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-sf-pro text-sm">
                    $
                  </span>
                  <input
                    id="prop-price"
                    type="number"
                    value={priceValue}
                    onChange={(e) =>
                      setPriceValue(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-medium font-sf-pro outline-none"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                  htmlFor="prop-status"
                >
                  Status
                </label>
                <select
                  id="prop-status"
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sf-pro cursor-pointer outline-none"
                >
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                  htmlFor="prop-type"
                >
                  Property Type
                </label>
                <select
                  id="prop-type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sf-pro cursor-pointer outline-none"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Landlord — the only way to attach a profile to a listing */}
            <div>
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                htmlFor="prop-landlord"
              >
                Landlord
              </label>
              <select
                id="prop-landlord"
                value={landlordId}
                onChange={(e) => setLandlordId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sf-pro cursor-pointer outline-none"
              >
                <option value="">No landlord</option>
                {landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id}>
                    {landlord.display_name}
                    {landlord.kind === "agency" ? " (agency)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1 font-sf-pro">
                {landlords.length === 0
                  ? "No landlords yet — add rows to the landlords table in Supabase, or run npm run seed:rentals."
                  : "Shown on the public listing page, with contact details revealed on request."}
              </p>
            </div>

            {/* Rental terms — only when the listing is a rental */}
            {isRental && (
              <div className="rounded-lg border border-mosque/20 bg-mosque/5 p-5 space-y-5">
                <h3 className="text-sm font-semibold text-nordic font-sf-pro">
                  Rental terms
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                      htmlFor="prop-rental-kind"
                    >
                      Modality <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="prop-rental-kind"
                      value={rentalKind}
                      onChange={(e) => setRentalKind(e.target.value as RentalKind)}
                      className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sf-pro cursor-pointer outline-none"
                    >
                      {RENTAL_KINDS.map((definition) => (
                        <option key={definition.value} value={definition.value}>
                          {RENTAL_KIND_LABELS[definition.value]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1 font-sf-pro">
                      Sets the price unit: this listing is priced per{" "}
                      {pricePeriod === "night" ? "night" : "month"}.
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                      htmlFor="prop-available-from"
                    >
                      Available from
                    </label>
                    <input
                      id="prop-available-from"
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro outline-none"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                      htmlFor="prop-min-stay"
                    >
                      Minimum stay (months)
                    </label>
                    <input
                      id="prop-min-stay"
                      type="number"
                      min={0}
                      value={minStayMonths}
                      onChange={(e) => setMinStayMonths(e.target.value)}
                      placeholder="12"
                      className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro outline-none"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                      htmlFor="prop-deposit"
                    >
                      Deposit (months of rent)
                    </label>
                    <input
                      id="prop-deposit"
                      type="number"
                      min={0}
                      step={0.5}
                      value={depositMonths}
                      onChange={(e) => setDepositMonths(e.target.value)}
                      placeholder="2"
                      className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-nordic font-sf-pro cursor-pointer">
                    <input
                      type="checkbox"
                      checked={furnished}
                      onChange={(e) => setFurnished(e.target.checked)}
                      className="w-4 h-4 accent-mosque"
                    />
                    Furnished
                  </label>
                  <label className="flex items-center gap-2 text-sm text-nordic font-sf-pro cursor-pointer">
                    <input
                      type="checkbox"
                      checked={utilitiesIncluded}
                      onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                      className="w-4 h-4 accent-mosque"
                    />
                    Bills included
                  </label>
                </div>
              </div>
            )}

            {/* Slug */}
            <div>
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                htmlFor="prop-slug"
              >
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                id="prop-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro outline-none"
              />
              <p className="text-xs text-gray-400 mt-1 font-sf-pro">
                Used in the property URL. Auto-generated from the title.
              </p>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-hint-green/20 border border-hint-green/40">
              <div>
                <p className="text-sm font-medium text-nordic font-sf-pro">
                  Featured Property
                </p>
                <p className="text-xs text-gray-500 font-sf-pro">
                  Featured listings appear in the hero section on the homepage.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFeatured}
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mosque focus:ring-offset-2 ${
                  isFeatured ? "bg-mosque" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isFeatured ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-hint-green/20 border border-hint-green/40">
              <div>
                <p className="text-sm font-medium text-nordic font-sf-pro">
                  Visible on Site
                </p>
                <p className="text-xs text-gray-500 font-sf-pro">
                  Hidden properties stay in the database but never appear in
                  search or on the homepage.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mosque focus:ring-offset-2 ${
                  isActive ? "bg-mosque" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── Description ───────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">description</span>
            </div>
            <h2 className="text-xl font-bold text-nordic">Description</h2>
          </div>
          <div className="p-8">
            <div className="mb-3 flex gap-2 border-b border-gray-100 pb-2">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
              >
                <span className="material-icons text-lg">format_bold</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
              >
                <span className="material-icons text-lg">format_italic</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
              >
                <span className="material-icons text-lg">format_list_bulleted</span>
              </button>
            </div>
            <textarea
              id="prop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Describe the property features, neighborhood, and unique selling points..."
              className="w-full px-4 py-3 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sf-pro leading-relaxed resize-y min-h-[200px] outline-none"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
            />
            <div className="mt-2 text-right text-xs text-gray-400 font-sf-pro">
              {description.length} / 2000 characters
            </div>
          </div>
        </div>

        {/* ── Gallery ───────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-green/30 flex justify-between items-center bg-gradient-to-r from-hint-green/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                <span className="material-icons text-lg">image</span>
              </div>
              <h2 className="text-xl font-bold text-nordic">Gallery</h2>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded font-sf-pro">
              JPG, PNG, WEBP
            </span>
          </div>
          <div className="p-8">
            {/* Dropzone */}
            <div
              className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 p-10 text-center hover:bg-hint-green/10 hover:border-mosque/40 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-mosque group-hover:scale-110 transition-transform duration-300">
                  <span className="material-icons text-2xl">cloud_upload</span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-nordic font-sf-pro">
                    Click or drag images here
                  </p>
                  <p className="text-xs text-gray-400 font-sf-pro">
                    Max file size 5 MB per image
                  </p>
                </div>
              </div>
            </div>

            {/* Preview grid */}
            {activeImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {activeImages.map((img, idx) => (
                  <div
                    key={img.key}
                    className="aspect-square rounded-lg overflow-hidden relative group shadow-sm"
                  >
                    <Image
                      src={img.src}
                      alt={`Property image ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={!img.isExisting}
                    />
                    <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => removeImage(img.key)}
                        className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                        title="Remove image"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-mosque text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm font-sf-pro uppercase tracking-wider">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right column ────────────────── */}
      <div className="xl:col-span-4 space-y-8">
        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">place</span>
            </div>
            <h2 className="text-lg font-bold text-nordic">Location</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                htmlFor="prop-location"
              >
                Address <span className="text-red-500">*</span>
              </label>
              <input
                id="prop-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Street Address, City, Zip"
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sf-pro outline-none"
                required
              />
            </div>
            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                  htmlFor="prop-latitude"
                >
                  Latitude
                </label>
                <input
                  id="prop-latitude"
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.4419"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sf-pro outline-none"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sf-pro"
                  htmlFor="prop-longitude"
                >
                  Longitude
                </label>
                <input
                  id="prop-longitude"
                  type="text"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-122.1430"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sf-pro outline-none"
                />
              </div>
            </div>

            {/* Interactive map */}
            <LocationPicker
              latitude={mapLatitude}
              longitude={mapLongitude}
              onChange={handleMapPick}
            />
            <p className="text-xs text-gray-400 font-sf-pro">
              Type the coordinates to move the marker, or click the map to fill
              them in.
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
          <div className="px-6 py-4 border-b border-hint-green/30 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">straighten</span>
            </div>
            <h2 className="text-lg font-bold text-nordic">Details</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Area & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label
                  className="text-xs text-gray-500 font-medium font-sf-pro mb-1 block"
                  htmlFor="prop-area"
                >
                  Area (m²)
                </label>
                <input
                  id="prop-area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="w-full text-left px-3 py-2 rounded border border-gray-200 bg-gray-50 text-nordic focus:bg-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro text-sm outline-none"
                />
              </div>
              <div className="group">
                <label
                  className="text-xs text-gray-500 font-medium font-sf-pro mb-1 block"
                  htmlFor="prop-year"
                >
                  Year Built
                </label>
                <input
                  id="prop-year"
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="YYYY"
                  min={1800}
                  max={new Date().getFullYear() + 2}
                  className="w-full text-left px-3 py-2 rounded border border-gray-200 bg-gray-50 text-nordic focus:bg-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sf-pro text-sm outline-none"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Steppers */}
            <div className="space-y-4">
              <Stepper
                label="Bedrooms"
                icon="bed"
                value={beds}
                onChange={setBeds}
                min={0}
                max={20}
              />
              <Stepper
                label="Bathrooms"
                icon="shower"
                value={baths}
                onChange={setBaths}
                min={0}
                max={20}
              />
              <Stepper
                label="Parking"
                icon="directions_car"
                value={parking}
                onChange={setParking}
                min={0}
                max={10}
              />
            </div>

            <hr className="border-gray-100" />

            {/* Amenities */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-3 font-sf-pro uppercase tracking-wider">
                Amenities
              </h3>
              <div className="space-y-2">
                {AMENITY_OPTIONS.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.includes(name)}
                      onChange={() => toggleAmenity(name)}
                      className="w-4 h-4 text-mosque border-gray-300 rounded focus:ring-mosque"
                    />
                    <span className="text-sm text-gray-700 font-sf-pro group-hover:text-nordic transition-colors">
                      {name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bar ───────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-xl md:hidden z-40 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/properties")}
          className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-nordic font-medium font-sf-pro"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg bg-mosque text-white font-medium font-sf-pro flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="material-icons text-base animate-spin">
                refresh
              </span>
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </form>
  );
}
