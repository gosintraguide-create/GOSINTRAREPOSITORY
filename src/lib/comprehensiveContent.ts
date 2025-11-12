// Comprehensive Content Management System
// This file defines ALL editable content across the entire website

export interface ComprehensiveContent {
  // Company/Brand Information
  company: {
    name: string;
    email: string;
    phone: string;
    location: string;
    operatingHours: string;
    whatsappNumber: string;
  };

  // Navigation & Header
  navigation: {
    home: string;
    howItWorks: string;
    attractions: string;
    buyTicket: string;
    about: string;
    manageBooking: string;
    requestPickup: string;
  };

  // Homepage
  homepage: {
    hero: {
      title: string;
      subtitle: string;
      ctaButton: string;
      benefitPills: Array<{ icon: string; text: string }>;
      heroImage?: string;
      explainerImage?: string;
    };
    quickLinks: {
      title: string;
      subtitle: string;
      attractions: { title: string; subtitle: string };
      travelGuide: { title: string; subtitle: string };
      privateTours: { title: string; subtitle: string };
    };
    whyChoose: {
      title: string;
      subtitle: string;
    };
    features: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    serviceHighlights: {
      title: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    callToAction: {
      title: string;
      description: string;
      buttonText: string;
    };
  };

  // How It Works Page
  howItWorks: {
    hero: {
      title: string;
      subtitle: string;
      pills: Array<{ icon: string; text: string }>;
    };
    steps: Array<{
      number: number;
      icon: string;
      title: string;
      description: string;
    }>;
    whatMakesUsSpecial: {
      title: string;
      subtitle: string;
      features: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    frequentlyAskedQuestions: {
      title: string;
      subtitle: string;
      questions: Array<{
        question: string;
        answer: string;
      }>;
    };
    callToAction: {
      title: string;
      description: string;
      buttonText: string;
    };
  };

  // Attractions Page
  attractions: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
    };
    listingIntro: {
      title: string;
      description: string;
    };
    attractionDetails: {
      [key: string]: {
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
      };
    };
    attractionDetailPage: {
      backButton: string;
      openingHours: string;
      duration: string;
      ticketPrice: string;
      parkOnly: string;
      fullAccess: string;
      highlightsTitle: string;
      tipsTitle: string;
      buyTicketButton: string;
      includedInPass: string;
    };
  };

