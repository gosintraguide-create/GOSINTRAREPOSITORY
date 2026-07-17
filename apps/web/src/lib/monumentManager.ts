// Monument Management System for Hop On Sintra
// Manages the attractions/monuments displayed on the Attractions page

export interface Monument {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  highlights: string[];
  hours: string;
  duration: string;
  tips: string[];
  price: number;
  parkOnlyPrice?: number;
  heroImage?: string;
  cardImage?: string;
  gallery?: string[];
  isVisible: boolean; // Controls whether monument appears on the attractions page
  displayOrder: number; // Order in which monuments appear (lower numbers appear first)
  lastModified: string;
}

// Default monuments - these are the standard Sintra attractions
export const DEFAULT_MONUMENTS: Monument[] = [
  {
    id: "pena-palace",
    slug: "pena-palace",
    name: "Pena Palace",
    shortDescription: "The crown jewel of Sintra, this Romanticist palace sits atop a hill with stunning views. Built in the 19th century, it showcases vibrant colors and eclectic architecture.",
    longDescription: "Built on the ruins of an old monastery, Pena Palace was commissioned by King Ferdinand II and represents the peak of Romantic architecture in Portugal. The palace combines Gothic, Moorish, Renaissance, and Manueline styles in a whimsical display of color and creativity. The surrounding park features exotic trees and plants from around the world, winding paths, and breathtaking viewpoints.",
    highlights: [
      "Panoramic views of Sintra and the Atlantic Ocean",
      "Ornate interior rooms with original 19th-century furnishings",
      "Exotic botanical gardens with over 500 tree species",
      "UNESCO World Heritage Site",
      "Instagram-worthy colorful façade",
    ],
    hours: "9:30 AM - 7:00 PM (Last entry 6:00 PM)",
    duration: "2-3 hours recommended",
    tips: [
      "Arrive early to avoid crowds, especially in summer",
      "Buy tickets online in advance to skip the queue",
      "Wear comfortable walking shoes - lots of stairs",
      "Don't miss the gardens and terraces for the best views",
    ],
    price: 14,
    parkOnlyPrice: 8,
    isVisible: true,
    displayOrder: 1,
    lastModified: new Date().toISOString(),
  },
  {
    id: "quinta-regaleira",
    slug: "quinta-regaleira",
    name: "Quinta da Regaleira",
    shortDescription: "A mystical estate featuring underground tunnels, mysterious wells, and enchanted gardens. Perfect for those seeking adventure and mystery.",
    longDescription: "Quinta da Regaleira is one of Sintra's most enigmatic attractions, built in the early 20th century by millionaire António Augusto Carvalho Monteiro. The estate is filled with mystical symbolism related to alchemy, Masonry, the Knights Templar, and the Rosicrucians. Its most famous feature is the Initiation Well, a spiral staircase descending 27 meters underground, connected to other grottoes through mysterious tunnels.",
    highlights: [
      "The famous Initiation Well with its spiral staircase",
      "Underground tunnel network connecting caves and grottoes",
      "Mystical symbols and hidden meanings throughout",
      "Lush gardens with waterfalls and romantic pathways",
      "Ornate palace with intricate architectural details",
    ],
    hours: "9:30 AM - 6:00 PM (Hours vary by season)",
    duration: "2-3 hours recommended",
    tips: [
      "Bring a flashlight for exploring the dark underground tunnels",
      "Wear sturdy shoes - paths can be slippery when wet",
      "Start with the underground areas before they get crowded",
      "Allow time to explore the extensive gardens",
    ],
    price: 12,
    isVisible: true,
    displayOrder: 2,
    lastModified: new Date().toISOString(),
  },
  {
    id: "moorish-castle",
    slug: "moorish-castle",
    name: "Moorish Castle",
    shortDescription: "Ancient fortress walls dating back to the 8th century, offering spectacular panoramic views of the Sintra mountains and Atlantic Ocean.",
    longDescription: "Built by the Moors during the 8th and 9th centuries to guard the town of Sintra, the castle sits dramatically on a rocky outcrop. After the Christian conquest in 1147, the castle gradually fell into ruin until restoration began in the 19th century. Today, visitors can walk along the ancient walls and towers, enjoying some of the most spectacular views in Portugal.",
    highlights: [
      "360-degree panoramic views from the castle walls",
      "Ancient Moorish fortifications dating to the 8th century",
      "Beautiful forested walking paths to the castle",
      "Archaeological site with medieval ruins",
      "Stunning photo opportunities from the towers",
    ],
    hours: "9:30 AM - 6:00 PM (Hours vary by season)",
    duration: "1-2 hours recommended",
    tips: [
      "Wear good walking shoes - steep climbs and uneven surfaces",
      "Can be very windy - bring a jacket",
      "Best visited in clear weather for the views",
      "Combine with Pena Palace - they're next to each other",
    ],
    price: 10,
    isVisible: true,
    displayOrder: 3,
    lastModified: new Date().toISOString(),
  },
  {
    id: "monserrate-palace",
    slug: "monserrate-palace",
    name: "Monserrate Palace",
    shortDescription: "An exotic palace showcasing Moorish and Indian architectural influences, surrounded by one of Portugal's most beautiful botanical gardens.",
    longDescription: "Built in 1858 for Sir Francis Cook, Monserrate Palace is a stunning example of Romantic architecture with strong exotic influences. The palace blends Gothic, Indian, and Moorish architectural elements in a unique and harmonious way. The surrounding park is considered one of the most important botanical gardens in Portugal, featuring plants from around the world organized into distinct geographical zones.",
    highlights: [
      "Stunning exotic architecture mixing multiple styles",
      "World-class botanical gardens with rare plants",
      "Peaceful atmosphere - less crowded than other palaces",
      "Beautiful interior with ornate plasterwork and tiles",
      "UNESCO World Heritage Site",
    ],
    hours: "9:30 AM - 6:00 PM (Hours vary by season)",
    duration: "1.5-2 hours recommended",
    tips: [
      "Often less crowded than Pena or Quinta da Regaleira",
      "Don't rush - take time to explore the gardens",
      "Great for photography, especially the architecture",
      "Located further from the center - plan transportation",
    ],
    price: 8,
    isVisible: true,
    displayOrder: 4,
    lastModified: new Date().toISOString(),
  },
  {
    id: "sintra-national-palace",
    slug: "sintra-national-palace",
    name: "Sintra National Palace",
    shortDescription: "The best-preserved medieval royal palace in Portugal, famous for its distinctive twin chimneys and beautiful azulejo tiles.",
    longDescription: "Located in the heart of Sintra's historic center, the National Palace has been a royal residence since the early 15th century. The palace is a remarkable blend of Moorish, Gothic, and Manueline architecture, reflecting centuries of Portuguese history. Its most distinctive features are the two enormous conical chimneys rising from the palace kitchens, visible from across Sintra.",
    highlights: [
      "Iconic twin conical chimneys",
      "Largest collection of Mudéjar azulejos in Portugal",
      "Royal apartments with original furnishings",
      "Beautiful courtyards and gardens",
      "Right in Sintra's town center - easily accessible",
    ],
    hours: "9:30 AM - 6:00 PM (Hours vary by season)",
    duration: "1-1.5 hours recommended",
    tips: [
      "Located in town center - perfect for combining with lunch",
      "Less physically demanding than hilltop palaces",
      "Audio guides available in multiple languages",
      "Good option for those with limited mobility",
    ],
    price: 10,
    isVisible: true,
    displayOrder: 5,
    lastModified: new Date().toISOString(),
  },
];

