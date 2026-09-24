import type { Agent } from "@/types/agent";
import type { PropertyDetail } from "@/types/property";

/*
 * TEMPORARY demonstration data for the homepage and the /properties listings.
 * These are fictional listings, not real properties. Phase 6 replaces them with Supabase data.
 */

/** Fictional sample agents and agencies. Not real people or businesses. */
export const DEMO_AGENTS: Agent[] = [
  {
    id: "demo-agent-sara",
    fullName: "Sara Malik",
    agencyName: "Northgate Realty (Sample)",
    title: "Senior Property Consultant",
  },
  {
    id: "demo-agent-hamza",
    fullName: "Hamza Qureshi",
    agencyName: "Harbourline Estates (Sample)",
    title: "Residential Sales Advisor",
  },
  {
    id: "demo-agent-ayesha",
    fullName: "Ayesha Rehman",
    agencyName: "Greenfield Property Group (Sample)",
    title: "Lettings & Sales Specialist",
  },
];

export const DEMO_PROPERTIES: PropertyDetail[] = [
  {
    id: "demo-dha-lahore-villa",
    title: "Modern Villa with Landscaped Garden",
    propertyType: "Villa",
    listingType: "For Sale",
    price: 185_000_000,
    city: "Lahore",
    location: "DHA Phase 6",
    bedrooms: 5,
    bathrooms: 6,
    area: 1,
    areaUnit: "Kanal",
    amenities: ["Parking", "Garden", "Swimming Pool", "Security", "Backup Power"],
    listedAt: "2026-09-02",
    description:
      "A contemporary one-kanal villa set behind a landscaped front garden in a quiet DHA Phase 6 street. Double-height living spaces open onto a private pool deck, the kitchen is fitted with stone counters and a separate prep area, and every bedroom has its own bathroom. Solar-backed power, a gated driveway and staff quarters complete a home designed for everyday comfort and easy entertaining.",
    yearBuilt: 2021,
    parkingSpaces: 3,
    agentId: "demo-agent-sara",
    images: [
      {
        src: "/images/properties/property-1/main.png",
        alt: "Front of the modern villa at dusk, with a landscaped lawn, lit entrance and gated driveway",
        label: "Exterior",
      },
      {
        src: "/images/properties/property-1/living-room.png",
        alt: "Living room with a large sectional sofa, marble feature wall and glass doors to the garden",
        label: "Living room",
      },
      {
        src: "/images/properties/property-1/master-bedroom.png",
        alt: "Master bedroom with an upholstered bed and sliding doors opening onto the pool garden",
        label: "Master bedroom",
      },
      {
        src: "/images/properties/property-1/kitchen.png",
        alt: "Kitchen with a marble waterfall island, bar stools and glass pendant lights",
        label: "Kitchen",
      },
      {
        src: "/images/properties/property-1/bathroom.png",
        alt: "Master bathroom with a freestanding tub, glass walk-in shower and marble double vanity",
        label: "Luxury master bathroom",
      },
      {
        src: "/images/properties/property-1/garden-pool.png",
        alt: "Back garden with a swimming pool, water feature and outdoor lounge seating",
        label: "Garden & pool",
      },
    ],
  },
  {
    id: "demo-clifton-apartment",
    title: "Sea-Facing Luxury Apartment",
    propertyType: "Apartment",
    listingType: "For Rent",
    price: 280_000,
    city: "Karachi",
    location: "Clifton Block 5",
    bedrooms: 3,
    bathrooms: 4,
    area: 2100,
    areaUnit: "sq ft",
    amenities: ["Parking", "Security", "Gym", "Furnished", "Air Conditioning", "Backup Power"],
    listedAt: "2026-09-18",
    description:
      "A bright three-bedroom apartment on a high floor in Clifton Block 5, with wide windows framing the sea. The unit is fully furnished and air-conditioned, and residents share a gym, round-the-clock security and backup power. Two covered parking spaces and quick access to Clifton's cafés and schools make it an easy long-term rental.",
    yearBuilt: 2019,
    parkingSpaces: 2,
    agentId: "demo-agent-hamza",
    images: [
      {
        src: "/images/properties/property-3/main.png",
        alt: "Seafront apartment tower with glass balconies, a gated landscaped entrance and the beach alongside",
        label: "Sea-facing apartment exterior",
      },
      {
        src: "/images/properties/property-3/living-room.png",
        alt: "Living room with a cream sectional sofa, marble coffee table and floor-to-ceiling windows facing the sea",
        label: "Sea-view living room",
      },
      {
        src: "/images/properties/property-3/master-bedroom.png",
        alt: "Master bedroom with an upholstered bed and sliding glass doors opening onto a sea-facing balcony",
        label: "Master bedroom",
      },
      {
        src: "/images/properties/property-3/kitchen.png",
        alt: "Kitchen with a marble waterfall island, three bar stools, glass pendant lights and a view of the sea",
        label: "Modern luxury kitchen",
      },
      {
        src: "/images/properties/property-3/bathroom.png",
        alt: "Master bathroom with a freestanding tub by a full-height window, glass shower and marble double vanity",
        label: "Luxury master bathroom",
      },
      {
        src: "/images/properties/property-3/balcony-sea-view.png",
        alt: "Balcony with outdoor lounge seating and a glass railing overlooking the beach and coastline",
        label: "Balcony & sea view",
      },
    ],
  },
  {
    id: "demo-bahria-rawalpindi-house",
    title: "Contemporary Family Home",
    propertyType: "House",
    listingType: "For Sale",
    price: 95_000_000,
    city: "Rawalpindi",
    location: "Bahria Town Phase 8",
    bedrooms: 4,
    bathrooms: 5,
    area: 10,
    areaUnit: "Marla",
    amenities: ["Parking", "Garden", "Security"],
    listedAt: "2026-08-21",
    description:
      "A newly built ten-marla family home in Bahria Town Phase 8, finished in warm, neutral tones. The ground floor combines a drawing room, open-plan lounge and kitchen, with four bedrooms arranged across two floors. A small lawn, gated parking and the society's security and amenities make it a practical, move-in-ready choice.",
    yearBuilt: 2022,
    parkingSpaces: 2,
    agentId: "demo-agent-ayesha",
  },
  {
    id: "demo-dha-islamabad-house",
    title: "Executive Residence near the Hills",
    propertyType: "House",
    listingType: "For Sale",
    price: 210_000_000,
    city: "Islamabad",
    location: "DHA Phase 2",
    bedrooms: 6,
    bathrooms: 7,
    area: 1,
    areaUnit: "Kanal",
    amenities: ["Parking", "Garden", "Swimming Pool", "Security", "Gym", "Backup Power"],
    listedAt: "2026-09-10",
    description:
      "An executive six-bedroom residence in DHA Phase 2 with open views towards the Margalla foothills. Generous reception rooms, a home gym and a heated pool sit alongside a mature garden and a basement suited to a home office or media room. Built for large families who want space, privacy and quality finishes.",
    yearBuilt: 2020,
    parkingSpaces: 4,
    agentId: "demo-agent-sara",
    images: [
      {
        src: "/images/properties/property-2/main.png",
        alt: "Front of the executive residence at sunset, with a lit entrance, gated driveway and hills behind",
        label: "Executive Residence exterior",
      },
      {
        src: "/images/properties/property-2/living-room.png",
        alt: "Open-plan living room with a sectional sofa, ring chandelier and glass doors to the pool and hills",
        label: "Luxury living room",
      },
      {
        src: "/images/properties/property-2/master-bedroom.png",
        alt: "Master bedroom with an upholstered bed and a private balcony overlooking the hills",
        label: "Master bedroom",
      },
      {
        src: "/images/properties/property-2/kitchen.png",
        alt: "Kitchen with a marble waterfall island, four bar stools and glass pendant lights",
        label: "Modern luxury kitchen",
      },
      {
        src: "/images/properties/property-2/bathroom.png",
        alt: "Master bathroom with a freestanding tub beneath a large window, glass shower and double vanity",
        label: "Luxury master bathroom",
      },
      {
        src: "/images/properties/property-2/garden-pool.png",
        alt: "Back garden with a swimming pool, waterfall feature, outdoor lounge and a view of the hills at sunset",
        label: "Garden & swimming pool",
      },
    ],
  },
  {
    id: "demo-gulberg-penthouse",
    title: "Skyline Penthouse with Terrace",
    propertyType: "Apartment",
    listingType: "For Sale",
    price: 68_000_000,
    city: "Lahore",
    location: "Gulberg III",
    bedrooms: 3,
    bathrooms: 4,
    area: 2800,
    areaUnit: "sq ft",
    amenities: ["Parking", "Security", "Gym", "Air Conditioning", "Backup Power"],
    listedAt: "2026-09-14",
    description:
      "A three-bedroom penthouse in the heart of Gulberg III, topped by a private terrace with skyline views. Floor-to-ceiling glazing fills the living areas with light, and the building provides a gym, secure parking and backup power. Ideal for buyers who want city-centre convenience without giving up outdoor space.",
    yearBuilt: 2018,
    parkingSpaces: 2,
    agentId: "demo-agent-hamza",
    images: [
      {
        src: "/images/properties/property-4/main.png",
        alt: "Penthouse building at night with warm lighting, glass-railed upper terraces and the city skyline in the distance",
        label: "Skyline Penthouse exterior",
      },
      {
        src: "/images/properties/property-4/living-room.png",
        alt: "Living room with a cream sectional sofa, ring chandelier, marble fireplace wall and glass doors to a city-view terrace",
        label: "Luxury living room",
      },
      {
        src: "/images/properties/property-4/master-bedroom.png",
        alt: "Master bedroom with an upholstered bed and sliding glass doors opening onto a terrace overlooking the city at night",
        label: "Master bedroom",
      },
      {
        src: "/images/properties/property-4/kitchen.png",
        alt: "Kitchen with a marble waterfall island, four bar stools, glass pendant lights and a dining area facing the skyline",
        label: "Modern luxury kitchen",
      },
      {
        src: "/images/properties/property-4/bathroom.png",
        alt: "Master bathroom with a freestanding tub by a city-view window, glass shower and marble vanity",
        label: "Luxury master bathroom",
      },
      {
        src: "/images/properties/property-4/terrace.png",
        alt: "Private terrace with lounge seating, an outdoor dining table and barbecue counter overlooking the city skyline at night",
        label: "Private terrace",
      },
    ],
  },
  {
    id: "demo-citi-faisalabad-house",
    title: "Bright Corner House, Ready to Move",
    propertyType: "House",
    listingType: "For Rent",
    price: 150_000,
    city: "Faisalabad",
    location: "Citi Housing",
    bedrooms: 4,
    bathrooms: 4,
    area: 10,
    areaUnit: "Marla",
    amenities: ["Parking", "Garden", "Air Conditioning"],
    listedAt: "2026-08-30",
    description:
      "A well-kept corner house in Citi Housing with extra light and ventilation from two open sides. Four bedrooms, a family lounge, a fitted kitchen and a small garden are ready for a family to move straight in. Air conditioning is installed in the main rooms, and there is secure parking for two cars.",
    yearBuilt: 2017,
    parkingSpaces: 2,
    agentId: "demo-agent-ayesha",
  },
];

/** Demonstration listing counts for the Popular Cities cards (not real inventory). */
export const DEMO_CITY_COUNTS: Record<string, number> = {
  Lahore: 340,
  Islamabad: 260,
  Karachi: 310,
  Rawalpindi: 120,
  Faisalabad: 85,
  Multan: 70,
};

export const DEMO_STATS = [
  { value: "1,200+", label: "Properties" },
  { value: "350+", label: "Trusted Agents" },
  { value: "15+", label: "Cities" },
  { value: "98%", label: "Client Satisfaction" },
] as const;
