/**
 * Seeds 40 rental listings and the 8 landlords that own them.
 *
 * Run with:   npm run seed:rentals
 * Undo with:  npm run seed:rentals -- --clean
 *
 * Two things this script does differently from scripts/seed-properties.js:
 *
 * 1. It uses the service-role key. Migration 0001 restricts writes on
 *    `properties` to authenticated admins, so the anon key is rejected.
 * 2. Its slugs are deterministic and it upserts on them, so running it twice
 *    leaves 40 rows rather than 80. The row *contents* are deterministic too —
 *    a seeded PRNG — so a second run is a genuine no-op instead of silently
 *    repricing every listing.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing credentials. This script needs NEXT_PUBLIC_SUPABASE_URL and\n" +
      "SUPABASE_SERVICE_ROLE_KEY in .env.local — the anon key cannot write to\n" +
      "`properties` because of the RLS policy in 0001_property_admin.sql."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ─────────────────────────────────────────────
   Deterministic randomness
───────────────────────────────────────────── */

/** mulberry32 — same seed, same listing, every run */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const intBetween = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, items) => items[Math.floor(rng() * items.length)];

/* ─────────────────────────────────────────────
   Reference data
───────────────────────────────────────────── */

// Neighborhood, city and coordinates travel together. The older seed drew the
// two halves independently and produced addresses like "Manhattan, Miami".
const ZONES = {
  sfDowntown:   { neighborhood: "Downtown",      city: "San Francisco", lat: 37.7897, lng: -122.4000 },
  beverlyHills: { neighborhood: "Beverly Hills", city: "Los Angeles",   lat: 34.0736, lng: -118.4004 },
  manhattan:    { neighborhood: "Manhattan",     city: "New York",      lat: 40.7831, lng:  -73.9712 },
  southBeach:   { neighborhood: "South Beach",   city: "Miami",         lat: 25.7826, lng:  -80.1341 },
  lincolnPark:  { neighborhood: "Lincoln Park",  city: "Chicago",       lat: 41.9214, lng:  -87.6513 },
  capitolHill:  { neighborhood: "Capitol Hill",  city: "Seattle",       lat: 47.6229, lng: -122.3212 },
  cherryCreek:  { neighborhood: "Cherry Creek",  city: "Denver",        lat: 39.7176, lng: -104.9539 },
  backBay:      { neighborhood: "Back Bay",      city: "Boston",        lat: 42.3503, lng:  -71.0810 },
  laJolla:      { neighborhood: "La Jolla",      city: "San Diego",     lat: 32.8328, lng: -117.2713 },
  austin:       { neighborhood: "Downtown",      city: "Austin",        lat: 30.2672, lng:  -97.7431 },
};

// Only hosts listed in next.config.ts remotePatterns load through next/image
const IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687931-570a59929ee5?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154526-990dced4ea0d?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&q=80",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1c24240f57?w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b4a4?w=800&q=80",
  "https://images.unsplash.com/photo-1508330527318-5a6433e146eb?w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
];

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
];

const LANDLORDS = [
  {
    slug: "maria-gomez", display_name: "María Gómez", kind: "individual",
    phone: "+1 415 555 0182", email_public: "maria.gomez@example.com",
    bio: "Owner of a small portfolio in the Bay Area. I answer every message myself.",
    languages: ["en", "es"], is_verified: true,
    member_since: "2019-04-01", response_time_hours: 2,
  },
  {
    slug: "daniel-okafor", display_name: "Daniel Okafor", kind: "individual",
    phone: "+1 212 555 0147", email_public: "daniel.okafor@example.com",
    bio: "I rent out the apartments I grew up around. Long stays preferred.",
    languages: ["en"], is_verified: true,
    member_since: "2021-09-15", response_time_hours: 6,
  },
  {
    slug: "aiko-tanaka", display_name: "Aiko Tanaka", kind: "individual",
    phone: "+1 206 555 0119", email_public: "aiko.tanaka@example.com",
    bio: "Furnished places for people moving to Seattle for a season.",
    languages: ["en", "ja"], is_verified: false,
    member_since: "2022-06-20", response_time_hours: 12,
  },
  {
    slug: "clara-lindqvist", display_name: "Clara Lindqvist", kind: "individual",
    phone: "+1 617 555 0164", email_public: "clara.lindqvist@example.com",
    bio: "Student housing near the Boston campuses. Academic-year contracts.",
    languages: ["en", "sv"], is_verified: true,
    member_since: "2018-08-30", response_time_hours: 4,
  },
  {
    slug: "tomas-ruiz", display_name: "Tomás Ruiz", kind: "individual",
    phone: "+1 305 555 0173", email_public: "tomas.ruiz@example.com",
    bio: "Holiday lets on the coast. Flexible check-in, cleaning included.",
    languages: ["en", "es", "pt"], is_verified: true,
    member_since: "2020-02-11", response_time_hours: 1,
  },
  {
    slug: "aurora-estates", display_name: "Aurora Estates", kind: "agency",
    phone: "+1 312 555 0100", email_public: "lettings@aurora-estates.example.com",
    bio: "Full-service letting agency operating across the Midwest since 2004.",
    languages: ["en", "es"], is_verified: true,
    member_since: "2016-01-05", response_time_hours: 3,
  },
  {
    slug: "northgate-living", display_name: "Northgate Living", kind: "agency",
    phone: "+1 303 555 0138", email_public: "hello@northgate-living.example.com",
    bio: "Managed rentals with on-site maintenance and 24/7 support.",
    languages: ["en"], is_verified: true,
    member_since: "2017-11-22", response_time_hours: 5,
  },
  {
    slug: "harbor-commercial", display_name: "Harbor Commercial", kind: "agency",
    phone: "+1 619 555 0155", email_public: "leasing@harbor-commercial.example.com",
    bio: "Retail units and offices. We handle the paperwork end to end.",
    languages: ["en", "es"], is_verified: false,
    member_since: "2015-03-18", response_time_hours: 8,
  },
];