// Storage functions
export function saveMonuments(monuments: Monument[]): void {
  localStorage.setItem("monuments", JSON.stringify(monuments));
  localStorage.setItem("monuments-timestamp", Date.now().toString());
}

export function loadMonuments(): Monument[] {
  const saved = localStorage.getItem("monuments");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing saved monuments:", error);
      return DEFAULT_MONUMENTS;
    }
  }
  return DEFAULT_MONUMENTS;
}

// Get visible monuments sorted by display order
export function getVisibleMonuments(): Monument[] {
  return loadMonuments()
    .filter(monument => monument.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

// Get monument by slug
export function getMonumentBySlug(slug: string): Monument | undefined {
  return loadMonuments().find(monument => monument.slug === slug);
}

// Helper to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Server-sync functions for fetching/saving monument data
export async function loadMonumentsFromServer(projectId: string, publicAnonKey: string): Promise<Monument[]> {
  // Check cache first with a 5-minute TTL
  const cacheKey = 'monuments-cache';
  const cacheTimestampKey = 'monuments-cache-timestamp';
  const cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedTimestamp && cachedData) {
    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();
    
    // If cache is still valid, return it immediately
    if (now - timestamp < cacheTTL) {
      try {
        const parsed = JSON.parse(cachedData);
        console.log('Using cached monuments');
        return parsed;
      } catch (error) {
        console.error('Error parsing cached monuments:', error);
      }
    }
  }
  
  // Cache miss or expired - fetch from server
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/monuments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.monuments && result.monuments.length > 0) {
        // Cache with timestamp for faster subsequent loads
        localStorage.setItem(cacheKey, JSON.stringify(result.monuments));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        console.log('Fetched and cached monuments from server');
        return result.monuments;
      }
    }
  } catch (error) {
    console.error("Error loading monuments from server:", error);
  }

  // Fall back to localStorage or defaults
  return loadMonuments();
}

export async function saveMonumentsToServer(monuments: Monument[], projectId: string, publicAnonKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/monuments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monuments }),
      }
    );

    if (response.ok) {
      // Clear cache so fresh data is loaded next time
      localStorage.removeItem('monuments-cache');
      localStorage.removeItem('monuments-cache-timestamp');
      console.log('Saved monuments and cleared cache');
    }

    return response.ok;
  } catch (error) {
    console.error("Error saving monuments to server:", error);
    return false;
  }
}
