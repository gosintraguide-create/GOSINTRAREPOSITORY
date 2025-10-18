// Central content management system for the website
import { getContent as getContentFromAPI, saveContent as saveContentToAPI } from './api';
import { getTranslation } from './translations';

export interface WebsiteContent {
  company: {
    name: string;
    email: string;
    phone: string;
    location: string;
    operatingHours: string;
    whatsappNumber: string;
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCallToAction: string;
    benefitPills: Array<{ icon: string; text: string }>;
    sectionOneTitle: string;
    sectionOneDescription: string;
  };
  about: {
    title: string;
    subtitle: string;
    story: string[];
    mission: string;
    values: Array<{ title: string; description: string }>;
  };
  attractions: {
    [key: string]: {
      name: string;
      description: string;
      longDescription: string;
      highlights: string[];
      hours: string;
      duration: string;
      tips: string[];
      price: number;
      parkOnlyPrice?: number;
    };
  };
  seo: {
    home: { title: string; description: string; keywords: string };
    attractions: { title: string; description: string; keywords: string };
    howItWorks: { title: string; description: string; keywords: string };
    buyTicket: { title: string; description: string; keywords: string };
    about: { title: string; description: string; keywords: string };
  };
}

export const DEFAULT_CONTENT: WebsiteContent = {
  company: {
    name: "Go Sintra",
    email: "info@gosintra.com",
    phone: "+351 932 967 279",
    location: "Sintra, Portugal",
    operatingHours: "9 AM - 8 PM Daily",
    whatsappNumber: "+351932967279",
  },
  homepage: {
    heroTitle: "Discover Sintra Your Way",
    heroSubtitle: "Hop-on, hop-off day pass with guaranteed seats. Unlimited rides in small tuk tuks and vintage jeeps. New departure every 10-15 minutes.",
    heroCallToAction: "Book Your Day Pass",
    benefitPills: [
      { icon: "Users", text: "Small Groups (2-6)" },
      { icon: "Clock", text: "Every 10-15 Min" },
      { icon: "MapPin", text: "All Attractions" },
    ],
    sectionOneTitle: "Why Choose Go Sintra?",
    sectionOneDescription: "Skip the crowded tour buses and experience Sintra the way it's meant to be discovered",
  },
  about: {
    title: "About Go Sintra",
    subtitle: "Your premium hop-on/hop-off adventure through Sintra's magical landscapes",
    story: [
      "Go Sintra was born from a simple observation: visitors to this UNESCO World Heritage site deserved better than crowded buses and rigid schedules.",
      "We created a flexible, premium alternative that combines the intimacy of small vehicles with the freedom of hop-on/hop-off convenience.",
      "Today, thousands of visitors choose Go Sintra for guaranteed seating, regular departures every 10-15 minutes, and an authentic, intimate way to explore this magical destination.",
    ],
    mission: "Our mission is to provide the most convenient, comfortable, and authentic way to explore Sintra's palaces, castles, and gardens.",
    values: [
      {
        title: "Guaranteed Comfort",
        description: "Every guest has a guaranteed seat in a small, intimate vehicle. No standing, no overcrowding.",
      },
      {
        title: "Total Flexibility",
        description: "Hop off at any attraction, spend as long as you want, then hop back on. Your day, your pace.",
      },
      {
        title: "Local Expertise",
        description: "Our drivers know Sintra inside and out, offering insights you won't find in guidebooks.",
      },
    ],
  },
  attractions: {
    "pena-palace": {
      name: "Pena Palace",
      description: "The crown jewel of Sintra, this Romanticist palace sits atop a hill with stunning views. Built in the 19th century, it showcases vibrant colors and eclectic architecture.",
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
        "Wear comfortable shoes - lots of walking and hills",
        "Don't miss the palace terrace for the best views",
        "Visit the park before or after touring the palace",
      ],
      price: 14,
      parkOnlyPrice: 8,
    },
    "quinta-regaleira": {
      name: "Quinta da Regaleira",
      description: "A mystical estate featuring enigmatic gardens, underground tunnels, and the famous Initiation Well. This UNESCO World Heritage site is a masterpiece of symbolic and philosophical architecture.",
      longDescription: "Created by Italian architect Luigi Manini for millionaire António Augusto Carvalho Monteiro, Quinta da Regaleira is filled with alchemical and masonic symbolism. The estate features elaborate gardens, mysterious grottoes, enchanting lakes, and the iconic Initiation Well - a 27-meter spiral staircase descending into the earth, used for ceremonial purposes.",
      highlights: [
        "The famous Initiation Well with spiral staircase",
        "Mysterious underground tunnel system",
        "Gothic-Manueline palace with intricate details",
        "Enchanted gardens with hidden symbols",
        "Chapel of the Holy Trinity",
      ],
      hours: "9:30 AM - 6:00 PM (Last entry 5:00 PM)",
      duration: "2-3 hours recommended",
      tips: [
        "Bring a flashlight for exploring the tunnels",
        "Wear sturdy shoes - paths can be slippery",
        "Allow time to explore all the hidden corners",
        "The Initiation Well is a must-see photo spot",
      ],
      price: 12,
    },
    "moorish-castle": {
      name: "Moorish Castle",
      description: "Ancient fortress walls snake along mountain ridges, offering spectacular panoramic views. Built by the Moors in the 8th-9th centuries, this castle is a testament to medieval military architecture.",
      longDescription: "The Moorish Castle was built during the Muslim occupation of the Iberian Peninsula, strategically positioned to guard the town of Sintra and surrounding trade routes. After the Christian conquest, the castle fell into disrepair but was later restored in the 19th century. Today, visitors can walk along the ancient ramparts and enjoy some of the most spectacular views in the region.",
      highlights: [
        "360-degree views from the castle walls",
        "Ancient medieval fortification system",
        "Archaeological site with Moorish artifacts",
        "Scenic hiking trails through the forest",
        "Stunning photo opportunities at every turn",
      ],
      hours: "9:30 AM - 6:00 PM (Last entry 5:00 PM)",
      duration: "1.5-2 hours recommended",
      tips: [
        "Excellent workout - lots of stairs and climbing",
        "Best visited in the morning for clearer views",
        "Combine with Pena Palace for a full day",
        "Bring water and sun protection",
      ],
      price: 10,
    },
    "monserrate-palace": {
      name: "Monserrate Palace",
      description: "An exotic palace blending Gothic, Indian, and Moorish influences, set within one of the most beautiful botanical gardens in Portugal with rare and exotic plant species from around the world.",
      longDescription: "Monserrate Palace was built in 1858 for Sir Francis Cook, an English textile magnate and art collector. The palace showcases an extraordinary fusion of architectural styles, while its gardens are considered among the finest examples of landscape gardening in Portugal. The estate features plants from five continents, creating microclimates that support species from Mexico, Australia, Japan, and beyond.",
      highlights: [
        "Stunning mix of architectural styles",
        "World-class botanical gardens",
        "Ornate interior with intricate plasterwork",
        "Peaceful atmosphere, less crowded",
        "Beautiful lakes and waterfalls",
      ],
      hours: "9:30 AM - 6:00 PM (Last entry 5:00 PM)",
      duration: "2-2.5 hours recommended",
      tips: [
        "Often less crowded than other palaces",
        "Don't rush - the gardens deserve time",
        "Perfect for photography enthusiasts",
        "Bring a picnic to enjoy in the gardens",
      ],
      price: 10,
    },
    "sintra-palace": {
      name: "Sintra National Palace",
      description: "Located in the heart of Sintra's historic center, this is the best-preserved medieval royal palace in Portugal, famous for its distinctive twin chimneys and magnificent tile work.",
      longDescription: "The Sintra National Palace has been a royal residence since the early 15th century and was continuously inhabited by Portuguese royalty until 1910. The palace showcases various architectural styles accumulated over the centuries, from medieval to Renaissance. Its interior features some of the finest examples of Mudéjar tilework in Portugal, along with painted ceilings depicting armillary spheres, magpies, and swans.",
      highlights: [
        "Iconic twin conical chimneys",
        "Magnificent azulejo tile collection",
        "Historic Sala dos Brasões (Coat of Arms Room)",
        "Royal kitchens with massive fireplaces",
        "Central location in Sintra village",
      ],
      hours: "9:30 AM - 6:00 PM (Last entry 5:30 PM)",
      duration: "1.5-2 hours recommended",
      tips: [
        "Start or end your day here - it's in town center",
        "Audio guide recommended for full historical context",
        "Great for a rainy day - mostly indoor",
        "Combine with exploring Sintra's cafes and shops",
      ],
      price: 10,
    },
  },
  seo: {
    home: {
      title: "Go Sintra - Premium Hop-On/Hop-Off Day Pass | Small Vehicle Tours",
      description: "Explore Sintra's UNESCO World Heritage sites with guaranteed seating in small vehicles. Unlimited rides every 10-15 minutes. Book your flexible day pass online now.",
      keywords: "Sintra tours, hop on hop off Sintra, Sintra transport, small group tours Sintra, Pena Palace tours, Sintra day pass",
    },
    attractions: {
      title: "Sintra Attractions - Palaces & Castles | Go Sintra Day Pass",
      description: "Discover Pena Palace, Quinta da Regaleira, Moorish Castle, and more. Our day pass includes unlimited transport to all major Sintra attractions.",
      keywords: "Sintra attractions, Pena Palace, Quinta da Regaleira, Moorish Castle, Monserrate Palace, Sintra National Palace",
    },
    howItWorks: {
      title: "How It Works - Go Sintra Hop-On/Hop-Off Service",
      description: "Learn how our flexible day pass works. Book online, get your QR codes, and hop on any vehicle during operating hours. Simple and convenient.",
      keywords: "how to visit Sintra, Sintra transport guide, hop on hop off how it works, Sintra day pass guide",
    },
    buyTicket: {
      title: "Book Your Day Pass - Go Sintra | Instant Confirmation",
      description: "Book your Sintra day pass online. Choose your date, get instant QR codes for each passenger, and enjoy unlimited rides until 8pm. Add attraction tickets too.",
      keywords: "book Sintra tours, buy Sintra day pass, Sintra tickets online, Sintra attraction tickets",
    },
    about: {
      title: "About Go Sintra - Premium Small Vehicle Tour Service",
      description: "Go Sintra offers premium hop-on/hop-off service with guaranteed seating in small vehicles. Regular departures every 10-15 minutes throughout Sintra.",
      keywords: "about Go Sintra, Sintra tour company, premium Sintra tours, small group Sintra",
    },
  },
};

