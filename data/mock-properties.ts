import type { Property, PropertyTag } from "../lib/properties";

const cities = ["San Francisco", "Los Angeles", "New York", "Miami", "Chicago", "Seattle", "Austin", "Denver", "Boston", "San Diego"];
const neighborhoods = ["Downtown", "Beverly Hills", "Manhattan", "South Beach", "Lincoln Park", "Capitol Hill", "Downtown", "Cherry Creek", "Back Bay", "La Jolla"];
const propertyTypes = ["House", "Apartment", "Villa", "Penthouse"];
const adjectives = ["Modern Luxury", "Spacious Family", "Beautiful", "Cozy", "Elegant", "Sunny", "Exclusive"];

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
  "https://images.unsplash.com/photo-1502672260266-1c1c24240f57?w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b4a4?w=800&q=80",
  "https://images.unsplash.com/photo-1508330527318-5a6433e146eb?w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
  "https://images.unsplash.com/photo-1542361345-89e58247f2d5?w=800&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80",
];

const FEATURED_COUNT = 2;
const MARKET_COUNT = 20;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const generateMockProperties = (count = MARKET_COUNT): Property[] => {
  return Array.from({ length: count }).map((_, i) => {
    const city = randomItem(cities);
    const neighborhood = randomItem(neighborhoods);
    const priceValue = randomInt(500000, 5000000);
    const isRent = Math.random() > 0.8;
    const tag: PropertyTag = isRent ? "FOR RENT" : "FOR SALE";
    const type = randomItem(propertyTypes);
    const title = `${randomItem(adjectives)} ${type} in ${neighborhood}`;

    return {
      id: `mock-${i}`,
      title,
      location: `${neighborhood}, ${city}`,
      price_value: priceValue,
      price_display: isRent ? `$${(priceValue / 100).toLocaleString()}/mo` : `$${(priceValue / 1000000).toFixed(1)}M`,
      beds: randomInt(1, 6),
      baths: randomInt(1, 5),
      area: `${randomInt(800, 5000)} sq.ft`,
      images: [propertyImages[i % propertyImages.length]],
      tag: tag,
      is_featured: false,
      listing_type: isRent ? "rent" : "buy",
      slug: `prop-mock-${i}`,
      created_at: new Date().toISOString()
    };
  });
};

const generated = generateMockProperties(FEATURED_COUNT + MARKET_COUNT);

/** Hero properties, kept out of MOCK_PROPERTIES so the market grid never repeats them */
export const MOCK_FEATURED_PROPERTIES: Property[] = generated
  .slice(0, FEATURED_COUNT)
  .map((property) => ({ ...property, is_featured: true, tag: "Exclusive" }));

export const MOCK_PROPERTIES: Property[] = generated.slice(FEATURED_COUNT);

/** Every mock listing, so a card rendered from mock data still resolves its detail page */
export const ALL_MOCK_PROPERTIES: Property[] = [
  ...MOCK_FEATURED_PROPERTIES,
  ...MOCK_PROPERTIES,
];
