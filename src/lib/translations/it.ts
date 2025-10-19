import { WebsiteContent } from '../contentManager';

export const it: WebsiteContent = {
  homepage: {
    heroHeadline: "Scopri Sintra con Corse Illimitate",
    heroSubheadline: "Pass giornaliero hop-on/hop-off per tuk tuk, jeep UMM e altro. Guide locali professioniste. Servizio ogni 10-15 minuti dalle 9:00 alle 20:00.",
    heroCallToAction: "Acquista Pass Giornaliero",
    featuredAttractions: [
      {
        name: "Palazzo Pena",
        description: "Palazzo romantico del XIX secolo dai colori vivaci",
        duration: "1-2 ore",
        ticketPrice: 14,
        imageUrl: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a"
      },
      {
        name: "Quinta da Regaleira",
        description: "Villa gotica con giardini e tunnel misteriosi",
        duration: "2-3 ore",
        ticketPrice: 12,
        imageUrl: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0648"
      },
      {
        name: "Castello dei Mori",
        description: "Fortezza antica con vista panoramica",
        duration: "1-2 ore",
        ticketPrice: 10,
        imageUrl: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10"
      }
    ],
    whatsIncluded: {
      title: "Cosa è Incluso",
      items: [
        "Corse illimitate tutto il giorno",
        "Guide-autisti locali professioniste",
        "Posto a sedere garantito",
        "Sistema hop-on/hop-off flessibile",
        "Pass digitale con codice QR",
        "Supporto chat WhatsApp live"
      ]
    },
    socialProof: {
      title: "Unisciti a Migliaia di Viaggiatori Felici",
      stats: [
        { value: "50.000+", label: "Viaggiatori Annuali" },
        { value: "4.8/5", label: "Valutazione Media" },
        { value: "10-15 min", label: "Tempo Medio di Attesa" }
      ]
    }
  },
  aboutPage: {
    title: "Chi Siamo - Go Sintra",
    mission: "Go Sintra offre un servizio premium di pass giornaliero hop-on/hop-off a Sintra, Portogallo. La nostra missione è rendere l'esplorazione dei magici siti di Sintra comoda, conveniente e indimenticabile con guide locali professioniste che vi accompagnano per tutta la giornata.",
    story: "Fondata nel 2024, Go Sintra è diventata la scelta di fiducia per i viaggiatori che desiderano combinare la flessibilità di corse illimitate con una guida locale professionale.",
    values: [
      {
        title: "Soddisfazione del Cliente",
        description: "La vostra esperienza è la nostra priorità in tutto ciò che facciamo"
      },
      {
        title: "Esperienza Locale",
        description: "Le nostre guide professioniste sono nate e cresciute a Sintra"
      },
      {
        title: "Affidabilità",
        description: "Servizio regolare ogni 10-15 minuti, garantito"
      }
    ],
    contact: {
      title: "Contattaci",
      email: "info@gosintra.com",
      phone: "+351 XXX XXX XXX",
      whatsapp: "+351 XXX XXX XXX",
      address: "Sintra, Portogallo",
      hours: "Tutti i giorni 9:00 - 20:00"
    }
  },
  attractionsPage: {
    title: "Attrazioni di Sintra",
    subtitle: "Scopri i magici siti di Sintra",
    filterAll: "Tutte le Attrazioni",
    filterPalaces: "Palazzi",
    filterGardens: "Giardini",
    filterCastles: "Castelli",
    filterMonuments: "Monumenti"
  },
  bookingFlow: {
    selectDate: "Seleziona Data",
    selectPassengers: "Seleziona Passeggeri",
    adults: "Adulti",
    children: "Bambini (4-12)",
    infants: "Neonati (0-3, gratis)",
    optionalExtras: "Extra Opzionali",
    attractionTickets: "Biglietti per Attrazioni",
    addAttractionTickets: "Aggiungi biglietti per attrazioni al tuo pass giornaliero",
    bookingSummary: "Riepilogo Prenotazione",
    dayPass: "Pass Giornaliero",
    attractionTicket: "Biglietto Attrazione",
    total: "Totale",
    proceedToPayment: "Procedi al Pagamento",
    confirmBooking: "Conferma Prenotazione"
  },
  confirmation: {
    title: "Prenotazione Confermata!",
    thankYou: "Grazie per la tua prenotazione!",
    emailSent: "La conferma e i codici QR sono stati inviati alla tua email.",
    bookingDetails: "Dettagli Prenotazione",
    bookingId: "ID Prenotazione",
    date: "Data",
    passengers: "Passeggeri",
    qrCode: "Il Tuo Codice QR",
    scanInstructions: "Mostra questo codice a uno dei nostri autisti per salire a bordo",
    downloadQR: "Scarica Codice QR",
    printTicket: "Stampa Biglietto",
    addToCalendar: "Aggiungi al Calendario",
    whatsNext: "E Adesso?",
    nextSteps: [
      "Salva il tuo codice QR (funziona anche offline)",
      "Recati a una delle nostre fermate alle 9:00 o dopo",
      "Mostra il tuo codice all'autista e sali!",
      "Goditi corse illimitate fino alle 20:00"
    ]
  },
  requestPickup: {
    title: "Richiedi Prelievo",
    subtitle: "Facci sapere dove ti trovi e ti raggiungeremo il prima possibile",
    selectLocation: "Seleziona Punto di Prelievo",
    currentLocation: "La Mia Posizione Attuale",
    trackVehicle: "Traccia Veicolo",
    estimatedArrival: "Arrivo Stimato",
    requestSent: "Richiesta di Prelievo Inviata!",
    driverNotified: "I nostri autisti sono stati avvisati della tua richiesta",
    cancel: "Annulla Richiesta"
  },
  manageBooking: {
    title: "Gestisci la Mia Prenotazione",
    enterBookingId: "Inserisci il tuo ID Prenotazione",
    findBooking: "Trova Prenotazione",
    bookingNotFound: "Prenotazione non trovata. Controlla il tuo ID e riprova.",
    modifyBooking: "Modifica Prenotazione",
    cancelBooking: "Annulla Prenotazione",
    refundPolicy: "Cancellazione gratuita fino a 24 ore prima della data prevista"
  },
  footer: {
    companyDescription: "Servizio premium di pass giornaliero hop-on/hop-off a Sintra con guide locali professioniste",
    quickLinks: "Link Rapidi",
    support: "Supporto",
    legal: "Legale",
    followUs: "Seguici",
    allRightsReserved: "Tutti i diritti riservati"
  }
};