  // Buy Ticket Page
  buyTicket: {
    hero: {
      title: string;
      subtitle: string;
    };
    steps: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
    };
    dateSelection: {
      title: string;
      selectDate: string;
      selectTime: string;
      guidedTourLabel: string;
      guidedTourDescription: string;
      continueButton: string;
    };
    passengersSelection: {
      title: string;
      numberOfPasses: string;
      contactInfo: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      confirmEmail: string;
      confirmEmailPlaceholder: string;
      emailMismatch: string;
      pickupLocation: string;
      pickupLocationDescription: string;
      continueButton: string;
      backButton: string;
    };
    attractionsSelection: {
      title: string;
      subtitle: string;
      skipTickets: string;
      optionalTickets: string;
      continueButton: string;
      backButton: string;
    };
    payment: {
      title: string;
      orderSummary: string;
      dayPass: string;
      passes: string;
      guidedCommentary: string;
      attractionTickets: string;
      subtotal: string;
      total: string;
      cardDetails: string;
      processing: string;
      backButton: string;
      payNowButton: string;
    };
    pricingLabels: {
      basePrice: string;
      guidedTourSurcharge: string;
      perPerson: string;
      perPass: string;
    };
  };

  // Manage Booking Page
  manageBooking: {
    hero: {
      title: string;
      subtitle: string;
    };
    loginSection: {
      title: string;
      description: string;
      bookingIdLabel: string;
      bookingIdPlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      loginButton: string;
      notFound: string;
    };
    bookingDetails: {
      title: string;
      bookingId: string;
      date: string;
      time: string;
      passengers: string;
      pickupLocation: string;
      status: string;
      downloadTickets: string;
      printTickets: string;
      requestPickup: string;
      logoutButton: string;
    };
    tickets: {
      title: string;
      description: string;
      yourPasses: string;
      attractionTickets: string;
      showQR: string;
      validFor: string;
    };
  };

  // Request Pickup Page
  requestPickup: {
    hero: {
      title: string;
      subtitle: string;
    };
    form: {
      title: string;
      description: string;
      bookingIdLabel: string;
      bookingIdPlaceholder: string;
      currentLocationLabel: string;
      currentLocationPlaceholder: string;
      useMyLocation: string;
      notesLabel: string;
      notesPlaceholder: string;
      requestButton: string;
      requestingButton: string;
    };
    confirmation: {
      title: string;
      description: string;
      estimatedArrival: string;
      trackingTitle: string;
      cancelRequest: string;
      newRequest: string;
    };
    howItWorks: {
      title: string;
      steps: Array<{
        title: string;
        description: string;
      }>;
    };
  };

  // About Page
  about: {
    hero: {
      title: string;
      subtitle: string;
    };
    ourStory: {
      title: string;
      paragraphs: string[];
    };
    mission: {
      title: string;
      description: string;
    };
    values: {
      title: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    contact: {
      title: string;
      subtitle: string;
      getInTouch: string;
      phone: string;
      email: string;
      whatsapp: string;
      location: string;
      hours: string;
      sendMessage: string;
      formLabels: {
        name: string;
        namePlaceholder: string;
        email: string;
        emailPlaceholder: string;
        subject: string;
        subjectPlaceholder: string;
        message: string;
        messagePlaceholder: string;
        sendButton: string;
        sending: string;
      };
    };
  };

  // Operations Page (Driver Portal)
  operations: {
    hero: {
      title: string;
      subtitle: string;
    };
    login: {
      title: string;
      description: string;
      pinLabel: string;
      pinPlaceholder: string;
      loginButton: string;
      invalidPin: string;
    };
    dashboard: {
      title: string;
      refreshButton: string;
      logoutButton: string;
      todaysBookings: string;
      activePickupRequests: string;
      completedToday: string;
      noBookings: string;
      noRequests: string;
    };
    bookingCard: {
      bookingId: string;
      time: string;
      passengers: string;
      location: string;
      status: string;
      viewQR: string;
      markComplete: string;
    };
    pickupRequest: {
      requestId: string;
      time: string;
      location: string;
      notes: string;
      accept: string;
      complete: string;
      estimatedArrival: string;
    };
  };

  // Footer
  footer: {
    quickLinks: {
      title: string;
      home: string;
      howItWorks: string;
      attractions: string;
      buyTicket: string;
      about: string;
      manageBooking: string;
    };
    contactInfo: {
      title: string;
      phone: string;
      email: string;
      location: string;
      hours: string;
    };
    legal: {
      title: string;
      privacy: string;
      terms: string;
      cookies: string;
    };
    social: {
      title: string;
      followUs: string;
    };
    copyright: string;
  };

  // Common UI Elements
  common: {
    buttons: {
      bookNow: string;
      learnMore: string;
      getStarted: string;
      viewDetails: string;
      close: string;
      submit: string;
      cancel: string;
      save: string;
      delete: string;
      edit: string;
      confirm: string;
      continue: string;
      back: string;
      download: string;
      print: string;
      share: string;
    };
    labels: {
      loading: string;
      error: string;
      success: string;
      warning: string;
      required: string;
      optional: string;
      perPerson: string;
      perPass: string;
      total: string;
      subtotal: string;
      date: string;
      time: string;
      status: string;
    };
    messages: {
      successGeneric: string;
      errorGeneric: string;
      loadingGeneric: string;
      noDataAvailable: string;
      comingSoon: string;
    };
  };

  // Live Chat
  liveChat: {
    buttonText: string;
    title: string;
    subtitle: string;
    whatsappButton: string;
    placeholder: string;
    offlineMessage: string;
  };

  // SEO Content
  seo: {
    home: { title: string; description: string; keywords: string };
    howItWorks: { title: string; description: string; keywords: string };
    attractions: { title: string; description: string; keywords: string };
    buyTicket: { title: string; description: string; keywords: string };
    about: { title: string; description: string; keywords: string };
    manageBooking: { title: string; description: string; keywords: string };
    requestPickup: { title: string; description: string; keywords: string };
  };
}

