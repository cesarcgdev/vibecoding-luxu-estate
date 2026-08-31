import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const cities = ["San Francisco", "Los Angeles", "New York", "Miami", "Chicago", "Seattle", "Austin", "Denver", "Boston", "San Diego"];
const neighborhoods = ["Downtown", "Beverly Hills", "Manhattan", "South Beach", "Lincoln Park", "Capitol Hill", "Downtown", "Cherry Creek", "Back Bay", "La Jolla"];
const titles = ["Modern Luxury Apartment", "Spacious Family Home", "Penthouse with City Views", "Cozy Downtown Studio", "Beautiful Villa", "Elegant Townhouse", "Sunny Beachfront Condo"];

// images.unsplash.com is in next.config.ts remotePatterns; picsum.photos is not,
// and next/image refuses to load a host that is not listed there.
const propertyImages = [
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
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sales only. Rentals need a modality and a price period that this script does
// not produce — use scripts/seed-rentals.js for those.
const properties = Array.from({ length: 20 }).map((_, i) => {
  const city = randomItem(cities);
  const neighborhood = randomItem(neighborhoods);
  const priceValue = randomInt(500000, 5000000);

  return {
    title: randomItem(titles) + " in " + neighborhood,
    location: `${neighborhood}, ${city}`,
    price_value: priceValue,
    price_display: `$${(priceValue / 1000000).toFixed(1)}M`,
    beds: randomInt(1, 6),
    baths: randomInt(1, 5),
    area: `${randomInt(800, 5000)} sq.ft`,
    // next/image only loads hosts listed in next.config.ts; picsum is not one
    images: [propertyImages[i % propertyImages.length]],
    tag: "FOR SALE",
    is_featured: false,
    listing_type: "sale",
    slug: `prop-${Date.now()}-${i}`
  };
});

async function seed() {
  console.log("Seeding properties...");
  const { data, error } = await supabase.from("properties").insert(properties);
  if (error) {
    console.error("Error seeding properties:", error);
  } else {
    console.log("Successfully seeded 20 properties.");
  }
}

seed();
