// Blog/Articles Management System for Go Sintra

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  lastModified: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  readTimeMinutes: number;
  faqs?: FAQItem[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// Default categories
export const DEFAULT_CATEGORIES: BlogCategory[] = [
  {
    id: "planning",
    name: "Planning Your Visit",
    slug: "planning",
    description: "Everything you need to know to plan the perfect Sintra day trip"
  },
  {
    id: "getting-there",
    name: "Getting There",
    slug: "getting-there",
    description: "Transportation guides and tips for reaching Sintra"
  },
  {
    id: "attractions",
    name: "Attractions & Sights",
    slug: "attractions",
    description: "In-depth guides to Sintra's palaces, castles, and gardens"
  },
  {
    id: "tips",
    name: "Travel Tips",
    slug: "tips",
    description: "Insider tips and local advice for exploring Sintra"
  },
  {
    id: "history",
    name: "History & Culture",
    slug: "history",
    description: "Learn about Sintra's rich history and cultural heritage"
  }
];

// Sample default articles
export const DEFAULT_ARTICLES: BlogArticle[] = [
  {
    id: "how-to-get-to-sintra",
    title: "How to Get to Sintra from Lisbon",
    slug: "how-to-get-to-sintra",
    excerpt: "A complete guide to reaching Sintra from Lisbon by train, car, or organized tour. Learn about schedules, costs, and the best transportation options.",
    content: `# How to Get to Sintra from Lisbon

Sintra is just 30 kilometers northwest of Lisbon, making it an easy and popular day trip destination. Here's everything you need to know about getting there.

## By Train (Recommended)

The train is the most popular and convenient way to reach Sintra from Lisbon.

### From Rossio Station
- **Frequency**: Every 15-20 minutes during the day
- **Journey Time**: Approximately 40 minutes
- **Cost**: Around €2.30 each way with a Viva Viagem card
- **Hours**: Trains run from 5:47 AM to 1:30 AM

### How to Buy Tickets
1. Purchase a Viva Viagem card at any train station (€0.50)
2. Load it with zapping credit or buy a day pass
3. A return ticket to Sintra costs around €4.60

### Pro Tips
- Buy your return ticket when you arrive to avoid queues later
- Rossio Station is also accessible from Oriente or Santa Apolónia
- The train can get crowded in summer - consider traveling early

## By Car

Driving to Sintra gives you flexibility but comes with challenges.

### Route
- Take the IC19 highway from Lisbon
- Journey time: 30-45 minutes depending on traffic
- Be prepared for narrow, winding roads in Sintra's historic center

### Parking Challenges
- Very limited parking near major attractions
- Paid parking lots fill up quickly in summer
- Consider parking at the train station and using local transport

## By Organized Tour

Many companies offer day tours from Lisbon including:
- Transportation to/from your hotel
- Skip-the-line tickets to attractions
- Guided commentary
- Typically cost €50-80 per person

## Once You Arrive in Sintra

After reaching Sintra train station, you have several options:

1. **Go Sintra Day Pass** (Recommended)
   - Hop-on/hop-off service with guaranteed seating
   - Unlimited rides between all major attractions
   - Small vehicles (2-6 passengers) for a personalized experience
   - Departures every 10-15 minutes

2. **Bus 434**
   - Tourist bus connecting main attractions
   - Can get very crowded
   - Long wait times during peak season

3. **Walking**
   - The town center is walkable
   - Attractions are on steep hills - not recommended for those with mobility issues

## Best Time to Travel

- **Early Morning**: Trains at 8-9 AM are less crowded
- **Weekdays**: Quieter than weekends
- **Off-Season**: October to April sees fewer crowds

## Return Journey

Plan to catch your return train by 6-7 PM to avoid rush hour crowds. Evening trains can be packed with day-trippers returning to Lisbon.`,
    author: "Go Sintra Team",
    publishDate: "2025-10-15",
    lastModified: "2025-10-15",
    featuredImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200",
    category: "getting-there",
    tags: ["transportation", "train", "lisbon", "travel-tips"],
    isPublished: true,
    readTimeMinutes: 5,
    faqs: [
      {
        question: "How much does the train from Lisbon to Sintra cost?",
        answer: "A one-way train ticket from Lisbon to Sintra costs approximately €2.30 with a Viva Viagem card. A return ticket costs around €4.60 total."
      },
      {
        question: "How long does the train take from Lisbon to Sintra?",
        answer: "The train journey from Lisbon Rossio station to Sintra takes approximately 40 minutes."
      },
      {
        question: "How often do trains run to Sintra?",
        answer: "Trains run every 15-20 minutes during the day from Rossio station in Lisbon."
      },
      {
        question: "Should I drive or take the train to Sintra?",
        answer: "Taking the train is highly recommended. Parking in Sintra is very limited and expensive, while the train is affordable, frequent, and stress-free."
      }
    ],
    seo: {
      title: "How to Get to Sintra from Lisbon - Complete Transportation Guide 2025",
      description: "Complete guide to traveling from Lisbon to Sintra by train, car, or tour. Includes schedules, costs, and insider tips for the best experience.",
      keywords: "Sintra transportation, Lisbon to Sintra train, how to get to Sintra, Sintra travel guide"
    }
  },
  {
    id: "planning-your-perfect-day",
    title: "Planning Your Perfect Day in Sintra",
    slug: "planning-your-perfect-day",
    excerpt: "Expert advice on how to plan an unforgettable day in Sintra. Learn which attractions to visit, the best order to see them, and how to maximize your time.",
    content: `# Planning Your Perfect Day in Sintra

Sintra has so much to offer that trying to see everything in one day can be overwhelming. Here's how to plan the perfect day based on your interests and energy level.

## Best Times to Visit

### By Season
- **Spring (March-May)**: Beautiful gardens in bloom, mild weather
- **Summer (June-August)**: Warmest weather but most crowded
- **Fall (September-November)**: Perfect weather, fewer crowds, fall colors
- **Winter (December-February)**: Quietest period, but some attractions have shorter hours

### By Day of Week
- **Weekdays**: Much quieter than weekends
- **Mondays**: Some attractions closed - check before visiting
- **Peak Times**: 11 AM - 3 PM are the busiest hours

## Sample Itineraries

### The Classic (Full Day)

**8:30 AM** - Arrive in Sintra via early train  
**9:00 AM** - Start with Quinta da Regaleira (before crowds arrive)  
**11:30 AM** - Visit Sintra National Palace in the town center  
**1:00 PM** - Lunch in the historic center  
**2:30 PM** - Pena Palace (the main attraction)  
**5:00 PM** - Quick stop at Moorish Castle for sunset views  
**6:30 PM** - Return to train station

### The Highlights (Half Day)

**9:00 AM** - Arrive in Sintra  
**9:30 AM** - Pena Palace (arrive early!)  
**12:00 PM** - Quinta da Regaleira  
**2:30 PM** - Explore Sintra town center  
**3:30 PM** - Return to Lisbon

### The Hidden Gems

**9:00 AM** - Monserrate Palace (peaceful and beautiful)  
**11:30 AM** - Lunch at a local restaurant  
**1:00 PM** - Quinta da Regaleira  
**3:30 PM** - Sintra town center and Sintra National Palace  
**5:00 PM** - Depart

## Essential Tips

### Book in Advance
- Purchase attraction tickets online to skip long queues
- Book your Go Sintra day pass the day before
- Popular time slots (10 AM - 2 PM) sell out quickly

### What to Bring
- **Comfortable shoes**: You'll be walking on hills and stairs
- **Water**: Stay hydrated, especially in summer
- **Sunscreen**: Even on cloudy days
- **Light jacket**: Weather can change quickly
- **Snacks**: Food options are limited at some attractions

### Time Management
- Allow 2-3 hours per palace
- Don't try to see everything - quality over quantity
- Build in buffer time for transportation between sites

## Transportation Between Attractions

Sintra's attractions are spread across steep hills. Options include:

1. **Go Sintra Hop-On/Hop-Off**
   - Most convenient and comfortable
   - No waiting or crowding
   - Includes all major attractions

2. **Walking**
   - Only practical in the town center
   - Hills are very steep

3. **Taxi/Uber**
   - Can be expensive
   - Not always readily available

## Dining Recommendations

### Lunch Options
- **Casa Piriquita**: Famous for travesseiros pastries
- **Tascantiga**: Traditional Portuguese tapas
- **Incomum**: Modern Portuguese cuisine

### Quick Bites
- Multiple cafés in the historic center
- Food trucks near Pena Palace (seasonal)

## Budget Planning

### Typical Day Trip Costs
- **Transport**: €5-10 (train from Lisbon)
- **Day Pass**: €25-30 per person
- **Attraction Tickets**: €30-50 total
- **Meals**: €20-40
- **Total**: €80-130 per person

### Money-Saving Tips
- Bring lunch from Lisbon
- Visit free viewpoints instead of all palaces
- Use the Go Sintra pass for unlimited transport
- Book combined tickets online for discounts

## Common Mistakes to Avoid

❌ **Starting at Pena Palace**: It gets very crowded mid-day  
✅ **Start early** at less popular sites

❌ **Not booking tickets in advance**: Long queues waste precious time  
✅ **Book everything online** the day before

❌ **Trying to see everything**: Leads to rushing and exhaustion  
✅ **Pick 3-4 attractions** and enjoy them fully

❌ **Wearing inappropriate shoes**: Flip-flops or heels  
✅ **Wear comfortable walking shoes**

## Weather Considerations

Sintra has its own microclimate - often cooler and foggier than Lisbon.

- **Check the forecast** the day before
- **Bring layers** - mornings can be cool
- **Don't skip on cloudy days** - Sintra is beautiful in fog

## Final Tips

1. **Start early** - First entries get the best experience
2. **Be flexible** - Adjust plans based on crowds and weather
3. **Take your time** - Sintra is meant to be savored, not rushed
4. **Stay hydrated** - Especially when climbing hills
5. **Take photos** - But also put the camera down to enjoy the moment

With proper planning, your day in Sintra will be one of the highlights of your Portugal trip!`,
    author: "Go Sintra Team",
    publishDate: "2025-10-14",
    lastModified: "2025-10-14",
    featuredImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200",
    category: "planning",
    tags: ["itinerary", "planning", "day-trip", "travel-tips"],
    isPublished: true,
    readTimeMinutes: 8,
    faqs: [
      {
        question: "How many days do you need in Sintra?",
        answer: "One full day is enough to see the main highlights of Sintra. However, if you want to visit all the palaces and gardens at a leisurely pace, 2 days would be ideal."
      },
      {
        question: "What is the best time to visit Sintra?",
        answer: "The best time to visit Sintra is during spring (March-May) or fall (September-November) for pleasant weather and fewer crowds. Arrive early in the morning (before 10 AM) to avoid peak crowds."
      },
      {
        question: "Can you see all of Sintra in one day?",
        answer: "While you can visit 3-4 major attractions in one day, it's not recommended to try to see everything. Focus on quality over quantity - pick your must-see sites and enjoy them fully."
      },
      {
        question: "How much does a day trip to Sintra cost?",
        answer: "A typical day trip to Sintra costs €80-130 per person, including train tickets (€5-10), day pass (€25-30), attraction tickets (€30-50), and meals (€20-40)."
      }
    ],
    seo: {
      title: "Planning Your Perfect Day in Sintra - Complete Itinerary Guide 2025",
      description: "Expert guide to planning an unforgettable day in Sintra. Includes sample itineraries, timing tips, and insider advice to make the most of your visit.",
      keywords: "Sintra itinerary, plan Sintra day trip, Sintra planning guide, what to see in Sintra"
    }
  },
  {
    id: "pena-palace-complete-guide",
    title: "Pena Palace: The Complete Visitor's Guide",
    slug: "pena-palace-complete-guide",
    excerpt: "Everything you need to know about visiting Pena Palace, Sintra's most iconic attraction. Includes history, tips, and how to avoid the crowds.",
    content: `# Pena Palace: The Complete Visitor's Guide

Pena Palace is the crown jewel of Sintra and one of Portugal's most visited attractions. This comprehensive guide will help you make the most of your visit.

## History & Architecture

Built in the 19th century on the ruins of an old monastery, Pena Palace was commissioned by King Ferdinand II as a summer residence for the Portuguese royal family. The palace is a masterpiece of Romantic architecture, combining:

- **Moorish elements**: Decorative tiles and arches
- **Gothic Revival**: Pointed arches and vaulted ceilings  
- **Manueline style**: Ornate carved details
- **Renaissance influences**: Harmonious proportions

The result is a whimsical fairy-tale castle painted in vibrant yellows and reds, perched atop a hill with breathtaking views.

## Ticket Options

### Palace & Park Ticket (€14)
- Full access to palace interior
- Access to all gardens and terraces
- Recommended for first-time visitors

### Park Only Ticket (€8)
- Access to the gardens and exterior
- Perfect if you've seen the interior before
- Great for photographers

### Combined Tickets
Many visitors buy combined tickets online for:
- Pena Palace + Moorish Castle
- Pena Palace + Quinta da Regaleira
- Discounts available for 2+ attractions

## Best Time to Visit

### Avoid the Crowds
- **Arrive at opening (9:30 AM)**: First 1-2 hours are quietest
- **Late afternoon (after 4 PM)**: Crowds thin out
- **Off-season (November-March)**: Much quieter but shorter hours
- **Weekdays**: Always better than weekends

### Peak Times to Avoid
- **10 AM - 3 PM**: Busiest hours
- **Summer weekends**: Expect long queues
- **Portuguese holidays**: Extra crowded

## Getting There

### From Sintra Train Station

**Option 1: Go Sintra Day Pass**
- Most comfortable option
- Guaranteed seating
- Departures every 10-15 minutes
- Hop-on/hop-off flexibility

**Option 2: Bus 434**
- Tourist bus route
- Often very crowded
- Long waits during peak season

**Option 3: Walking**
- About 3.5 km uphill
- Very steep - only for the fit
- Takes 45-60 minutes

### Parking
- Limited parking near the entrance
- Fills up by 10 AM in summer
- Park at train station and take transport

## What to See

### The Palace Interior

Allow 1-1.5 hours to explore:

1. **Reception Rooms**: Ornate decoration and period furniture
2. **Royal Chambers**: Original bedroom furnishings
3. **Kitchen**: Massive copper cookware on display
4. **Chapel**: Beautiful religious art
5. **Terraces**: Stunning panoramic views

**Photography**: Allowed in most areas (no flash)

### The Gardens

Allow 1-2 hours to explore:

- **Exotic trees**: Over 500 species from around the world
- **Walking paths**: Wind through romantic landscapes
- **Viewpoints**: Several spectacular overlooks
- **Queen's Fern Garden**: Hidden gem with tropical plants
- **Valley of the Lakes**: Peaceful water features

### The Terraces

Don't miss:
- **Main Terrace**: 360° views over Sintra and the ocean
- **Queen's Terrace**: More intimate viewpoint
- **Clock Tower**: Iconic photo opportunity

## Insider Tips

### Beat the Queues
1. **Buy tickets online** the day before
2. **Arrive before 10 AM** or after 4 PM
3. **Visit on a weekday** if possible
4. **Skip holidays** and summer weekends

### What to Bring
- **Comfortable walking shoes**: Lots of stairs
- **Water bottle**: Stay hydrated
- **Light jacket**: Can be windy and cool
- **Camera**: Incredibly photogenic
- **Sunscreen**: Limited shade in summer

### Physical Requirements
- **Lots of walking**: Expect 2+ km inside the complex
- **Many stairs**: Throughout palace and gardens
- **Steep hills**: Between different areas
- **Not wheelchair accessible**: Most areas have steps

## Photography Tips

### Best Photo Spots
1. **Main entrance**: Classic palace view
2. **Terrace**: Panoramic shots
3. **Gardens**: Framing palace through trees
4. **Clock tower**: Iconic detail shot
5. **From Moorish Castle**: Palace from distance

### Best Lighting
- **Morning (9-11 AM)**: Soft light on facade
- **Late afternoon**: Golden hour glow
- **Foggy days**: Mysterious, dramatic shots

## Combining with Other Attractions

### Same Day Combos

**Easy Combo** (Adjacent)
- Pena Palace + Moorish Castle (next to each other)

**Classic Combo**
- Pena Palace → Quinta da Regaleira → Sintra town

**Full Day**
- Pena Palace → Moorish Castle → Monserrate → Town center

## Food & Facilities

### On-Site
- **Café**: Basic drinks and snacks
- **Restrooms**: Available near entrance
- **Gift shop**: Souvenirs and books

### Nearby Options
- Several cafés at park entrance
- Better restaurants in Sintra town center

## Common Questions

**How long should I spend here?**
- Minimum: 2 hours
- Recommended: 3-4 hours
- With gardens: 4-5 hours

**Is it worth the hype?**
Yes! It's Portugal's most iconic palace for a reason.

**Can I visit just the park?**
Yes, the park-only ticket is €8.

**Is there a dress code?**
No, but wear comfortable clothes and walking shoes.

**Can I bring a backpack?**
Yes, but large bags may need to be checked.

## Weather Considerations

Pena Palace sits at 500m elevation with its own microclimate:
- **Often cooler** than Lisbon (bring a jacket)
- **Frequently foggy** in morning (clears by midday)
- **Can be windy** on the terraces
- **Check forecast** before visiting

## Final Tips

1. **Book tickets in advance** - Skip the queue
2. **Start early** - Best experience before crowds
3. **Allow 3+ hours** - Don't rush this visit
4. **Explore the gardens** - Often overlooked but beautiful
5. **Visit the terrace** - Best views in Sintra

Pena Palace is truly magical and deserves a leisurely visit. Take your time, soak in the atmosphere, and enjoy this fairy-tale masterpiece!`,
    author: "Go Sintra Team",
    publishDate: "2025-10-13",
    lastModified: "2025-10-13",
    featuredImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200",
    category: "attractions",
    tags: ["pena-palace", "attractions", "guide", "history"],
    isPublished: true,
    readTimeMinutes: 10,
    seo: {
      title: "Pena Palace Complete Guide - Tips, Tickets & History 2025",
      description: "Everything you need to know about visiting Pena Palace in Sintra. Includes history, ticket options, timing tips, and insider advice.",
      keywords: "Pena Palace, Sintra palace, Pena Palace tickets, visit Pena Palace, Sintra attractions"
    }
  }
];

// Storage functions
export function saveArticles(articles: BlogArticle[]): void {
  localStorage.setItem("blog-articles", JSON.stringify(articles));
}

export function loadArticles(): BlogArticle[] {
  const saved = localStorage.getItem("blog-articles");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing saved articles:", error);
      return DEFAULT_ARTICLES;
    }
  }
  return DEFAULT_ARTICLES;
}

export function saveCategories(categories: BlogCategory[]): void {
  localStorage.setItem("blog-categories", JSON.stringify(categories));
}

export function loadCategories(): BlogCategory[] {
  const saved = localStorage.getItem("blog-categories");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Error parsing saved categories:", error);
      return DEFAULT_CATEGORIES;
    }
  }
  return DEFAULT_CATEGORIES;
}

// Helper functions
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  const articles = loadArticles();
  return articles.find(article => article.slug === slug);
}

export function getPublishedArticles(): BlogArticle[] {
  return loadArticles().filter(article => article.isPublished);
}

export function getArticlesByCategory(categorySlug: string): BlogArticle[] {
  return getPublishedArticles().filter(article => article.category === categorySlug);
}

export function searchArticles(query: string): BlogArticle[] {
  const lowerQuery = query.toLowerCase();
  return getPublishedArticles().filter(article => 
    article.title.toLowerCase().includes(lowerQuery) ||
    article.excerpt.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