const AMENITY_POOL = [
  "Swimming Pool", "Gym", "Parking", "Air Conditioning",
  "WiFi", "Patio", "Elevator", "Terrace", "Security System",
];

/**
 * One entry per modality. `count` sums to 40.
 *
 * `period` must match the modality's price unit — the CHECK constraint added in
 * 0004 rejects a rental with no period, and rent_monthly_eq multiplies nightly
 * prices by 30 to make them comparable with monthly ones.
 */
const PLAN = [
  {
    kind: "long", count: 12, period: "month", price: [1500, 4500],
    zones: ["lincolnPark", "austin", "cherryCreek", "sfDowntown", "manhattan"],
    types: ["Apartment", "House", "Townhouse"],
    adjectives: ["Bright", "Spacious", "Renovated", "Quiet"],
    beds: [1, 4], baths: [1, 3], area: [700, 2200],
    minStay: [12, 12], deposit: [1, 2], furnished: false, utilities: false,
  },
  {
    kind: "student", count: 8, period: "month", price: [600, 1400],
    zones: ["backBay", "capitolHill", "austin"],
    types: ["Apartment", "Studio"],
    adjectives: ["Campus", "Compact", "Furnished", "Shared"],
    beds: [1, 3], baths: [1, 2], area: [350, 950],
    minStay: [9, 10], deposit: [1, 1], furnished: true, utilities: true,
  },
  {
    kind: "seasonal", count: 7, period: "month", price: [1800, 5000],
    zones: ["cherryCreek", "laJolla", "capitolHill", "southBeach"],
    types: ["Apartment", "House", "Villa"],
    adjectives: ["Seasonal", "Furnished", "Corporate", "Serviced"],
    beds: [1, 4], baths: [1, 3], area: [600, 2000],
    minStay: [1, 6], deposit: [1, 1], furnished: true, utilities: true,
  },
  {
    kind: "room", count: 6, period: "month", price: [500, 1200],
    zones: ["manhattan", "sfDowntown", "lincolnPark"],
    types: ["Room", "Studio"],
    adjectives: ["Private", "Sunny", "Central", "Cosy"],
    beds: [1, 1], baths: [1, 1], area: [120, 280],
    minStay: [3, 6], deposit: [1, 1], furnished: true, utilities: true,
  },
  {
    kind: "vacation", count: 5, period: "night", price: [90, 450],
    zones: ["southBeach", "laJolla", "beverlyHills"],
    types: ["Villa", "Apartment", "Penthouse"],
    adjectives: ["Beachfront", "Oceanview", "Poolside", "Designer"],
    beds: [1, 5], baths: [1, 4], area: [700, 3200],
    minStay: null, deposit: null, furnished: true, utilities: true,
  },
  {
    kind: "commercial", count: 2, period: "month", price: [2000, 9000],
    zones: ["sfDowntown", "lincolnPark"],
    types: ["Commercial"],
    adjectives: ["Ground-floor", "Corner"],
    beds: [0, 0], baths: [1, 2], area: [800, 4000],
    minStay: [12, 24], deposit: [2, 3], furnished: false, utilities: false,
  },

  /* ── Added in the second pass, on the modalities from migration 0005 ── */

  {
    kind: "coliving", count: 6, period: "month", price: [900, 1900],
    zones: ["capitolHill", "austin", "lincolnPark", "sfDowntown"],
    types: ["Room", "Apartment"],
    adjectives: ["Managed", "All-inclusive", "Social", "Modern"],
    beds: [1, 1], baths: [1, 2], area: [140, 400],
    minStay: [3, 6], deposit: [1, 1], furnished: true, utilities: true,
  },
  {
    kind: "rent_to_own", count: 5, period: "month", price: [2200, 6000],
    zones: ["cherryCreek", "austin", "backBay"],
    types: ["House", "Townhouse", "Apartment"],
    adjectives: ["Family", "Detached", "Bright"],
    beds: [2, 5], baths: [1, 3], area: [900, 2600],
    minStay: [24, 36], deposit: [2, 3], furnished: false, utilities: false,
  },
  {
    kind: "storage", count: 5, period: "month", price: [90, 550],
    zones: ["lincolnPark", "manhattan", "laJolla"],
    types: ["Garage", "Storage Unit"],
    adjectives: ["Secure", "Drive-up", "Climate-controlled"],
    // Nobody sleeps or showers in a lock-up; the cards hide these figures
    beds: [0, 0], baths: [0, 0], area: [60, 400],
    minStay: [1, 3], deposit: [1, 1], furnished: false, utilities: true,
  },
  {
    kind: "corporate", count: 4, period: "month", price: [3000, 8500],
    zones: ["manhattan", "sfDowntown", "backBay"],
    types: ["Apartment", "Penthouse"],
    adjectives: ["Executive", "Serviced", "Central"],
    beds: [1, 3], baths: [1, 3], area: [650, 1800],
    minStay: [1, 12], deposit: [1, 2], furnished: true, utilities: true,
  },
];