// Default English Content
export const DEFAULT_COMPREHENSIVE_CONTENT: ComprehensiveContent = {
  company: {
    name: "Go Sintra",
    email: "info@gosintra.com",
    phone: "+351 932 967 279",
    location: "Sintra, Portugal",
    operatingHours: "9 AM - 8 PM Daily",
    whatsappNumber: "+351932967279",
  },

  navigation: {
    home: "Home",
    howItWorks: "How It Works",
    attractions: "Attractions",
    buyTicket: "Buy Day Pass",
    about: "About & Contact",
    manageBooking: "My Booking",
    requestPickup: "Request Pickup",
  },

  homepage: {
    hero: {
      title: "Discover Sintra Your Way",
      subtitle: "Hop-on, hop-off day pass with guaranteed seats. Unlimited rides in small tuk tuks and vintage jeeps. New departure every 10-15 minutes.",
      ctaButton: "Book Your Day Pass",
      benefitPills: [
        { icon: "Users", text: "Small Groups (2-6)" },
        { icon: "Clock", text: "Every 10-15 Min" },
        { icon: "MapPin", text: "All Attractions" },
        { icon: "Smartphone", text: "Request Pickups" },
      ],
      heroImage: "https://images.unsplash.com/photo-1704312230001-8d9adfc76d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWslMjB0dWslMjBzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MjM2MTE4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      explainerImage: "https://images.unsplash.com/photo-1730911454981-545ef4ebdef9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwZW5hJTIwcGFsYWNlJTIwc2NlbmljJTIwdmlld3xlbnwxfHx8fDE3NjIzNjExODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    quickLinks: {
      title: "Explore More",
      subtitle: "Discover attractions, tips, and personalized tours",
      attractions: { title: "Explore Attractions", subtitle: "UNESCO sites & palaces" },
      travelGuide: { title: "Travel Guide", subtitle: "Tips & local secrets" },
      privateTours: { title: "Prefer a Private Tour?", subtitle: "Exclusive personalized experience" },
    },
    whyChoose: {
      title: "Why Choose Go Sintra?",
      subtitle: "Skip the crowded tour buses and experience Sintra the way it's meant to be discovered",
    },
    features: [
      {
        title: "Guaranteed Seating",
        description: "Every passenger has a confirmed seat. No standing, no waiting for space. Book online and your spot is secured.",
        icon: "Armchair",
      },
      {
        title: "Ultimate Flexibility",
        description: "Hop off at any attraction, explore at your own pace, then catch the next ride in 10-15 minutes. Your schedule, your adventure.",
        icon: "RefreshCw",
      },
      {
        title: "Small Intimate Vehicles",
        description: "Travel in tuk tuks and vintage UMM jeeps with only 2-6 passengers. Personal, comfortable, and uniquely Sintra.",
        icon: "Car",
      },
      {
        title: "All Day Access",
        description: "One pass gives you unlimited rides from 9 AM to 8 PM. Visit every attraction or just your favorites—it's up to you.",
        icon: "Clock",
      },
      {
        title: "Regular Departures",
        description: "New vehicles depart every 10-15 minutes throughout the day. No rigid schedules, just consistent service when you need it.",
        icon: "Calendar",
      },
      {
        title: "Expert Local Drivers",
        description: "Our drivers know every hidden corner of Sintra. Get insider tips and recommendations you won't find in guidebooks.",
        icon: "MapPin",
      },
    ],
    serviceHighlights: {
      title: "How It Works",
      items: [
        {
          title: "Book Online in Minutes",
          description: "Simple booking process with instant confirmation. Your QR code tickets are sent immediately to your email.",
          icon: "Ticket",
        },
        {
          title: "Hop On Anywhere",
          description: "Start your adventure at any of our stops. Just show your QR code and you're on board.",
          icon: "MapPin",
        },
        {
          title: "Explore All Day",
          description: "Unlimited rides from 9 AM to 8 PM. Visit every palace, castle, and garden at your own pace.",
          icon: "Compass",
        },
      ],
    },
    callToAction: {
      title: "Ready to Explore Sintra?",
      description: "Book your flexible day pass now and discover why thousands of visitors choose Go Sintra for their Sintra adventure.",
      buttonText: "Book Your Day Pass Now",
    },
  },

  howItWorks: {
    hero: {
      title: "How It Works",
      subtitle: "Three simple steps to start your Sintra sightseeing adventure",
      pills: [
        { icon: "Clock", text: "3 Easy Steps" },
        { icon: "CheckCircle", text: "Instant Booking" },
        { icon: "MapPin", text: "Hop-On/Hop-Off" },
      ],
    },
    steps: [
      {
        number: 1,
        icon: "Ticket",
        title: "Book Your Day Pass",
        description: "Purchase your full day pass in minutes. Select your preferred date and optional guided commentary time. Instant confirmation sent to your email.",
      },
      {
        number: 2,
        icon: "MapPin",
        title: "Receive Your Ticket",
        description: "Get your unique QR code via email immediately after booking. Save it to your phone for easy access throughout your sightseeing adventure.",
      },
      {
        number: 3,
        icon: "Car",
        title: "Start Your Adventure",
        description: "Show your QR code to board at any stop. With service every 10-15 minutes, you're always moments away from discovering Sintra's next treasure.",
      },
    ],
    whatMakesUsSpecial: {
      title: "What Makes Us Special",
      subtitle: "Intimate sightseeing experiences designed for discovery and comfort",
      features: [
        {
          title: "Small Group Experience",
          description: "Experience Sintra in intimate groups of 2-6 guests. No crowded buses—just personalized sightseeing adventures.",
          icon: "Users",
        },
        {
          title: "Frequent Departures",
          description: "New vehicles every 10-15 minutes from 9 AM to 8 PM. Never wait long, never feel rushed. Total flexibility.",
          icon: "Clock",
        },
        {
          title: "All Major Attractions",
          description: "Access every must-see site in Sintra with one convenient pass. Pena Palace, Quinta da Regaleira, and more.",
          icon: "Star",
        },
        {
          title: "Guaranteed Comfort",
          description: "Every booking includes a guaranteed seat. No overcrowding, no standing room only—just comfortable sightseeing.",
          icon: "Armchair",
        },
        {
          title: "Flexible Schedule",
          description: "Spend 5 minutes or 5 hours at each attraction. Hop off and hop back on whenever you're ready. Complete freedom.",
          icon: "RefreshCw",
        },
        {
          title: "Bundle & Save",
          description: "Add attraction tickets during booking for discounted rates. Skip the ticket lines at busy palaces and gardens.",
          icon: "Ticket",
        },
      ],
    },
    frequentlyAskedQuestions: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about your Go Sintra day pass",
      questions: [
        {
          question: "How does the day pass work?",
          answer: "Your day pass gives you unlimited rides in our small vehicles (tuk tuks and vintage jeeps) from 9 AM to 8 PM on your selected date. You can hop on and off at any of our stops as many times as you like throughout the day.",
        },
        {
          question: "How often do vehicles depart?",
          answer: "We have new departures every 10-15 minutes during operating hours. This means you'll never wait long to catch your next ride to a different attraction.",
        },
        {
          question: "How many people fit in each vehicle?",
          answer: "Our vehicles carry small groups of 2-6 passengers. This intimate size ensures a comfortable, personal experience unlike crowded tour buses.",
        },
        {
          question: "Do I need to book a specific time?",
          answer: "You only need to select your starting time slot for initial pickup. After that, you can hop on and off freely throughout the day. The pass is valid until 8 PM regardless of your start time.",
        },
        {
          question: "What if I want guided commentary?",
          answer: "We offer optional guided commentary at select time slots (10:00 AM and 2:00 PM) for a small surcharge. This includes detailed information about Sintra's history and attractions from our expert drivers.",
        },
        {
          question: "Can I add attraction tickets to my booking?",
          answer: "Yes! During the booking process, you can add tickets to popular attractions like Pena Palace, Quinta da Regaleira, and more. Bundling saves time and often money compared to buying at the door.",
        },
        {
          question: "What happens if I miss my start time?",
          answer: "No problem! Just board at the next available departure. Your pass is valid all day (9 AM - 8 PM), not just for a specific time slot.",
        },
        {
          question: "Is the service suitable for families with children?",
          answer: "Absolutely! Families love our service. Children under 4 ride free when accompanied by an adult. Our small vehicles and flexible schedule make it perfect for families who want to explore at their own pace.",
        },
      ],
    },
    callToAction: {
      title: "Ready to Start Your Adventure?",
      description: "Book your flexible day pass now and experience Sintra the way it should be seen—on your schedule, in comfort.",
      buttonText: "Book Your Day Pass",
    },
  },

  attractions: {
    hero: {
      title: "Discover Sintra's Treasures",
      subtitle: "Explore UNESCO World Heritage Sites with Your Day Pass",
      description: "Your Go Sintra day pass gives you access to all these magnificent attractions. Hop on and off as you please, spending as much time as you'd like at each location.",
    },
    listingIntro: {
      title: "Where Your Day Pass Takes You",
      description: "All these incredible attractions are included in your hop-on/hop-off route. Visit as many as you like in a single day.",
    },
    attractionDetails: {
      "pena-palace": {
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
          "Wear comfortable shoes - lots of walking and hills",
          "Don't miss the palace terrace for the best views",
          "Visit the park before or after touring the palace",
        ],
        price: 14,
        parkOnlyPrice: 8,
      },
      "quinta-regaleira": {
        name: "Quinta da Regaleira",
        shortDescription: "A mystical estate featuring enigmatic gardens, underground tunnels, and the famous Initiation Well. This UNESCO World Heritage site is a masterpiece of symbolic and philosophical architecture.",
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
        shortDescription: "Ancient fortress walls snake along mountain ridges, offering spectacular panoramic views. Built by the Moors in the 8th-9th centuries, this castle is a testament to medieval military architecture.",
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
        shortDescription: "An exotic palace blending Gothic, Indian, and Moorish influences, set within one of the most beautiful botanical gardens in Portugal with rare and exotic plant species from around the world.",
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
        shortDescription: "Located in the heart of Sintra's historic center, this is the best-preserved medieval royal palace in Portugal, famous for its distinctive twin chimneys and magnificent tile work.",
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
    attractionDetailPage: {
      backButton: "Back to Attractions",
      openingHours: "Opening Hours",
      duration: "Recommended Duration",
      ticketPrice: "Ticket Price",
      parkOnly: "Park Only",
      fullAccess: "Palace & Park",
      highlightsTitle: "Highlights",
      tipsTitle: "Visitor Tips",
      buyTicketButton: "Buy Attraction Ticket",
      includedInPass: "Included in Your Day Pass Route",
    },
  },

  buyTicket: {
    hero: {
      title: "Book Your Day Pass",
      subtitle: "Get instant confirmation and start exploring Sintra with complete flexibility",
    },
    steps: {
      step1: "Date & Time",
      step2: "Passengers",
      step3: "Add Tickets",
      step4: "Payment",
    },
    dateSelection: {
      title: "Select Your Date & Time",
      selectDate: "Select Date",
      selectTime: "Preferred Start Time",
      guidedTourLabel: "Guided Commentary",
      guidedTourDescription: "Add expert guided commentary to your experience",
      continueButton: "Continue to Passenger Details",
    },
    passengersSelection: {
      title: "Passenger Information",
      numberOfPasses: "Number of Day Passes",
      contactInfo: "Contact Information",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email Address",
      emailPlaceholder: "your@email.com",
      confirmEmail: "Confirm Email",
      confirmEmailPlaceholder: "Confirm your email address",
      emailMismatch: "Email addresses do not match",
      pickupLocation: "Preferred Starting Location",
      pickupLocationDescription: "Where would you like to begin your adventure?",
      continueButton: "Continue to Add Tickets",
      backButton: "Back",
    },
    attractionsSelection: {
      title: "Add Attraction Tickets",
      subtitle: "Bundle attraction tickets with your day pass and save time at each location",
      skipTickets: "Skip - I'll buy tickets separately",
      optionalTickets: "Optional - Add attraction tickets to your booking",
      continueButton: "Continue to Payment",
      backButton: "Back",
    },
    payment: {
      title: "Payment Details",
      orderSummary: "Order Summary",
      dayPass: "Go Sintra Day Pass",
      passes: "passes",
      guidedCommentary: "Guided Commentary",
      attractionTickets: "Attraction Tickets",
      subtotal: "Subtotal",
      total: "Total",
      cardDetails: "Card Details",
      processing: "Processing payment...",
      backButton: "Back",
      payNowButton: "Pay Now",
    },
    pricingLabels: {
      basePrice: "Day Pass",
      guidedTourSurcharge: "Guided Commentary Surcharge",
      perPerson: "per person",
      perPass: "per pass",
    },
  },

  manageBooking: {
    hero: {
      title: "Manage Your Booking",
      subtitle: "Access your tickets, view booking details, and request pickup service",
    },
    loginSection: {
      title: "Access Your Booking",
      description: "Enter your booking details to view your tickets and manage your reservation",
      bookingIdLabel: "Booking ID",
      bookingIdPlaceholder: "Enter your booking ID",
      emailLabel: "Email Address",
      emailPlaceholder: "Email used for booking",
      loginButton: "View My Booking",
      notFound: "Booking not found. Please check your details and try again.",
    },
    bookingDetails: {
      title: "Your Booking Details",
      bookingId: "Booking ID",
      date: "Date",
      time: "Start Time",
      passengers: "Passengers",
      pickupLocation: "Pickup Location",
      status: "Status",
      downloadTickets: "Download All Tickets",
      printTickets: "Print Tickets",
      requestPickup: "Request Pickup Now",
      logoutButton: "Logout",
    },
    tickets: {
      title: "Your Tickets",
      description: "Show these QR codes to board any Go Sintra vehicle",
      yourPasses: "Day Passes",
      attractionTickets: "Attraction Tickets",
      showQR: "Show QR Code",
      validFor: "Valid for",
    },
  },

  requestPickup: {
    hero: {
      title: "Request Pickup",
      subtitle: "Get a vehicle sent to your current location",
    },
    form: {
      title: "Request a Pickup",
      description: "Fill in your details and we'll send a vehicle to your location",
      bookingIdLabel: "Booking ID",
      bookingIdPlaceholder: "Enter your booking ID",
      currentLocationLabel: "Current Location",
      currentLocationPlaceholder: "Where are you now?",
      useMyLocation: "Use My Current Location",
      notesLabel: "Additional Notes",
      notesPlaceholder: "Any special instructions? (optional)",
      requestButton: "Request Pickup",
      requestingButton: "Requesting...",
    },
    confirmation: {
      title: "Pickup Requested!",
      description: "A vehicle is on its way to your location",
      estimatedArrival: "Estimated Arrival",
      trackingTitle: "Tracking Your Ride",
      cancelRequest: "Cancel Request",
      newRequest: "Request Another Pickup",
    },
    howItWorks: {
      title: "How Pickup Requests Work",
      steps: [
        {
          title: "Submit Your Request",
          description: "Tell us where you are and we'll alert the nearest available driver",
        },
        {
          title: "Driver Accepts",
          description: "You'll get a notification when a driver is heading your way",
        },
        {
          title: "Track in Real-Time",
          description: "See estimated arrival time and track your vehicle's progress",
        },
        {
          title: "Board & Go",
          description: "Show your QR code and continue your Sintra adventure",
        },
      ],
    },
  },

  about: {
    hero: {
      title: "About Go Sintra",
      subtitle: "Your premium hop-on/hop-off adventure through Sintra's magical landscapes",
    },
    ourStory: {
      title: "Our Story",
      paragraphs: [
        "Go Sintra was born from a simple observation: visitors to this UNESCO World Heritage site deserved better than crowded buses and rigid schedules.",
        "We created a flexible, premium alternative that combines the intimacy of small vehicles with the freedom of hop-on/hop-off convenience.",
        "Today, thousands of visitors choose Go Sintra for guaranteed seating, regular departures every 10-15 minutes, and an authentic, intimate way to explore this magical destination.",
      ],
    },
    mission: {
      title: "Our Mission",
      description: "Our mission is to provide the most convenient, comfortable, and authentic way to explore Sintra's palaces, castles, and gardens. We believe that sightseeing should be flexible, personal, and stress-free.",
    },
    values: {
      title: "What We Stand For",
      items: [
        {
          title: "Guaranteed Comfort",
          description: "Every guest has a guaranteed seat in a small, intimate vehicle. No standing, no overcrowding.",
          icon: "Shield",
        },
        {
          title: "Total Flexibility",
          description: "Hop off at any attraction, spend as long as you want, then hop back on. Your day, your pace.",
          icon: "RefreshCw",
        },
        {
          title: "Local Expertise",
          description: "Our drivers know Sintra inside and out, offering insights you won't find in guidebooks.",
          icon: "Star",
        },
      ],
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Have questions? We're here to help",
      getInTouch: "Contact Us",
      phone: "Phone",
      email: "Email",
      whatsapp: "WhatsApp",
      location: "Location",
      hours: "Hours",
      sendMessage: "Send us a Message",
      formLabels: {
        name: "Your Name",
        namePlaceholder: "Enter your name",
        email: "Your Email",
        emailPlaceholder: "your@email.com",
        subject: "Subject",
        subjectPlaceholder: "How can we help?",
        message: "Message",
        messagePlaceholder: "Tell us more about your question or concern...",
        sendButton: "Send Message",
        sending: "Sending...",
      },
    },
  },

  operations: {
    hero: {
      title: "Driver Portal",
      subtitle: "Manage bookings and pickup requests",
    },
    login: {
      title: "Driver Login",
      description: "Enter your driver PIN to access the operations dashboard",
      pinLabel: "Driver PIN",
      pinPlaceholder: "Enter your 4-digit PIN",
      loginButton: "Login",
      invalidPin: "Invalid PIN. Please try again.",
    },
    dashboard: {
      title: "Operations Dashboard",
      refreshButton: "Refresh",
      logoutButton: "Logout",
      todaysBookings: "Today's Bookings",
      activePickupRequests: "Active Pickup Requests",
      completedToday: "Completed Today",
      noBookings: "No bookings for today",
      noRequests: "No active pickup requests",
    },
    bookingCard: {
      bookingId: "Booking",
      time: "Time",
      passengers: "Passengers",
      location: "Pickup",
      status: "Status",
      viewQR: "View QR",
      markComplete: "Mark Complete",
    },
    pickupRequest: {
      requestId: "Request",
      time: "Requested",
      location: "Location",
      notes: "Notes",
      accept: "Accept",
      complete: "Complete",
      estimatedArrival: "ETA",
    },
  },

  footer: {
    quickLinks: {
      title: "Quick Links",
      home: "Home",
      howItWorks: "How It Works",
      attractions: "Attractions",
      buyTicket: "Buy Day Pass",
      about: "About Us",
      manageBooking: "My Booking",
    },
    contactInfo: {
      title: "Contact Info",
      phone: "Phone",
      email: "Email",
      location: "Location",
      hours: "Operating Hours",
    },
    legal: {
      title: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
    },
    social: {
      title: "Follow Us",
      followUs: "Stay connected on social media",
    },
    copyright: "© 2025 Go Sintra. All rights reserved.",
  },

  common: {
    buttons: {
      bookNow: "Book Now",
      learnMore: "Learn More",
      getStarted: "Get Started",
      viewDetails: "View Details",
      close: "Close",
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      continue: "Continue",
      back: "Back",
      download: "Download",
      print: "Print",
      share: "Share",
    },
    labels: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      required: "Required",
      optional: "Optional",
      perPerson: "per person",
      perPass: "per pass",
      total: "Total",
      subtotal: "Subtotal",
      date: "Date",
      time: "Time",
      status: "Status",
    },
    messages: {
      successGeneric: "Success! Your action was completed.",
      errorGeneric: "Oops! Something went wrong. Please try again.",
      loadingGeneric: "Loading, please wait...",
      noDataAvailable: "No data available",
      comingSoon: "Coming soon",
    },
  },

  liveChat: {
    buttonText: "Chat with us",
    title: "Need Help?",
    subtitle: "We're here to assist you",
    whatsappButton: "Chat on WhatsApp",
    placeholder: "Type your message...",
    offlineMessage: "We're currently offline. Please leave a message and we'll get back to you soon.",
  },

  seo: {
    home: {
      title: "Go Sintra - Premium Hop-On/Hop-Off Day Pass | Small Vehicle Tours",
      description: "Explore Sintra's UNESCO World Heritage sites with guaranteed seating in small vehicles. Unlimited rides every 10-15 minutes. Book your flexible day pass online now.",
      keywords: "Sintra tours, hop on hop off Sintra, Sintra transport, small group tours Sintra, Pena Palace tours, Sintra day pass",
    },
    howItWorks: {
      title: "How It Works - Go Sintra Hop-On/Hop-Off Service",
      description: "Learn how our flexible day pass works. Book online, get your QR codes, and hop on any vehicle during operating hours. Simple and convenient.",
      keywords: "how to visit Sintra, Sintra transport guide, hop on hop off how it works, Sintra day pass guide",
    },
    attractions: {
      title: "Sintra Attractions - Palaces & Castles | Go Sintra Day Pass",
      description: "Discover Pena Palace, Quinta da Regaleira, Moorish Castle, and more. Our day pass includes unlimited transport to all major Sintra attractions.",
      keywords: "Sintra attractions, Pena Palace, Quinta da Regaleira, Moorish Castle, Monserrate Palace, Sintra National Palace",
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
    manageBooking: {
      title: "Manage Your Booking - Go Sintra",
      description: "Access your Go Sintra tickets, view booking details, and request pickup service using your booking ID and email.",
      keywords: "manage Sintra booking, view tickets, Sintra booking portal",
    },
    requestPickup: {
      title: "Request Pickup - Go Sintra",
      description: "Request a Go Sintra vehicle to your current location. Real-time tracking and estimated arrival times.",
      keywords: "request pickup Sintra, on-demand transport Sintra, Sintra ride request",
    },
  },
};

