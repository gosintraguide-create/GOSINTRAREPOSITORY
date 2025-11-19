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
    // Hero Section
    hero: {
      title: string;
      subtitle: string;
      ctaButton: string;
      benefitPills: Array<{ icon: string; text: string }>;
    };
    // Quick Links Section
    quickLinks: {
      title: string;
      subtitle: string;
      attractions: { title: string; subtitle: string };
      travelGuide: { title: string; subtitle: string };
      privateTours: { title: string; subtitle: string };
    };
    heroTitle: string;
    heroSubtitle: string;
    heroCallToAction: string;
    benefitPills: Array<{ icon: string; text: string }>;
    sectionOneTitle: string;
    sectionOneDescription: string;
    // What Is Hop On Sintra Section
    hopOnHopOffDayPass: string;
    unlimitedAdventureTitle: string;
    serviceDescription: string;
    serviceDescription2: string;
    // Feature benefits
    unlimitedRidesTitle: string;
    unlimitedRidesSubtitle: string;
    frequentServiceTitle: string;
    frequentServiceSubtitle: string;
    smallGroupsTitle: string;
    smallGroupsSubtitle: string;
    professionalGuidesTitle: string;
    professionalGuidesSubtitle: string;
    requestPickupTitle: string;
    requestPickupSubtitle: string;
    realTimeTrackingTitle: string;
    realTimeTrackingSubtitle: string;
    // Why You'll Love It section
    whatMakesDifferentTitle: string;
    whatMakesDifferentSubtitle: string;
    intimateAdventuresTitle: string;
    intimateAdventuresDescription: string;
    professionalDriverGuidesTitle: string;
    professionalDriverGuidesDescription: string;
    yourTimeYourWayTitle: string;
    yourTimeYourWayDescription: string;
    neverRushTitle: string;
    neverRushDescription: string;
    guaranteedSeatsTitle: string;
    guaranteedSeatsDescription: string;
    // Pro tip
    proTipTitle: string;
    proTipNoVehicle: string;
    proTipDescription: string;
    // Price badge
    priceFrom: string;
    pricePerPerson: string;
    // On-demand pickup tip (Step 4)
    cantSeeVehicle: string;
    requestPickupTip: string;
    // On-Demand Pickup Feature (Feature 6)
    onDemandPickupTitle: string;
    onDemandPickupDescription: string;
    // Final CTA Section
    finalCtaTitle: string;
    finalCtaSubtitle: string;
    finalCtaButton: string;
    finalCtaSubtext: string;
  };
  routes: {
    title: string;
    subtitle: string;
    route1: string;
    route2: string;
    bothRoutes: string;
    loopsBack: string;
    onePassBothRoutes: string;
    onePassDescription: string;
    stops: {
      trainStation: string;
      historicalCenterNorth: string;
      historicalCenterSouth: string;
      moorishCastle: string;
      penaPalace: string;
      quintaRegaleira: string;
      seteais: string;
      monserratePalace: string;
    };
  };
  header: {
    privateTours: string;
    travelGuide: string;
  };
  footer: {
    quickLinks: string;
    attractions: string;
    travelGuide: string;
    buyDayPass: string;
    privacyPolicy: string;
    terms: string;
    reservedArea: string;
    adminPortal: string;
    driverPortal: string;
    allRightsReserved: string;
  };
  manageBooking: {
    pageTitle: string;
    pageSubtitle: string;
    bookingIdLabel: string;
    bookingIdPlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    findBookingButton: string;
    whereToFindBookingId: string;
    inConfirmationEmail: string;
    subjectLine: string;
    lookFor: string;
    needHelp: string;
    contactSupport: string;
    yourBooking: string;
    bookingId: string;
    validToday: string;
    enjoyYourDay: string;
    startsIn: string;
    days: string;
    validOn: string;
    expired: string;
    passDate: string;
    pickupTime: string;
    operatingHours: string;
    operatingHoursValue: string;
    contactDetails: string;
    bookingDetails: string;
    passengers: string;
    guidedCommentary: string;
    attractionTickets: string;
    totalPaid: string;
    importantInformation: string;
    serviceHours: string;
    serviceHoursDescription: string;
    digitalTickets: string;
    digitalTicketsDescription: string;
    guaranteedSeating: string;
    guaranteedSeatingDescription: string;
    hopOnOff: string;
    hopOnOffDescription: string;
    downloadTickets: string;
    downloadQRCodes: string;
    bookingNotFound: string;
    bookingNotFoundDescription: string;
    checkDetails: string;
    tryAgain: string;
    backToSearch: string;
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
      heroImage?: string;
      cardImage?: string;
      image?: string;
    };
  };
  seo: {
    home: { title: string; description: string; keywords: string };
    attractions: { title: string; description: string; keywords: string };
    howItWorks: { title: string; description: string; keywords: string };
    buyTicket: { title: string; description: string; keywords: string };
    about: { title: string; description: string; keywords: string };
    blog: { title: string; description: string; keywords: string };
  };
  blog: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    filterBy: string;
    allArticles: string;
    noArticlesFound: string;
    tryDifferentSearch: string;
    noArticlesInCategory: string;
    articlesFound: string;
    article: string;
    articles: string;
    readGuide: string;
    minRead: string;
    browseTopics: string;
    exploreByCategory: string;
    exploreCategoryDescription: string;
    guide: string;
    guides: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    backToBlog: string;
    articleNotFound: string;
    share: string;
    updated: string;
    relatedArticles: string;
    moreArticles: string;
    
    // Blog Article Page specific
    breadcrumbHome: string;
    breadcrumbTravelGuide: string;
    byAuthor: string;
    shareViaFacebook: string;
    shareViaTwitter: string;
    shareViaEmail: string;
    moreFromTravelGuide: string;
    viewAllArticles: string;
    tableOfContents: string;
    readyToExperience: string;
    bookFlexibleDayPass: string;
    bookDayPassNow: string;
    
    categories: {
      planning: string;
      "getting-there": string;
      attractions: string;
      tips: string;
      history: string;
    };
    categoryDescriptions: {
      planning: string;
      "getting-there": string;
      attractions: string;
      tips: string;
      history: string;
    };
  };
  buyTicket?: {
    hero: {
      title: string;
    };
    steps: {
      step1Description: string;
      step2Description: string;
      step3Description: string;
      step4Description: string;
    };
    dateSelection: {
      planYourVisit: string;
      planYourVisitDescription: string;
      selectDate: string;
      pickDate: string;
      preferredStartTime: string;
      selectTime: string;
      checkingAvailability: string;
      numberOfGuests: string;
      numberOfPasses: string;
      passLabel: string;
      passesLabel: string;
      guest: string;
      guests: string;
      tourType: string;
      standardTour: string;
      standardTourDescription: string;
      guidedTour: string;
      guidedTourDescription: string;
      guidedCommentaryIncluded: string;
      guidedCommentaryDescription: string;
      continueButton: string;
      passValidFullDay: string;
      soldOut: string;
      limited: string;
      available: string;
      soldOutForTime: string;
      limitedAvailability: string;
      goodAvailability: string;
      preferredPickupSpot: string;
      pickupPlaceholder: string;
      pickupHelpText: string;
      vehicleDispatchSmall: string; // "Perfect! We'll dispatch an appropriate vehicle for your group of {quantity}"
      vehicleDispatchLarge: string; // "Large group! You'll need {vehicles} vehicles coordinated to arrive together."
      vehicles: string;
      dayPassPriceSummary: string; // "Day Pass"
      dayPassWithGuided: string; // "(includes guided commentary)"
      forGuests: string; // "for {quantity} {guest/guests}"
    };
    step2: {
      title: string; // "Add Attraction Tickets?"
      description: string;
      descriptionMultiple: string; // "Prices shown for X guests"
      notAvailableMessage: string;
      comingSoonBadge: string;
      comingSoonMessage: string;
      comingSoonTip: string;
      eachLabel: string; // "each"
      tipTitle: string;
      tipMessage: string; // "You'll receive digital tickets via email along with your day pass QR code(s)"
      backButton: string;
      continueButton: string;
    };
    step3: {
      title: string; // "Your Information"
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      confirmEmail: string;
      confirmEmailPlaceholder: string;
      qrCodeMessage: string; // "Your QR code will be sent here"
      emailsDontMatch: string;
      backButton: string;
      continueButton: string;
    };
    step4: {
      orderSummary: string;
      paymentDetails: string;
      startingAt: string;
      dayPassWithQuantity: string; // "Day Pass (×{quantity})"
      plusGuided: string; // "+ Guided"
      attractionTickets: string;
      total: string;
      benefit1: string; // "Unlimited hop-on/hop-off until 8:00 PM"
      benefit2: string; // "Guaranteed seating in small vehicles"
      benefit3: string; // "Flexible - use anytime during operating hours"
      benefit4Single: string; // "QR code sent via email"
      benefit4Multiple: string; // "{quantity} QR codes sent via email"
      benefit5: string; // "Guided commentary included"
      paymentInitFailed: string;
      preparingPayment: string;
      retry: string;
      goBack: string;
      backButton: string;
    };
    pickupLocations: {
      sintraTrainStation: string;
      sintraTownCenter: string;
      penaPalace: string;
      quintaRegaleira: string;
      moorishCastle: string;
      monserratePalace: string;
      sintraPalace: string;
      other: string;
    };
    timeSlots: {
      guidedTourLabel: string; // "Guided Tour"
    };
    passengersSelection: {
      yourInformation: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phoneNumber: string;
      phoneNumberPlaceholder: string;
      specialRequests: string;
      specialRequestsPlaceholder: string;
      backButton: string;
      continueButton: string;
    };
    payment: {
      reviewAndPay: string;
      orderSummary: string;
      dayPass: string;
      dayPasses: string;
      passes: string;
      tourType: string;
      guidedTour: string;
      attractionTickets: string;
      subtotal: string;
      total: string;
      cardPaymentDetails: string;
      backButton: string;
      payNow: string;
      processingPayment: string;
    };
    messages: {
      bookingConfirmedEmail: string;
      bookingConfirmed: string;
      bookingFailed: string;
    };
  };
  privateTours: {
    // Coming Soon section (when disabled)
    comingSoon: {
      badge: string;
      title: string;
      subtitle: string;
      stayTunedText: string;
      feature1: string;
      feature2: string;
      feature3: string;
      notifyButton: string;
      exploreDayPassButton: string;
      footerText: string;
    };
    // Why Wait section
    whyWait: {
      title: string;
      subtitle: string;
      card1Title: string;
      card1Description: string;
      card2Title: string;
      card2Description: string;
      card3Title: string;
      card3Description: string;
      bookDayPassButton: string;
    };
    // Main Private Tours Page (when enabled)
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      pill1: string;
      pill2: string;
      pill3: string;
      requestQuoteButton: string;
      viewPackagesButton: string;
    };
    packages: {
      title: string;
      subtitle: string;
      // Half Day
      halfDay: {
        title: string;
        description: string;
        price: string;
        priceSubtext: string;
        duration: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        feature5: string;
        bookButton: string;
      };
      // Full Day
      fullDay: {
        badge: string;
        title: string;
        description: string;
        price: string;
        priceSubtext: string;
        duration: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        feature5: string;
        feature6: string;
        bookButton: string;
      };
      // Custom
      custom: {
        title: string;
        description: string;
        price: string;
        duration: string;
        feature1: string;
        feature2: string;
        feature3: string;
        feature4: string;
        feature5: string;
        contactButton: string;
      };
      disclaimer: string;
    };
    whyChoose: {
      title: string;
      subtitle: string;
      benefit1Title: string;
      benefit1Description: string;
      benefit2Title: string;
      benefit2Description: string;
      benefit3Title: string;
      benefit3Description: string;
    };
    whatsIncluded: {
      title: string;
      item1Title: string;
      item1Description: string;
      item2Title: string;
      item2Description: string;
      item3Title: string;
      item3Description: string;
      item4Title: string;
      item4Description: string;
    };
    sampleItineraries: {
      title: string;
      subtitle: string;
      // Half Day Sample
      halfDay: {
        title: string;
        duration: string;
        badge: string;
        stop1Title: string;
        stop1Description: string;
        stop2Title: string;
        stop2Description: string;
        stop3Title: string;
        stop3Description: string;
      };
      // Full Day Sample
      fullDay: {
        title: string;
        duration: string;
        badge: string;
        stop1Title: string;
        stop1Description: string;
        stop2Title: string;
        stop2Description: string;
        stop3Title: string;
        stop3Description: string;
        stop4Title: string;
        stop4Description: string;
        stop5Title: string;
        stop5Description: string;
      };
    };
    faq: {
      title: string;
      subtitle: string;
      question1: string;
      answer1: string;
      question2: string;
      answer2: string;
      question3: string;
      answer3: string;
      question4: string;
      answer4: string;
      question5: string;
      answer5: string;
    };
    finalCta: {
      title: string;
      subtitle: string;
      requestQuoteButton: string;
      chatButton: string;
    };
  };
  featureFlags?: {
    enableAttractionTickets?: boolean;
  };
}