export function saveContent(content: WebsiteContent): void {
  // Save to localStorage as backup
  localStorage.setItem("website-content", JSON.stringify(content));
  
  // Also save to Supabase (non-blocking)
  saveContentToAPI(content).catch(error => {
    console.error('Failed to save content to database:', error);
  });
}

export function loadContent(): WebsiteContent {
  // Try localStorage first for immediate response
  const saved = localStorage.getItem("website-content");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_CONTENT,
        ...parsed,
        company: { ...DEFAULT_CONTENT.company, ...parsed.company },
        homepage: { ...DEFAULT_CONTENT.homepage, ...parsed.homepage },
        about: { ...DEFAULT_CONTENT.about, ...parsed.about },
        attractions: { ...DEFAULT_CONTENT.attractions, ...parsed.attractions },
        seo: { ...DEFAULT_CONTENT.seo, ...parsed.seo },
      };
    } catch {
      return DEFAULT_CONTENT;
    }
  }
  return DEFAULT_CONTENT;
}

// Load content with language support
export function loadContentWithLanguage(languageCode: string = 'en'): WebsiteContent {
  // Get translation for the language
  const translation = getTranslation(languageCode);
  
  // Check if there's custom content saved by admin
  const saved = localStorage.getItem("website-content");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge custom content with translation (custom content takes precedence)
      return {
        ...translation,
        ...parsed,
        company: { ...translation.company, ...parsed.company },
        homepage: { ...translation.homepage, ...parsed.homepage },
        about: { ...translation.about, ...parsed.about },
        attractions: { ...translation.attractions, ...parsed.attractions },
        seo: { ...translation.seo, ...parsed.seo },
      };
    } catch {
      return translation;
    }
  }
  return translation;
}

// Async function to sync content from database
export async function syncContentFromDatabase(): Promise<WebsiteContent> {
  try {
    const content = await getContentFromAPI();
    if (content) {
      // Save to localStorage for offline access
      localStorage.setItem("website-content", JSON.stringify(content));
      return {
        ...DEFAULT_CONTENT,
        ...content,
        company: { ...DEFAULT_CONTENT.company, ...content.company },
        homepage: { ...DEFAULT_CONTENT.homepage, ...content.homepage },
        about: { ...DEFAULT_CONTENT.about, ...content.about },
        attractions: { ...DEFAULT_CONTENT.attractions, ...content.attractions },
        seo: { ...DEFAULT_CONTENT.seo, ...content.seo },
      };
    }
  } catch (error) {
    console.error('Failed to sync content from database:', error);
  }
  return loadContent();
}