/** Two listings get the /rent hero band */
const FEATURED_SLUGS = new Set(["rent-long-01", "rent-vacation-01"]);

/* ─────────────────────────────────────────────
   Row building
───────────────────────────────────────────── */

function money(value) {
  return `$${value.toLocaleString("en-US")}`;
}

function isoDate(monthOffset, day) {
  const date = new Date(Date.UTC(2026, 8 + monthOffset, day));
  return date.toISOString().slice(0, 10);
}

function buildRentals(landlordIdBySlug) {
  const rows = [];
  let globalIndex = 0;

  for (const group of PLAN) {
    for (let i = 0; i < group.count; i++) {
      // Seeded per listing, so this row is identical on every run
      const rng = makeRandom(0x9e3779b9 + globalIndex * 2654435761);
      const number = String(i + 1).padStart(2, "0");
      const slug = `rent-${group.kind}-${number}`;

      const zone = ZONES[group.zones[i % group.zones.length]];
      const type = pick(rng, group.types);
      const title = `${pick(rng, group.adjectives)} ${type} in ${zone.neighborhood}`;

      const priceValue = intBetween(rng, group.price[0], group.price[1]);
      const priceDisplay =
        group.period === "night"
          ? `${money(priceValue)}/night`
          : `${money(priceValue)}/mo`;

      const amenityCount = intBetween(rng, 2, 4);
      const amenities = [...AMENITY_POOL]
        .sort(() => rng() - 0.5)
        .slice(0, amenityCount);

      // Landlords are spread round-robin so every profile has a portfolio
      const landlordSlug = LANDLORDS[globalIndex % LANDLORDS.length].slug;

      rows.push({
        title,
        slug,
        description:
          `${title}. ${zone.neighborhood}, ${zone.city}. ` +
          `Available to rent directly from the owner.`,
        location: `${zone.neighborhood}, ${zone.city}`,
        // Nudged off the exact centroid so markers do not stack on the map
        latitude: Number((zone.lat + (rng() - 0.5) * 0.02).toFixed(6)),
        longitude: Number((zone.lng + (rng() - 0.5) * 0.02).toFixed(6)),
        price_value: priceValue,
        price_display: priceDisplay,
        listing_type: "rent",
        rental_kind: group.kind,
        price_period: group.period,
        property_type: type.toLowerCase(),
        min_stay_months: group.minStay
          ? intBetween(rng, group.minStay[0], group.minStay[1])
          : null,
        deposit_months: group.deposit
          ? intBetween(rng, group.deposit[0], group.deposit[1])
          : null,
        utilities_included: group.utilities,
        furnished: group.furnished,
        available_from: isoDate(intBetween(rng, 0, 3), intBetween(rng, 1, 28)),
        beds: intBetween(rng, group.beds[0], group.beds[1]),
        baths: intBetween(rng, group.baths[0], group.baths[1]),
        area: `${intBetween(rng, group.area[0], group.area[1])} sq.ft`,
        year_built: intBetween(rng, 1955, 2024),
        parking: intBetween(rng, 0, 2),
        amenities,
        images: [
          IMAGES[globalIndex % IMAGES.length],
          IMAGES[(globalIndex + 5) % IMAGES.length],
          IMAGES[(globalIndex + 9) % IMAGES.length],
        ],
        tag: "FOR RENT",
        is_featured: FEATURED_SLUGS.has(slug),
        is_active: true,
        landlord_id: landlordIdBySlug.get(landlordSlug) ?? null,
      });

      globalIndex++;
    }
  }

  return rows;
}