// Import API functions
import { saveComprehensiveContent as saveComprehensiveContentToAPI, getComprehensiveContent as getComprehensiveContentFromAPI } from './api';
import { translateContentToAllLanguages, translateText, translateObject, SUPPORTED_LANGUAGES } from './autoTranslate';

// Save and load functions
export function saveComprehensiveContent(content: ComprehensiveContent): void {
  localStorage.setItem("comprehensive-content", JSON.stringify(content));
  console.log("Comprehensive content saved to localStorage");
  
  // Also save to database (non-blocking)
  saveComprehensiveContentToAPI(content).catch(error => {
    console.error('Failed to save comprehensive content to database:', error);
  });
}

// Async version that waits for database save
export async function saveComprehensiveContentAsync(content: ComprehensiveContent): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to localStorage
    localStorage.setItem("comprehensive-content", JSON.stringify(content));
    console.log('💾 Saving comprehensive content to database...');
    
    // Save to database and wait for result
    const result = await saveComprehensiveContentToAPI(content);
    
    if (result.success) {
      console.log('✅ Comprehensive content saved to database successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to save comprehensive content to database:', result.error);
      return { success: false, error: result.error || 'Failed to save to database' };
    }
  } catch (error) {
    console.error('❌ Error saving comprehensive content:', error);
    return { success: false, error: String(error) };
  }
}