export const DEFAULT_CONTENT: WebsiteContent = {
  company: {
    name: "Hop On Sintra",
    email: "info@hoponsintra.com",
    phone: "+351 932 967 279",
    location: "Sintra, Portugal",
    operatingHours: "9 AM - 8 PM Daily",
    whatsappNumber: "+351932967279",
  },
  homepage: {
    // Hero Section
    hero: {
      title: "Discover Sintra Your Way",
      subtitle: "Hop-on, hop-off day pass with guaranteed seats and professional driver-guides. Unlimited rides in small tuk tuks and vintage jeeps. New departure every 30 minutes.",
      ctaButton: "Book Your Day Pass",
      benefitPills: [
        { icon: "Users", text: "Small Groups (2-6)" },
        { icon: "Shield", text: "Local Guides" },
        { icon: "MapPin", text: "All Attractions" },
      ],
    },
    // Quick Links Section
    quickLinks: {
      title: "Quick Links",
      subtitle: "Explore Sintra's magical landscapes with our hop-on/hop-off service",
      attractions: { title: "Attractions", subtitle: "Discover Pena Palace, Quinta da Regaleira, Moorish Castle, and more" },
      travelGuide: { title: "Travel Guide", subtitle: "Expert tips, insider secrets, and everything you need for a magical Sintra adventure" },
      privateTours: { title: "Private Tours", subtitle: "Book a private tour for a personalized experience" },
    },
    heroTitle: "Discover Sintra Your Way",
    heroSubtitle: "Hop-on, hop-off day pass with guaranteed seats and professional driver-guides. Unlimited rides in small tuk tuks and vintage jeeps. New departure every 30 minutes.",
    heroCallToAction: "Book Your Day Pass",
    benefitPills: [
      { icon: "Users", text: "Small Groups (2-6)" },
      { icon: "Shield", text: "Local Guides" },
      { icon: "MapPin", text: "All Attractions" },
    ],
    sectionOneTitle: "Why Choose Go Sintra?",
    sectionOneDescription: "Skip the crowded tour buses and experience Sintra the way it's meant to be discovered",
    // What Is Hop On Sintra Section
    hopOnHopOffDayPass: "Hop-On/Hop-Off Day Pass",
    unlimitedAdventureTitle: "Unlimited Adventure",
    serviceDescription: "Explore Sintra's UNESCO World Heritage sites with guaranteed seating in small vehicles. Unlimited rides every 30 minutes. Book your flexible day pass online now.",
    serviceDescription2: "Experience Sintra's magical landscapes with our premium hop-on/hop-off service. Enjoy unlimited rides in small, intimate vehicles with professional driver-guides.",
    // Feature benefits
    unlimitedRidesTitle: "Unlimited Rides",
    unlimitedRidesSubtitle: "Explore Sintra's attractions at your own pace with unlimited rides.",
    frequentServiceTitle: "Frequent Service",
    frequentServiceSubtitle: "Regular departures every 30 minutes, ensuring you never wait long.",
    smallGroupsTitle: "Small Groups",
    smallGroupsSubtitle: "Enjoy intimate tours with small groups (2-6 people).",
    professionalGuidesTitle: "Professional Guides",
    professionalGuidesSubtitle: "Learn from certified guides with deep local knowledge.",
    requestPickupTitle: "Request Pickup",
    requestPickupSubtitle: "Choose your preferred pickup location and time.",
    realTimeTrackingTitle: "Real-Time Tracking",
    realTimeTrackingSubtitle: "Track your vehicle in real-time and know exactly where it is.",
    // Why You'll Love It section
    whatMakesDifferentTitle: "What Makes Us Different",
    whatMakesDifferentSubtitle: "Experience Sintra like never before with our premium service.",
    intimateAdventuresTitle: "Intimate Adventures",
    intimateAdventuresDescription: "Skip the crowds and enjoy small, intimate tours with professional guides.",
    professionalDriverGuidesTitle: "Professional Driver-Guides",
    professionalDriverGuidesDescription: "Every vehicle is driven by a certified professional guide with deep local knowledge and years of experience showing visitors the best of Sintra.",
    yourTimeYourWayTitle: "Your Time, Your Way",
    yourTimeYourWayDescription: "Hop off at any attraction, spend as long as you want, then hop back on. Your day, your pace.",
    neverRushTitle: "Never Rush",
    neverRushDescription: "Enjoy a relaxed and stress-free experience with our flexible service.",
    guaranteedSeatsTitle: "Guaranteed Seats",
    guaranteedSeatsDescription: "Every guest has a guaranteed seat in a small, intimate vehicle. No standing, no overcrowding.",
    // Pro tip
    proTipTitle: "Pro Tip",
    proTipNoVehicle: "No vehicle needed!",
    proTipDescription: "Our service includes transportation to all major Sintra attractions, so you don't need to worry about renting a vehicle.",
    // Price badge
    priceFrom: "From",
    pricePerPerson: "per person",
    // On-demand pickup tip (Step 4)
    cantSeeVehicle: "Can't see your vehicle?",
    requestPickupTip: "Request pickup to have a vehicle dispatched to your location.",
    // On-Demand Pickup Feature (Feature 6)
    onDemandPickupTitle: "On-Demand Pickup",
    onDemandPickupDescription: "Request a vehicle to be dispatched to your location for a seamless start to your adventure.",
    // Final CTA Section
    finalCtaTitle: "Ready to Start Your Adventure?",
    finalCtaSubtitle: "Now that you're armed with insider knowledge, book your flexible day pass with professional driver-guides! 🎉",
    finalCtaButton: "Book Your Day Pass",
    finalCtaSubtext: "Experience Sintra's magical landscapes like never before.",
  },
  routes: {
    title: "Routes",
    subtitle: "Explore Sintra's magical landscapes with our hop-on/hop-off service",
    route1: "Route 1",
    route2: "Route 2",
    bothRoutes: "Both Routes",
    loopsBack: "Loops Back",
    onePassBothRoutes: "One Pass for Both Routes",
    onePassDescription: "Enjoy both routes with a single day pass. Perfect for a full day of exploration.",
    stops: {
      trainStation: "Sintra Train Station",
      historicalCenterNorth: "Historical Center North",
      historicalCenterSouth: "Historical Center South",
      moorishCastle: "Moorish Castle",
      penaPalace: "Pena Palace",
      quintaRegaleira: "Quinta da Regaleira",
      seteais: "Seteais",
      monserratePalace: "Monserrate Palace",
    },
  },
  header: {
    privateTours: "Private Tours",
    travelGuide: "Travel Guide",
  },
  footer: {
    quickLinks: "Quick Links",
    attractions: "Attractions",
    travelGuide: "Travel Guide",
    buyDayPass: "Buy Day Pass",
    privacyPolicy: "Privacy Policy",
    terms: "Terms & Conditions",
    reservedArea: "Reserved Area",
    adminPortal: "Admin Portal",
    driverPortal: "Driver Portal",
    allRightsReserved: "All rights reserved",
  },
  manageBooking: {
    pageTitle: "Manage Your Booking",
    pageSubtitle: "Enter your booking details to find and manage your Sintra day pass",
    bookingIdLabel: "Booking ID",
    bookingIdPlaceholder: "Enter your booking ID",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Enter your last name",
    findBookingButton: "Find Booking",
    whereToFindBookingId: "Where to find your booking ID?",
    inConfirmationEmail: "In the confirmation email",
    subjectLine: "Subject line: Sintra Day Pass Booking Confirmation",
    lookFor: "Look for a line that says 'Your booking ID is:'",
    needHelp: "Need help?",
    contactSupport: "Contact support",
    yourBooking: "Your Booking",
    bookingId: "Booking ID",
    validToday: "Valid Today",
    enjoyYourDay: "Enjoy Your Day!",
    startsIn: "Starts in",
    days: "days",
    validOn: "Valid on",
    expired: "Expired",
    passDate: "Pass Date",
    pickupTime: "Pickup Time",
    operatingHours: "Operating Hours",
    operatingHoursValue: "9 AM - 8 PM Daily",
    contactDetails: "Contact Details",
    bookingDetails: "Booking Details",
    passengers: "Passengers",
    guidedCommentary: "Guided Commentary",
    attractionTickets: "Attraction Tickets",
    totalPaid: "Total Paid",
    importantInformation: "Important Information",
    serviceHours: "Service Hours",
    serviceHoursDescription: "Our service operates from 9 AM to 8 PM daily. Please arrive at your pickup location 15 minutes before your scheduled pickup time.",
    digitalTickets: "Digital Tickets",
    digitalTicketsDescription: "You will receive digital tickets via email along with your day pass QR code(s).",
    guaranteedSeating: "Guaranteed Seating",
    guaranteedSeatingDescription: "Every guest has a guaranteed seat in a small, intimate vehicle. No standing, no overcrowding.",
    hopOnOff: "Hop-On/Hop-Off",
    hopOnOffDescription: "Explore Sintra's attractions at your own pace with unlimited rides in small, intimate vehicles with professional driver-guides.",
    downloadTickets: "Download Tickets",
    downloadQRCodes: "Download QR Codes",
    bookingNotFound: "Booking Not Found",
    bookingNotFoundDescription: "We couldn't find a booking with the provided details. Please check the details and try again.",
    checkDetails: "Check Details",
    tryAgain: "Try Again",
    backToSearch: "Back to Search",
  },
  about: {
    title: "About Go Sintra",
    subtitle: "Your premium hop-on/hop-off adventure through Sintra's magical landscapes",
    story: [
      "Go Sintra was born from a simple observation: visitors to this UNESCO World Heritage site deserved better than crowded buses and rigid schedules.",
      "We created a flexible, premium alternative that combines the intimacy of small vehicles with the freedom of hop-on/hop-off convenience.",
      "Today, thousands of visitors choose Go Sintra for guaranteed seating, regular departures every 30 minutes, and an authentic, intimate way to explore this magical destination.",
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
        title: "Professional Driver-Guides",
        description: "Every vehicle is driven by a certified professional guide with deep local knowledge and years of experience showing visitors the best of Sintra.",
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
      description: "Explore Sintra's UNESCO World Heritage sites with guaranteed seating in small vehicles. Unlimited rides every 30 minutes. Book your flexible day pass online now.",
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
      description: "Go Sintra offers premium hop-on/hop-off service with guaranteed seating in small vehicles. Regular departures every 30 minutes throughout Sintra.",
      keywords: "about Go Sintra, Sintra tour company, premium Sintra tours, small group Sintra",
    },
    blog: {
      title: "Your Ultimate Sintra Travel Guide",
      description: "Expert tips, insider secrets, and everything you need for a magical Sintra adventure ✨",
      keywords: "Sintra travel guide, Sintra tips, Sintra attractions, Sintra day pass, Sintra tours",
    },
  },
  blog: {
    pageTitle: "Your Ultimate Sintra Travel Guide",
    pageSubtitle: "Expert tips, insider secrets, and everything you need for a magical Sintra adventure ✨",
    searchPlaceholder: "Search for guides, tips, and itineraries...",
    filterBy: "Filter by:",
    allArticles: "All Articles",
    noArticlesFound: "No articles found",
    tryDifferentSearch: "Try a different search term",
    noArticlesInCategory: "No articles available in this category",
    articlesFound: "Articles Found",
    article: "Article",
    articles: "Articles",
    readGuide: "Read Guide",
    minRead: "min read",
    browseTopics: "Browse Topics",
    exploreByCategory: "Explore by Category",
    exploreCategoryDescription: "Find exactly what you're looking for—organized by topic!",
    guide: "guide",
    guides: "guides",
    ctaTitle: "Ready to Start Your Adventure?",
    ctaSubtitle: "Now that you're armed with insider knowledge, book your flexible day pass with professional driver-guides! 🎉",
    ctaButton: "Book Your Day Pass",
    backToBlog: "Back to Blog",
    articleNotFound: "Article not found",
    share: "Share",
    updated: "Updated",
    relatedArticles: "Related Articles",
    moreArticles: "More Articles",
    
    // Blog Article Page specific
    breadcrumbHome: "Home",
    breadcrumbTravelGuide: "Travel Guide",
    byAuthor: "By",
    shareViaFacebook: "Facebook",
    shareViaTwitter: "Twitter",
    shareViaEmail: "Email",
    moreFromTravelGuide: "More from Travel Guide",
    viewAllArticles: "View All Articles",
    tableOfContents: "Table of Contents",
    readyToExperience: "Ready to Experience Sintra?",
    bookFlexibleDayPass: "Book your flexible day pass and start exploring Sintra's magnificent palaces and gardens",
    bookDayPassNow: "Book Your Day Pass Now",
    
    categories: {
      planning: "Planning Your Visit",
      "getting-there": "Getting There",
      attractions: "Attractions & Sights",
      tips: "Travel Tips",
      history: "History & Culture",
    },
    categoryDescriptions: {
      planning: "Everything you need to know to plan the perfect Sintra day trip",
      "getting-there": "Transportation guides and tips for reaching Sintra",
      attractions: "In-depth guides to Sintra's palaces, castles, and gardens",
      tips: "Insider tips and local advice for exploring Sintra",
      history: "Learn about Sintra's rich history and cultural heritage",
    },
  },
  privateTours: {
    // Coming Soon section (when disabled)
    comingSoon: {
      badge: "Coming Soon",
      title: "Private Tours",
      subtitle: "Experience Sintra like never before with our exclusive private tours.",
      stayTunedText: "Stay tuned for updates on our private tour offerings!",
      feature1: "Personalized Itineraries",
      feature2: "Exclusive Access",
      feature3: "Private Vehicles",
      notifyButton: "Notify Me",
      exploreDayPassButton: "Explore Day Pass",
      footerText: "Don't miss out on the ultimate Sintra adventure!",
    },
    // Why Wait section
    whyWait: {
      title: "Why Wait?",
      subtitle: "Upgrade your Sintra experience with our private tours.",
      card1Title: "Personalized Itineraries",
      card1Description: "Tailored tours to suit your interests and preferences.",
      card2Title: "Exclusive Access",
      card2Description: "Skip the crowds and enjoy private access to top attractions.",
      card3Title: "Private Vehicles",
      card3Description: "Travel in comfort with your own private vehicle.",
      bookDayPassButton: "Book Day Pass",
    },
    // Main Private Tours Page (when enabled)
    hero: {
      badge: "Exclusive",
      title: "Private Tours",
      subtitle: "Experience Sintra like never before with our exclusive private tours.",
      pill1: "Personalized Itineraries",
      pill2: "Exclusive Access",
      pill3: "Private Vehicles",
      requestQuoteButton: "Request Quote",
      viewPackagesButton: "View Packages",
    },
    packages: {
      title: "Private Tour Packages",
      subtitle: "Choose the perfect package for your Sintra adventure.",
      // Half Day
      halfDay: {
        title: "Half Day Tour",
        description: "Explore Sintra's top attractions in a half-day tour.",
        price: "€150",
        priceSubtext: "per person",
        duration: "4 hours",
        feature1: "Personalized Itinerary",
        feature2: "Exclusive Access",
        feature3: "Private Vehicle",
        feature4: "Professional Guide",
        feature5: "Skip-the-Line Entry",
        bookButton: "Book Now",
      },
      // Full Day
      fullDay: {
        badge: "Best Value",
        title: "Full Day Tour",
        description: "Discover Sintra's magical landscapes in a full-day tour.",
        price: "€250",
        priceSubtext: "per person",
        duration: "8 hours",
        feature1: "Personalized Itinerary",
        feature2: "Exclusive Access",
        feature3: "Private Vehicle",
        feature4: "Professional Guide",
        feature5: "Skip-the-Line Entry",
        feature6: "Lunch Included",
        bookButton: "Book Now",
      },
      // Custom
      custom: {
        title: "Custom Tour",
        description: "Create your own Sintra adventure with a custom tour.",
        price: "€300+",
        duration: "Custom",
        feature1: "Personalized Itinerary",
        feature2: "Exclusive Access",
        feature3: "Private Vehicle",
        feature4: "Professional Guide",
        feature5: "Skip-the-Line Entry",
        contactButton: "Contact Us",
      },
      disclaimer: "Prices are per person and may vary based on group size and season.",
    },
    whyChoose: {
      title: "Why Choose Go Sintra Private Tours?",
      subtitle: "Experience Sintra like never before with our exclusive private tours.",
      benefit1Title: "Personalized Itineraries",
      benefit1Description: "Tailored tours to suit your interests and preferences.",
      benefit2Title: "Exclusive Access",
      benefit2Description: "Skip the crowds and enjoy private access to top attractions.",
      benefit3Title: "Private Vehicles",
      benefit3Description: "Travel in comfort with your own private vehicle.",
    },
    whatsIncluded: {
      title: "What's Included in Our Private Tours?",
      item1Title: "Personalized Itinerary",
      item1Description: "Tailored tours to suit your interests and preferences.",
      item2Title: "Exclusive Access",
      item2Description: "Skip the crowds and enjoy private access to top attractions.",
      item3Title: "Private Vehicle",
      item3Description: "Travel in comfort with your own private vehicle.",
      item4Title: "Professional Guide",
      item4Description: "Learn from certified guides with deep local knowledge.",
    },
    sampleItineraries: {
      title: "Sample Itineraries",
      subtitle: "Discover Sintra's magical landscapes with our exclusive private tours.",
      // Half Day Sample
      halfDay: {
        title: "Half Day Tour",
        duration: "4 hours",
        badge: "Popular",
        stop1Title: "Pena Palace",
        stop1Description: "Discover the crown jewel of Sintra with a private tour.",
        stop2Title: "Quinta da Regaleira",
        stop2Description: "Explore the mystical estate with a private guide.",
        stop3Title: "Moorish Castle",
        stop3Description: "Walk along the ancient ramparts with a private tour.",
      },
      // Full Day Sample
      fullDay: {
        title: "Full Day Tour",
        duration: "8 hours",
        badge: "Best Value",
        stop1Title: "Pena Palace",
        stop1Description: "Discover the crown jewel of Sintra with a private tour.",
        stop2Title: "Quinta da Regaleira",
        stop2Description: "Explore the mystical estate with a private guide.",
        stop3Title: "Moorish Castle",
        stop3Description: "Walk along the ancient ramparts with a private tour.",
        stop4Title: "Monserrate Palace",
        stop4Description: "Enjoy the exotic palace with a private guide.",
        stop5Title: "Sintra National Palace",
        stop5Description: "Discover the best-preserved medieval royal palace with a private tour.",
      },
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Get answers to your questions about our private tours.",
      question1: "What is included in a private tour?",
      answer1: "Our private tours include a personalized itinerary, exclusive access to top attractions, a private vehicle, a professional guide, and skip-the-line entry.",
      question2: "How many people can join a private tour?",
      answer2: "Private tours are available for groups of up to 6 people. Larger groups can be accommodated with multiple vehicles.",
      question3: "Can I customize my private tour?",
      answer3: "Absolutely! We offer custom tour packages to suit your interests and preferences. Contact us to create your own Sintra adventure.",
      question4: "What languages are spoken by the guides?",
      answer4: "Our guides speak English, Portuguese, and Spanish. We can also provide guides in other languages upon request.",
      question5: "What should I wear for a private tour?",
      answer5: "Comfortable shoes and clothing are recommended for walking and exploring Sintra's attractions. Bring water and sun protection for outdoor tours.",
    },
    finalCta: {
      title: "Ready to Start Your Adventure?",
      subtitle: "Experience Sintra like never before with our exclusive private tours.",
      requestQuoteButton: "Request Quote",
      chatButton: "Chat with Us",
    },
  },
  featureFlags: {
    enableAttractionTickets: false,
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

// Async version that waits for database save and returns result
export async function saveContentAsync(content: WebsiteContent): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to localStorage as backup
    localStorage.setItem("website-content", JSON.stringify(content));
    
    // Save to database and wait for result
    const result = await saveContentToAPI(content);
    
    if (result.success) {
      console.log('✅ Content saved to database successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to save content to database:', result.error);
      return { success: false, error: result.error || 'Failed to save to database' };
    }
  } catch (error) {
    console.error('❌ Error saving content:', error);
    return { success: false, error: String(error) };
  }
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
        blog: { ...DEFAULT_CONTENT.blog, ...parsed.blog },
        featureFlags: { ...DEFAULT_CONTENT.featureFlags, ...parsed.featureFlags },
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
        blog: { ...translation.blog, ...parsed.blog },
        featureFlags: { ...translation.featureFlags, ...parsed.featureFlags },
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
    if (content && content.initialized) {
      // Only save if there's actual content (not just the initialized flag)
      const hasActualContent = Object.keys(content).length > 2; // More than just initialized and lastUpdated
      
      if (hasActualContent) {
        // Save to localStorage for offline access
        localStorage.setItem("website-content", JSON.stringify(content));
        console.log('✅ Synced content from database to localStorage');
        return {
          ...DEFAULT_CONTENT,
          ...content,
          company: { ...DEFAULT_CONTENT.company, ...content.company },
          homepage: { ...DEFAULT_CONTENT.homepage, ...content.homepage },
          about: { ...DEFAULT_CONTENT.about, ...content.about },
          attractions: { ...DEFAULT_CONTENT.attractions, ...content.attractions },
          seo: { ...DEFAULT_CONTENT.seo, ...content.seo },
          blog: { ...DEFAULT_CONTENT.blog, ...content.blog },
          featureFlags: { ...DEFAULT_CONTENT.featureFlags, ...content.featureFlags },
        };
      } else {
        console.log('⚠️ Database content is empty, using defaults');
      }
    } else {
      console.log('ℹ️ No content in database yet, using defaults');
    }
  } catch (error) {
    console.error('Failed to sync content from database:', error);
  }
  return loadContent();
}

// Async function to sync content from database with language support
export async function syncContentFromDatabaseWithLanguage(languageCode: string = 'en'): Promise<WebsiteContent> {
  try {
    const content = await getContentFromAPI();
    const translation = getTranslation(languageCode);
    
    if (content && content.initialized) {
      // Only save if there's actual content
      const hasActualContent = Object.keys(content).length > 2;
      
      if (hasActualContent) {
        // Save to localStorage for offline access
        localStorage.setItem("website-content", JSON.stringify(content));
        
        // Merge database content with translation (database content takes precedence)
        return {
          ...translation,
          ...content,
          company: { ...translation.company, ...content.company },
          homepage: { ...translation.homepage, ...content.homepage },
          about: { ...translation.about, ...content.about },
          attractions: { ...translation.attractions, ...content.attractions },
          seo: { ...translation.seo, ...content.seo },
          blog: { ...translation.blog, ...content.blog },
          featureFlags: { ...translation.featureFlags, ...content.featureFlags },
        };
      }
    }
  } catch (error) {
    // Silently fail - backend may not be available
    // This is normal during development or if backend is down
  }
  return loadContentWithLanguage(languageCode);
}