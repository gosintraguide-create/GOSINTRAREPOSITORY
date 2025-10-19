import { WebsiteContent } from '../contentManager';

export const nl: WebsiteContent = {
  homepage: {
    heroHeadline: "Ontdek Sintra met Onbeperkte Ritten",
    heroSubheadline: "Hop-on/hop-off dagpas voor tuk tuks, UMM jeeps en meer. Professionele lokale gidsen. Service om de 10-15 minuten van 9:00 tot 20:00.",
    heroCallToAction: "Koop Dagpas",
    featuredAttractions: [
      {
        name: "Pena Paleis",
        description: "Romantisch 19e-eeuws paleis met levendige kleuren",
        duration: "1-2 uur",
        ticketPrice: 14,
        imageUrl: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a"
      },
      {
        name: "Quinta da Regaleira",
        description: "Gotische villa met mysterieuze tuinen en tunnels",
        duration: "2-3 uur",
        ticketPrice: 12,
        imageUrl: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648"
      },
      {
        name: "Kasteel van de Moren",
        description: "Eeuwenoud fort met panoramisch uitzicht",
        duration: "1-2 uur",
        ticketPrice: 10,
        imageUrl: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10"
      }
    ],
    whatsIncluded: {
      title: "Wat is Inbegrepen",
      items: [
        "Onbeperkte ritten gedurende de hele dag",
        "Professionele lokale chauffeurs-gidsen",
        "Gegarandeerde zitplaats",
        "Flexibel hop-on/hop-off systeem",
        "Digitaal QR-code toegangsbewijs",
        "WhatsApp live chat ondersteuning"
      ]
    },
    socialProof: {
      title: "Join Duizenden Tevreden Reizigers",
      stats: [
        { value: "50,000+", label: "Jaarlijkse Reizigers" },
        { value: "4.8/5", label: "Gemiddelde Beoordeling" },
        { value: "10-15 min", label: "Gemiddelde Wachttijd" }
      ]
    }
  },
  aboutPage: {
    title: "Over Go Sintra",
    mission: "Go Sintra biedt een premium hop-on/hop-off dagpas service in Sintra, Portugal. Onze missie is om het verkennen van de magische bezienswaardigheden van Sintra comfortabel, betaalbaar en onvergetelijk te maken met professionele lokale gidsen die u de hele dag begeleiden.",
    story: "Opgericht in 2024, is Go Sintra gegroeid tot de vertrouwde keuze voor reizigers die de flexibiliteit van onbeperkte ritten willen combineren met professioneel lokaal inzicht.",
    values: [
      {
        title: "Klanttevredenheid",
        description: "Uw ervaring staat voorop in alles wat we doen"
      },
      {
        title: "Lokale Expertise",
        description: "Onze professionele gidsen zijn geboren en getogen in Sintra"
      },
      {
        title: "Betrouwbaarheid",
        description: "Regelmatige service om de 10-15 minuten, gegarandeerd"
      }
    ],
    contact: {
      title: "Neem Contact Op",
      email: "info@gosintra.com",
      phone: "+351 XXX XXX XXX",
      whatsapp: "+351 XXX XXX XXX",
      address: "Sintra, Portugal",
      hours: "Dagelijks 9:00 - 20:00"
    }
  },
  attractionsPage: {
    title: "Sintra Attracties",
    subtitle: "Ontdek de magische bezienswaardigheden van Sintra",
    filterAll: "Alle Attracties",
    filterPalaces: "Paleizen",
    filterGardens: "Tuinen",
    filterCastles: "Kastelen",
    filterMonuments: "Monumenten"
  },
  bookingFlow: {
    selectDate: "Selecteer Datum",
    selectPassengers: "Selecteer Passagiers",
    adults: "Volwassenen",
    children: "Kinderen (4-12)",
    infants: "Baby's (0-3, gratis)",
    optionalExtras: "Optionele Extra's",
    attractionTickets: "Attractie Toegangsbewijzen",
    addAttractionTickets: "Voeg attractie toegangsbewijzen toe aan uw dagpas",
    bookingSummary: "Boeking Overzicht",
    dayPass: "Dagpas",
    attractionTicket: "Attractie Toegangsbewijs",
    total: "Totaal",
    proceedToPayment: "Doorgaan naar Betaling",
    confirmBooking: "Boeking Bevestigen"
  },
  confirmation: {
    title: "Boeking Bevestigd!",
    thankYou: "Bedankt voor uw boeking!",
    emailSent: "Uw bevestiging en QR-codes zijn naar uw e-mail gestuurd.",
    bookingDetails: "Boekingsdetails",
    bookingId: "Boeking ID",
    date: "Datum",
    passengers: "Passagiers",
    qrCode: "Uw QR-Code",
    scanInstructions: "Toon deze code aan een van onze chauffeurs om in te stappen",
    downloadQR: "Download QR-Code",
    printTicket: "Print Toegangsbewijs",
    addToCalendar: "Toevoegen aan Agenda",
    whatsNext: "Wat Nu?",
    nextSteps: [
      "Bewaar uw QR-code (werkt ook offline)",
      "Ga naar een van onze stops om 9:00 uur of later",
      "Toon uw code aan de chauffeur en stap in!",
      "Geniet van onbeperkte ritten tot 20:00 uur"
    ]
  },
  requestPickup: {
    title: "Ophalen Aanvragen",
    subtitle: "Laat ons weten waar u bent en we komen u zo snel mogelijk ophalen",
    selectLocation: "Selecteer Ophaallocatie",
    currentLocation: "Mijn Huidige Locatie",
    trackVehicle: "Voertuig Volgen",
    estimatedArrival: "Geschatte Aankomst",
    requestSent: "Ophaalverzoek Verzonden!",
    driverNotified: "Onze chauffeurs zijn op de hoogte gesteld van uw verzoek",
    cancel: "Annuleer Verzoek"
  },
  manageBooking: {
    title: "Mijn Boeking Beheren",
    enterBookingId: "Voer uw Boeking ID in",
    findBooking: "Boeking Vinden",
    bookingNotFound: "Boeking niet gevonden. Controleer uw ID en probeer opnieuw.",
    modifyBooking: "Boeking Aanpassen",
    cancelBooking: "Boeking Annuleren",
    refundPolicy: "Gratis annuleren tot 24 uur voor uw geplande datum"
  },
  footer: {
    companyDescription: "Premium hop-on/hop-off dagpas service in Sintra met professionele lokale gidsen",
    quickLinks: "Snelle Links",
    support: "Ondersteuning",
    legal: "Juridisch",
    followUs: "Volg Ons",
    allRightsReserved: "Alle rechten voorbehouden"
  }
};