export function loadComprehensiveContent(): ComprehensiveContent {
  const saved = localStorage.getItem("comprehensive-content");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Deep merge with defaults to ensure all fields exist
      return deepMerge(DEFAULT_COMPREHENSIVE_CONTENT, parsed);
    } catch (error) {
      console.error("Error parsing saved content:", error);
      return DEFAULT_COMPREHENSIVE_CONTENT;
    }
  }
  return DEFAULT_COMPREHENSIVE_CONTENT;
}

// Async function to sync content from database
export async function syncComprehensiveContentFromDatabase(): Promise<ComprehensiveContent> {
  try {
    const content = await getComprehensiveContentFromAPI();
    if (content) {
      // Save to localStorage for offline access
      localStorage.setItem("comprehensive-content", JSON.stringify(content));
      console.log('✅ Synced comprehensive content from database to localStorage');
      return deepMerge(DEFAULT_COMPREHENSIVE_CONTENT, content);
    } else {
      console.log('ℹ️ No comprehensive content in database yet, using defaults or localStorage');
    }
  } catch (error) {
    console.error('Failed to sync comprehensive content from database:', error);
  }
  return loadComprehensiveContent();
}

// Deep merge utility to ensure all default fields exist
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// ===== MULTILINGUAL SUPPORT =====

