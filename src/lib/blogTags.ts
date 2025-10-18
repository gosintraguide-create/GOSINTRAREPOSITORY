// Blog Tags Management System for Go Sintra
// Centralized tag management for better SEO consistency

export const DEFAULT_BLOG_TAGS = [
  // Location & Destinations
  "sintra",
  "lisbon",
  "portugal",
  "cascais",
  "cabo-da-roca",
  
  // Attractions
  "pena-palace",
  "quinta-da-regaleira",
  "moorish-castle",
  "monserrate-palace",
  "sintra-national-palace",
  "palace-of-queluz",
  "convent-of-capuchos",
  "cabo-da-roca-lighthouse",
  
  // Transportation
  "transportation",
  "train",
  "hop-on-hop-off",
  "day-pass",
  "getting-there",
  "parking",
  "bus",
  
  // Planning & Logistics
  "planning",
  "itinerary",
  "day-trip",
  "travel-tips",
  "booking",
  "tickets",
  "guided-tour",
  "group-tour",
  "private-tour",
  "skip-the-line",
  
  // Activities & Experiences
  "attractions",
  "sightseeing",
  "gardens",
  "hiking",
  "photography",
  "architecture",
  "unesco-heritage",
  "viewpoints",
  
  // Travel Style
  "budget-travel",
  "luxury-travel",
  "family-friendly",
  "solo-travel",
  "couples",
  "accessibility",
  
  // Practical Info
  "opening-hours",
  "admission-fees",
  "best-time-to-visit",
  "weather",
  "what-to-bring",
  "crowd-tips",
  
  // Food & Dining
  "food",
  "restaurants",
  "cafes",
  "local-cuisine",
  "travesseiros",
  "queijadas",
  "portuguese-food",
  
  // History & Culture
  "history",
  "culture",
  "romanticism",
  "unesco",
  "royal-palace",
  "portuguese-history",
  "architecture-styles",
  
  // Seasonal
  "summer",
  "winter",
  "spring",
  "fall",
  "off-season",
  "peak-season",
  
  // Guides & Resources
  "guide",
  "first-time-visitor",
  "ultimate-guide",
  "insider-tips",
  "local-secrets",
  "hidden-gems",
  "mistakes-to-avoid",
  
  // Comparison & Alternatives
  "vs",
  "comparison",
  "alternatives",
  "worth-it",
  
  // Special Interests
  "gardens",
  "palaces",
  "castles",
  "monasteries",
  "gothic",
  "moorish",
  "romantic-architecture",
];

// Storage functions
export function saveBlogTags(tags: string[]): void {
  localStorage.setItem("blog-tags", JSON.stringify(tags));
}

export function loadBlogTags(): string[] {
  const saved = localStorage.getItem("blog-tags");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing saved tags:", error);
      return DEFAULT_BLOG_TAGS;
    }
  }
  return DEFAULT_BLOG_TAGS;
}

// Get all unique tags currently used in articles
export function getUsedTags(articles: any[]): string[] {
  const allTags = articles.flatMap(article => article.tags || []);
  return Array.from(new Set(allTags)).sort();
}

// Get tags sorted by usage frequency
export function getTagsByFrequency(articles: any[]): { tag: string; count: number }[] {
  const tagCounts: { [key: string]: number } = {};
  
  articles.forEach(article => {
    (article.tags || []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Add a new tag to the master list
export function addTag(tag: string): boolean {
  const tags = loadBlogTags();
  const normalizedTag = tag.trim().toLowerCase();
  
  if (!normalizedTag) return false;
  if (tags.includes(normalizedTag)) return false;
  
  const newTags = [...tags, normalizedTag].sort();
  saveBlogTags(newTags);
  return true;
}

// Remove a tag from the master list
export function removeTag(tag: string): void {
  const tags = loadBlogTags();
  const newTags = tags.filter(t => t !== tag);
  saveBlogTags(newTags);
}

// Reset to default tags
export function resetToDefaultTags(): void {
  saveBlogTags(DEFAULT_BLOG_TAGS);
}
