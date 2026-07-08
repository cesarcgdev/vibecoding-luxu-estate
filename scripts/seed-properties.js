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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const properties = Array.from({ length: 20 }).map((_, i) => {
  const city = randomItem(cities);
  const neighborhood = randomItem(neighborhoods);
  const priceValue = randomInt(500000, 5000000);
  const isRent = Math.random() > 0.8;
  const tag = isRent ? "FOR RENT" : "FOR SALE";
  
  return {
    title: randomItem(titles) + " in " + neighborhood,
    location: `${neighborhood}, ${city}`,
    price_value: priceValue,
    price_display: isRent ? `$${(priceValue / 100).toLocaleString()}/mo` : `$${(priceValue / 1000000).toFixed(1)}M`,
    beds: randomInt(1, 6),
    baths: randomInt(1, 5),
    area: `${randomInt(800, 5000)} sq.ft`,
    images: [`https://picsum.photos/seed/${Date.now()}_${i}/800/600`],
    tag: tag,
    is_featured: false,
    listing_type: isRent ? "rent" : "buy",
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