/**
 * Deep compare two objects and get changed paths
 */
function getChangedPaths(oldObj: any, newObj: any, basePath: string[] = []): string[][] {
  const changedPaths: string[][] = [];
  
  // Handle different types
  if (typeof oldObj !== typeof newObj) {
    return [basePath];
  }
  
  if (typeof newObj !== 'object' || newObj === null) {
    if (oldObj !== newObj) {
      return [basePath];
    }
    return [];
  }
  
  // Handle arrays
  if (Array.isArray(newObj)) {
    if (!Array.isArray(oldObj) || oldObj.length !== newObj.length) {
      return [basePath];
    }
    
    for (let i = 0; i < newObj.length; i++) {
      changedPaths.push(...getChangedPaths(oldObj[i], newObj[i], [...basePath, String(i)]));
    }
    return changedPaths;
  }
  
  // Handle objects
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    if (!(key in oldObj)) {
      changedPaths.push([...basePath, key]);
    } else if (!(key in newObj)) {
      // Key was removed
      continue;
    } else {
      changedPaths.push(...getChangedPaths(oldObj[key], newObj[key], [...basePath, key]));
    }
  }
  
  return changedPaths;
}

/**
 * Update specific paths in an object with translated values
 */
async function updateTranslatedPaths(
  existingContent: any,
  newContent: any,
  changedPaths: string[][],
  sourceLang: string,
  targetLang: string
): Promise<any> {
  const updated = JSON.parse(JSON.stringify(existingContent));
  
  for (const path of changedPaths) {
    try {
      // Get the new value from source content
      let sourceValue: any = newContent;
      for (const key of path) {
        if (sourceValue && typeof sourceValue === 'object') {
          sourceValue = sourceValue[key];
        }
      }
      
      // Only translate if it's a string
      if (typeof sourceValue === 'string') {
        const result = await translateText(sourceValue, sourceLang, targetLang);
        
        // Update the value at this path
        let current = updated;
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }
        current[path[path.length - 1]] = result.translatedText || sourceValue;
      } else if (typeof sourceValue === 'object') {
        // For objects/arrays, translate recursively
        const translated = await translateObject(sourceValue, sourceLang, targetLang);
        
        let current = updated;
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) {
            current[path[i]] = Array.isArray(sourceValue) ? [] : {};
          }
          current = current[path[i]];
        }
        current[path[path.length - 1]] = translated;
      }
    } catch (error) {
      console.error(`Error translating path ${path.join('.')}:`, error);
    }
  }
  
  return updated;
}