/* ─────────────────────────────────────────────
   Commands
───────────────────────────────────────────── */

async function clean() {
  const { error: propertyError, count } = await supabase
    .from("properties")
    .delete({ count: "exact" })
    .like("slug", "rent-%");

  if (propertyError) {
    console.error("Could not remove seeded rentals:", propertyError.message);
    process.exit(1);
  }
  console.log(`Removed ${count ?? 0} seeded rentals.`);

  // The FK is ON DELETE SET NULL, so this is safe even if a hand-made listing
  // points at one of these landlords
  const { error: landlordError } = await supabase
    .from("landlords")
    .delete()
    .in("slug", LANDLORDS.map((l) => l.slug));

  if (landlordError) {
    console.error("Could not remove seeded landlords:", landlordError.message);
    process.exit(1);
  }
  console.log(`Removed ${LANDLORDS.length} seeded landlords.`);
}

async function seed() {
  const landlordRows = LANDLORDS.map((landlord, index) => ({
    ...landlord,
    avatar_url: AVATARS[index % AVATARS.length],
    is_active: true,
  }));

  const { data: landlords, error: landlordError } = await supabase
    .from("landlords")
    .upsert(landlordRows, { onConflict: "slug" })
    .select("id, slug");

  if (landlordError) {
    console.error("Could not seed landlords:", landlordError.message);
    console.error(
      "If this says the relation does not exist, run " +
        "supabase/migrations/0004_rentals_and_landlords.sql first."
    );
    process.exit(1);
  }

  const landlordIdBySlug = new Map(landlords.map((l) => [l.slug, l.id]));
  console.log(`Seeded ${landlords.length} landlords.`);

  const rentals = buildRentals(landlordIdBySlug);

  const { data, error } = await supabase
    .from("properties")
    .upsert(rentals, { onConflict: "slug" })
    .select("id");

  if (error) {
    console.error("Could not seed rentals:", error.message);
    if (error.code === "23514") {
      console.error(
        "A CHECK constraint rejected a row — migration 0004 requires every " +
          "rental to carry both rental_kind and price_period."
      );
    }
    process.exit(1);
  }

  console.log(`Seeded ${data.length} rentals across ${PLAN.length} modalities.`);
  for (const group of PLAN) {
    console.log(`  ${group.kind.padEnd(13)} ${String(group.count).padStart(2)}`);
  }
}

/** Builds every row and reports on it without writing anything */
function dryRun() {
  const rows = buildRentals(new Map());
  const byKind = {};
  let missingPeriod = 0;

  for (const row of rows) {
    byKind[row.rental_kind] = (byKind[row.rental_kind] ?? 0) + 1;
    if (!row.rental_kind || !row.price_period) missingPeriod++;
  }

  console.log(`Would upsert ${rows.length} rentals:\n`);
  for (const group of PLAN) {
    const sample = rows.find((r) => r.rental_kind === group.kind);
    console.log(
      `  ${group.kind.padEnd(13)} ${String(byKind[group.kind] ?? 0).padStart(2)}  ` +
        `${sample.price_display.padEnd(13)} ${sample.slug}`
    );
  }

  const slugs = new Set(rows.map((r) => r.slug));
  console.log(`\n  unique slugs:        ${slugs.size} of ${rows.length}`);
  console.log(`  rows failing CHECK:  ${missingPeriod}`);
  console.log(`  featured:            ${rows.filter((r) => r.is_featured).length}`);
}

if (process.argv.includes("--dry-run")) dryRun();
else if (process.argv.includes("--clean")) await clean();
else await seed();