/**
 * Save content with incremental translation (only translate changed content)
 * @param content New content in base language
 * @param baseLanguage Base language code (default: 'en')
 */
export async function saveIncrementalTranslation(
  content: ComprehensiveContent,
  baseLanguage: string = 'en',
  onProgress?: (language: string, progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Starting incremental translation...');
    
    // Check translation service availability first
    const { checkTranslationService } = await import('./autoTranslate');
    const serviceStatus = await checkTranslationService();
    
    if (!serviceStatus.available) {
      console.warn('⚠️ Translation service not available:', serviceStatus.error);
      console.log('💡 Saving content without translation');
      
      // Save English content only
      const result = await saveComprehensiveContentAsync(content);
      
      if (result.success) {
        return { 
          success: true, 
          error: serviceStatus.needsApiKey 
            ? 'Content saved. Translation skipped: LibreTranslate API key required. Get a free API key at https://libretranslate.com' 
            : `Content saved. Translation skipped: ${serviceStatus.error || 'Service unavailable'}` 
        };
      }
      return result;
    }
    
    // Load old content to compare
    const oldContent = loadComprehensiveContent();
    
    // Find what changed
    const changedPaths = getChangedPaths(oldContent, content);
    console.log(`📝 Found ${changedPaths.length} changed paths`);
    
    if (changedPaths.length === 0) {
      console.log('✅ No changes detected, skipping translation');
      // Still save the English content
      const result = await saveComprehensiveContentAsync(content);
      return result;
    }
    
    // Save English content first
    localStorage.setItem('comprehensive-content', JSON.stringify(content));
    
    // Update each language's translation incrementally
    const targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== baseLanguage);
    
    for (let i = 0; i < targetLanguages.length; i++) {
      const targetLang = targetLanguages[i];
      
      if (onProgress) {
        onProgress(targetLang, (i / targetLanguages.length) * 100);
      }
      
      console.log(`🌍 Updating ${targetLang} translation (${changedPaths.length} changes)...`);
      
      // Load existing translation
      const storageKey = `comprehensive-content-${targetLang}`;
      let existingTranslation = oldContent; // Default to old English content
      
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          existingTranslation = JSON.parse(saved);
        } catch (error) {
          console.error(`Error loading existing ${targetLang} translation:`, error);
        }
      }
      
      // Update only changed paths
      const updatedTranslation = await updateTranslatedPaths(
        existingTranslation,
        content,
        changedPaths,
        baseLanguage,
        targetLang
      );
      
      // Save updated translation
      localStorage.setItem(storageKey, JSON.stringify(updatedTranslation));
      console.log(`✅ Updated ${targetLang} translation`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (onProgress) {
      onProgress('complete', 100);
    }
    
    // Save to database
    const result = await saveComprehensiveContentToAPI({
      ...content,
      _lastTranslated: new Date().toISOString(),
    });
    
    if (result.success) {
      console.log('✅ All translations saved successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to save to database:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error during incremental translation:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Save translated content for all languages (full translation)
 * @param content Content in base language (typically English)
 * @param baseLanguage Base language code (default: 'en')
 */
export async function saveTranslatedContent(
  content: ComprehensiveContent,
  baseLanguage: string = 'en',
  onProgress?: (language: string, progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🌍 Starting full translation to all languages...');
    
    // Check translation service availability first
    const { checkTranslationService } = await import('./autoTranslate');
    const serviceStatus = await checkTranslationService();
    
    if (!serviceStatus.available) {
      console.warn('⚠️ Translation service not available:', serviceStatus.error);
      const errorMsg = serviceStatus.needsApiKey 
        ? 'Translation failed: LibreTranslate API key required. Get a free API key at https://libretranslate.com' 
        : `Translation failed: ${serviceStatus.error || 'Service unavailable'}`;
      return { success: false, error: errorMsg };
    }
    
    // Translate content to all supported languages
    const translations = await translateContentToAllLanguages(content, baseLanguage, onProgress);
    
    // Save each translation to localStorage with language suffix
    for (const [lang, translatedContent] of Object.entries(translations)) {
      const storageKey = lang === 'en' 
        ? 'comprehensive-content' 
        : `comprehensive-content-${lang}`;
      
      localStorage.setItem(storageKey, JSON.stringify(translatedContent));
      console.log(`✅ Saved ${lang} translation to localStorage`);
    }
    
    // Save all translations to database
    const result = await saveComprehensiveContentToAPI({
      ...content,
      _translations: translations,
      _lastTranslated: new Date().toISOString(),
    });
    
    if (result.success) {
      console.log('✅ All translations saved to database successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to save translations to database:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error during translation:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Load content for a specific language
 * Falls back to English if translation not available
 * @param languageCode Language code (e.g., 'pt', 'es')
 */
export function loadComprehensiveContentForLanguage(languageCode: string = 'en'): ComprehensiveContent {
  // Try to load translated content for the specific language
  if (languageCode !== 'en') {
    const storageKey = `comprehensive-content-${languageCode}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return deepMerge(DEFAULT_COMPREHENSIVE_CONTENT, parsed);
      } catch (error) {
        console.error(`Error parsing saved ${languageCode} content:`, error);
      }
    }
  }
  
  // Fall back to English (default)
  return loadComprehensiveContent();
}

/**
 * Check if translations exist for all languages
 */
export function checkTranslationsExist(): { [lang: string]: boolean } {
  const status: { [lang: string]: boolean } = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const storageKey = lang === 'en' 
      ? 'comprehensive-content' 
      : `comprehensive-content-${lang}`;
    status[lang] = localStorage.getItem(storageKey) !== null;
  }
  
  return status;
}

/**
 * Get translation status and timestamps
 */
export function getTranslationStatus(): {
  exists: { [lang: string]: boolean };
  lastTranslated?: string;
} {
  const exists = checkTranslationsExist();
  
  // Try to get last translation date from English content
  const saved = localStorage.getItem('comprehensive-content');
  let lastTranslated: string | undefined;
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      lastTranslated = parsed._lastTranslated;
    } catch (error) {
      // Ignore parsing errors
    }
  }
  
  return { exists, lastTranslated };
}
