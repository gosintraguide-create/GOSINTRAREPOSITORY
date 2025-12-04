// Component-specific translations for ProductCard, BookingCard, ManualBookingPage
// Import this in components that need these translations

export interface ComponentTranslations {
  // Common
  perPass: string;
  quantity: string;
  each: string;
  back: string;
  next: string;
  adult: string;
  
  // ProductCard
  productCard: {
    daypass: {
      title: string;
      description: string;
      features: string[];
      bookNow: string;
    };
    insightTour: {
      title: string;
      description: string;
      features: string[];
      bookNow: string;
    };
    monuments: {
      title: string;
      description: string;
      features: string[];
      bookNow: string;
    };
  };
  
  // BookingCard
  bookingCard: {
    title: string;
    selectDate: string;
    quantity: string;
    total: string;
    bookNow: string;
  };
  
  // ManualBookingPage
  manualBooking: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Description: string;
    customerName: string;
    customerNamePlaceholder: string;
    customerEmail: string;
    customerEmailPlaceholder: string;
    nextDetails: string;
    step2Title: string;
    step2Description: string;
    selectPasses: string;
    tapToAdjust: string;
    nextAddons: string;
    step3Title: string;
    step3Description: string;
    guidedTour: string;
    guidedTourDescription: string;
    attractions: string;
    selectAttractions: string;
    step4Title: string;
    step4Description: string;
    paymentMethod: string;
    cash: string;
    card: string;
    createBooking: string;
    bookingCreated: string;
    shareIdWithCustomer: string;
    customer: string;
    totalPaid: string;
    payment: string;
    ticketsSentTo: string;
    passengersCheckedIn: string;
    createAnother: string;
    backToAdmin: string;
    errorCreatingBooking: string;
    pleaseTryAgain: string;
    goBack: string;
  };
}

export const componentTranslations: { [key: string]: ComponentTranslations } = {
  en: {
    perPass: "per pass",
    quantity: "Quantity",
    each: "each",
    back: "Back",
    next: "Next",
    adult: "Adult",
    
    productCard: {
      daypass: {
        title: "Full Day Pass",
        description: "Unlimited rides across all Sintra attractions",
        features: [
          "Unlimited hop-on hop-off rides",
          "Guaranteed seats - no waiting",
          "Professional driver-guides",
          "Service 9am - 7pm daily",
          "Small groups (max 8 people)",
          "Real-time vehicle tracking",
        ],
        bookNow: "Book Your Pass",
      },
      insightTour: {
        title: "Insight Tour",
        description: "Deep dive into Sintra's history and culture",
        features: [
          "Expert local guide",
          "In-depth historical narratives",
          "Skip-the-line monument access",
          "Small intimate groups",
          "Hidden gems & local stories",
          "Full day experience",
        ],
        bookNow: "Book Insight Tour",
      },
      monuments: {
        title: "Monument Tickets",
        description: "Skip the line at Sintra's top attractions",
        features: [
          "Pena Palace entry",
          "Quinta da Regaleira",
          "Moorish Castle access",
          "Monserrate Palace",
          "Priority entrance",
          "Valid for one day",
        ],
        bookNow: "Buy Tickets",
      },
    },
    
    bookingCard: {
      title: "Book Your Day Pass",
      selectDate: "Select Date",
      quantity: "Quantity",
      total: "Total",
      bookNow: "Book Now",
    },
    
    manualBooking: {
      title: "Create Manual Booking",
      subtitle: "For walk-ins and on-location sales",
      step1Title: "Customer Details",
      step1Description: "Basic information",
      customerName: "Customer Name",
      customerNamePlaceholder: "Full name",
      customerEmail: "Customer Email",
      customerEmailPlaceholder: "email@example.com",
      nextDetails: "Next: Passes",
      step2Title: "Select Passes",
      step2Description: "Tap to adjust",
      selectPasses: "Select Passes",
      tapToAdjust: "Tap to adjust",
      nextAddons: "Next: Add-ons",
      step3Title: "Add-ons",
      step3Description: "Optional extras",
      guidedTour: "Guided Commentary",
      guidedTourDescription: "Enhanced experience with detailed narratives",
      attractions: "Attraction Tickets",
      selectAttractions: "Select which attractions to include",
      step4Title: "Payment",
      step4Description: "How will customer pay?",
      paymentMethod: "Payment Method",
      cash: "Cash",
      card: "Card",
      createBooking: "Create Booking",
      bookingCreated: "Booking Created!",
      shareIdWithCustomer: "Share this ID with customer",
      customer: "Customer",
      totalPaid: "Total Paid",
      payment: "Payment",
      ticketsSentTo: "Tickets sent to",
      passengersCheckedIn: "Passengers automatically checked in",
      createAnother: "Create Another Booking",
      backToAdmin: "Back to Admin",
      errorCreatingBooking: "Error creating booking",
      pleaseTryAgain: "Please try again",
      goBack: "Go Back",
    },
  },
  pt: {
    perPass: "por passe",
    quantity: "Quantidade",
    each: "cada",
    back: "Voltar",
    next: "Próximo",
    adult: "Adulto",
    
    productCard: {
      daypass: {
        title: "Passe de Dia Inteiro",
        description: "Viagens ilimitadas por todas as atrações de Sintra",
        features: [
          "Viagens ilimitadas hop-on hop-off",
          "Lugares garantidos - sem espera",
          "Motoristas-guias profissionais",
          "Serviço 9h - 19h diariamente",
          "Grupos pequenos (máx. 8 pessoas)",
          "Rastreamento em tempo real",
        ],
        bookNow: "Reserve o Seu Passe",
      },
      insightTour: {
        title: "Tour Insight",
        description: "Mergulho profundo na história e cultura de Sintra",
        features: [
          "Guia local especialista",
          "Narrativas históricas detalhadas",
          "Acesso sem fila aos monumentos",
          "Grupos pequenos e íntimos",
          "Joias escondidas e histórias locais",
          "Experiência de dia inteiro",
        ],
        bookNow: "Reservar Tour Insight",
      },
      monuments: {
        title: "Bilhetes para Monumentos",
        description: "Evite filas nas principais atrações de Sintra",
        features: [
          "Entrada no Palácio da Pena",
          "Quinta da Regaleira",
          "Acesso ao Castelo dos Mouros",
          "Palácio de Monserrate",
          "Entrada prioritária",
          "Válido por um dia",
        ],
        bookNow: "Comprar Bilhetes",
      },
    },
    
    bookingCard: {
      title: "Reserve o Seu Passe",
      selectDate: "Selecione a Data",
      quantity: "Quantidade",
      total: "Total",
      bookNow: "Reservar Agora",
    },
    
    manualBooking: {
      title: "Criar Reserva Manual",
      subtitle: "Para vendas no local",
      step1Title: "Detalhes do Cliente",
      step1Description: "Informação básica",
      customerName: "Nome do Cliente",
      customerNamePlaceholder: "Nome completo",
      customerEmail: "Email do Cliente",
      customerEmailPlaceholder: "email@exemplo.com",
      nextDetails: "Próximo: Passes",
      step2Title: "Selecionar Passes",
      step2Description: "Toque para ajustar",
      selectPasses: "Selecionar Passes",
      tapToAdjust: "Toque para ajustar",
      nextAddons: "Próximo: Extras",
      step3Title: "Extras",
      step3Description: "Opcionais",
      guidedTour: "Comentário Guiado",
      guidedTourDescription: "Experiência melhorada com narrativas detalhadas",
      attractions: "Bilhetes de Atrações",
      selectAttractions: "Selecione quais atrações incluir",
      step4Title: "Pagamento",
      step4Description: "Como o cliente vai pagar?",
      paymentMethod: "Método de Pagamento",
      cash: "Dinheiro",
      card: "Cartão",
      createBooking: "Criar Reserva",
      bookingCreated: "Reserva Criada!",
      shareIdWithCustomer: "Partilhe este ID com o cliente",
      customer: "Cliente",
      totalPaid: "Total Pago",
      payment: "Pagamento",
      ticketsSentTo: "Bilhetes enviados para",
      passengersCheckedIn: "Passageiros automaticamente registados",
      createAnother: "Criar Outra Reserva",
      backToAdmin: "Voltar ao Admin",
      errorCreatingBooking: "Erro ao criar reserva",
      pleaseTryAgain: "Por favor tente novamente",
      goBack: "Voltar",
    },
  },
  es: {
    perPass: "por pase",
    quantity: "Cantidad",
    each: "cada",
    back: "Volver",
    next: "Siguiente",
    adult: "Adulto",
    
    productCard: {
      daypass: {
        title: "Pase de Día Completo",
        description: "Viajes ilimitados por todas las atracciones de Sintra",
        features: [
          "Viajes ilimitados hop-on hop-off",
          "Asientos garantizados - sin espera",
          "Conductores-guías profesionales",
          "Servicio 9am - 7pm diariamente",
          "Grupos pequeños (máx. 8 personas)",
          "Seguimiento en tiempo real",
        ],
        bookNow: "Reserve Su Pase",
      },
      insightTour: {
        title: "Tour Insight",
        description: "Inmersión profunda en la historia y cultura de Sintra",
        features: [
          "Guía local experto",
          "Narrativas históricas detalladas",
          "Acceso sin colas a monumentos",
          "Grupos pequeños e íntimos",
          "Gemas ocultas e historias locales",
          "Experiencia de día completo",
        ],
        bookNow: "Reservar Tour Insight",
      },
      monuments: {
        title: "Entradas a Monumentos",
        description: "Evite las colas en las principales atracciones de Sintra",
        features: [
          "Entrada al Palacio de Pena",
          "Quinta da Regaleira",
          "Acceso al Castillo de los Moros",
          "Palacio de Monserrate",
          "Entrada prioritaria",
          "Válido por un día",
        ],
        bookNow: "Comprar Entradas",
      },
    },
    
    bookingCard: {
      title: "Reserva Tu Pase",
      selectDate: "Seleccionar Fecha",
      quantity: "Cantidad",
      total: "Total",
      bookNow: "Reservar Ahora",
    },
    
    manualBooking: {
      title: "Crear Reserva Manual",
      subtitle: "Para ventas en el lugar",
      step1Title: "Detalles del Cliente",
      step1Description: "Información básica",
      customerName: "Nombre del Cliente",
      customerNamePlaceholder: "Nombre completo",
      customerEmail: "Email del Cliente",
      customerEmailPlaceholder: "email@ejemplo.com",
      nextDetails: "Siguiente: Pases",
      step2Title: "Seleccionar Pases",
      step2Description: "Toque para ajustar",
      selectPasses: "Seleccionar Pases",
      tapToAdjust: "Toque para ajustar",
      nextAddons: "Siguiente: Extras",
      step3Title: "Extras",
      step3Description: "Opcionales",
      guidedTour: "Comentario Guiado",
      guidedTourDescription: "Experiencia mejorada con narrativas detalladas",
      attractions: "Entradas a Atracciones",
      selectAttractions: "Seleccione qué atracciones incluir",
      step4Title: "Pago",
      step4Description: "¿Cómo pagará el cliente?",
      paymentMethod: "Método de Pago",
      cash: "Efectivo",
      card: "Tarjeta",
      createBooking: "Crear Reserva",
      bookingCreated: "¡Reserva Creada!",
      shareIdWithCustomer: "Comparte este ID con el cliente",
      customer: "Cliente",
      totalPaid: "Total Pagado",
      payment: "Pago",
      ticketsSentTo: "Entradas enviadas a",
      passengersCheckedIn: "Pasajeros registrados automáticamente",
      createAnother: "Crear Otra Reserva",
      backToAdmin: "Volver al Admin",
      errorCreatingBooking: "Error al crear reserva",
      pleaseTryAgain: "Por favor intente de nuevo",
      goBack: "Volver",
    },
  },
  fr: {
    perPass: "par pass",
    quantity: "Quantité",
    each: "chaque",
    back: "Retour",
    next: "Suivant",
    adult: "Adulte",
    
    productCard: {
      daypass: {
        title: "Pass Journée Complète",
        description: "Trajets illimités dans toutes les attractions de Sintra",
        features: [
          "Trajets illimités hop-on hop-off",
          "Sièges garantis - pas d'attente",
          "Chauffeurs-guides professionnels",
          "Service 9h - 19h quotidien",
          "Petits groupes (max. 8 personnes)",
          "Suivi en temps réel",
        ],
        bookNow: "Réservez Votre Pass",
      },
      insightTour: {
        title: "Tour Insight",
        description: "Plongée profonde dans l'histoire et la culture de Sintra",
        features: [
          "Guide local expert",
          "Récits historiques détaillés",
          "Accès coupe-file aux monuments",
          "Petits groupes intimes",
          "Joyaux cachés et histoires locales",
          "Expérience d'une journée complète",
        ],
        bookNow: "Réserver Tour Insight",
      },
      monuments: {
        title: "Billets pour Monuments",
        description: "Évitez les files aux principales attractions de Sintra",
        features: [
          "Entrée au Palais de Pena",
          "Quinta da Regaleira",
          "Accès au Château Maure",
          "Palais de Monserrate",
          "Entrée prioritaire",
          "Valable pour un jour",
        ],
        bookNow: "Acheter Billets",
      },
    },
    
    bookingCard: {
      title: "Réservez Votre Pass",
      selectDate: "Sélectionner la Date",
      quantity: "Quantité",
      total: "Total",
      bookNow: "Réserver Maintenant",
    },
    
    manualBooking: {
      title: "Créer une Réservation Manuelle",
      subtitle: "Pour les ventes sur place",
      step1Title: "Détails du Client",
      step1Description: "Informations de base",
      customerName: "Nom du Client",
      customerNamePlaceholder: "Nom complet",
      customerEmail: "Email du Client",
      customerEmailPlaceholder: "email@exemple.com",
      nextDetails: "Suivant: Pass",
      step2Title: "Sélectionner les Pass",
      step2Description: "Touchez pour ajuster",
      selectPasses: "Sélectionner les Pass",
      tapToAdjust: "Touchez pour ajuster",
      nextAddons: "Suivant: Extras",
      step3Title: "Extras",
      step3Description: "Optionnels",
      guidedTour: "Commentaires Guidés",
      guidedTourDescription: "Expérience améliorée avec récits détaillés",
      attractions: "Billets d'Attractions",
      selectAttractions: "Sélectionnez les attractions à inclure",
      step4Title: "Paiement",
      step4Description: "Comment le client paiera-t-il?",
      paymentMethod: "Méthode de Paiement",
      cash: "Espèces",
      card: "Carte",
      createBooking: "Créer une Réservation",
      bookingCreated: "Réservation Créée!",
      shareIdWithCustomer: "Partagez cet ID avec le client",
      customer: "Client",
      totalPaid: "Total Payé",
      payment: "Paiement",
      ticketsSentTo: "Billets envoyés à",
      passengersCheckedIn: "Passagers enregistrés automatiquement",
      createAnother: "Créer une Autre Réservation",
      backToAdmin: "Retour à l'Admin",
      errorCreatingBooking: "Erreur lors de la création de la réservation",
      pleaseTryAgain: "Veuillez réessayer",
      goBack: "Retour",
    },
  },
  de: {
    perPass: "pro Pass",
    quantity: "Menge",
    each: "jeder",
    back: "Zurück",
    next: "Weiter",
    adult: "Erwachsener",
    
    productCard: {
      daypass: {
        title: "Ganztagespass",
        description: "Unbegrenzte Fahrten zu allen Sintra-Attraktionen",
        features: [
          "Unbegrenzte Hop-on-Hop-off-Fahrten",
          "Garantierte Sitzplätze - kein Warten",
          "Professionelle Fahrer-Guides",
          "Service 9-19 Uhr täglich",
          "Kleine Gruppen (max. 8 Personen)",
          "Echtzeit-Fahrzeugverfolgung",
        ],
        bookNow: "Buchen Sie Ihren Pass",
      },
      insightTour: {
        title: "Insight Tour",
        description: "Tiefer Einblick in Sintras Geschichte und Kultur",
        features: [
          "Experten-Ortsführer",
          "Detaillierte historische Erzählungen",
          "Schnelleinlass zu Monumenten",
          "Kleine intime Gruppen",
          "Versteckte Juwelen und lokale Geschichten",
          "Ganztägige Erfahrung",
        ],
        bookNow: "Insight Tour Buchen",
      },
      monuments: {
        title: "Monument-Tickets",
        description: "Überspringen Sie die Warteschlange bei Sintras Top-Attraktionen",
        features: [
          "Eintritt zum Pena-Palast",
          "Quinta da Regaleira",
          "Zugang zur Maurenburg",
          "Monserrate-Palast",
          "Prioritätseinlass",
          "Gültig für einen Tag",
        ],
        bookNow: "Tickets Kaufen",
      },
    },
    
    bookingCard: {
      title: "Buchen Sie Ihren Pass",
      selectDate: "Datum Auswählen",
      quantity: "Menge",
      total: "Gesamt",
      bookNow: "Jetzt Buchen",
    },
    
    manualBooking: {
      title: "Manuelle Buchung Erstellen",
      subtitle: "Für Walk-ins und Verkäufe vor Ort",
      step1Title: "Kundendetails",
      step1Description: "Grundlegende Informationen",
      customerName: "Kundenname",
      customerNamePlaceholder: "Vollständiger Name",
      customerEmail: "Kunden-E-Mail",
      customerEmailPlaceholder: "email@beispiel.com",
      nextDetails: "Weiter: Pässe",
      step2Title: "Pässe Auswählen",
      step2Description: "Tippen zum Anpassen",
      selectPasses: "Pässe Auswählen",
      tapToAdjust: "Tippen zum Anpassen",
      nextAddons: "Weiter: Extras",
      step3Title: "Extras",
      step3Description: "Optionale Extras",
      guidedTour: "Geführte Kommentare",
      guidedTourDescription: "Verbessertes Erlebnis mit detaillierten Erzählungen",
      attractions: "Attraktionstickets",
      selectAttractions: "Wählen Sie, welche Attraktionen einbezogen werden sollen",
      step4Title: "Zahlung",
      step4Description: "Wie wird der Kunde bezahlen?",
      paymentMethod: "Zahlungsmethode",
      cash: "Bargeld",
      card: "Karte",
      createBooking: "Buchung Erstellen",
      bookingCreated: "Buchung Erstellt!",
      shareIdWithCustomer: "Teilen Sie diese ID mit dem Kunden",
      customer: "Kunde",
      totalPaid: "Gesamt Bezahlt",
      payment: "Zahlung",
      ticketsSentTo: "Tickets gesendet an",
      passengersCheckedIn: "Passagiere automatisch eingecheckt",
      createAnother: "Weitere Buchung Erstellen",
      backToAdmin: "Zurück zum Admin",
      errorCreatingBooking: "Fehler beim Erstellen der Buchung",
      pleaseTryAgain: "Bitte versuchen Sie es erneut",
      goBack: "Zurück",
    },
  },
  nl: {
    perPass: "per pas",
    quantity: "Aantal",
    each: "elk",
    back: "Terug",
    next: "Volgende",
    adult: "Volwassene",
    
    productCard: {
      daypass: {
        title: "Dagpas",
        description: "Onbeperkte ritten naar alle attracties van Sintra",
        features: [
          "Onbeperkte hop-on hop-off ritten",
          "Gegarandeerde zitplaatsen - geen wachten",
          "Professionele chauffeur-gidsen",
          "Service 9-19 uur dagelijks",
          "Kleine groepen (max. 8 personen)",
          "Real-time voertuigvolging",
        ],
        bookNow: "Boek Uw Pas",
      },
      insightTour: {
        title: "Insight Tour",
        description: "Diepe duik in de geschiedenis en cultuur van Sintra",
        features: [
          "Expert lokale gids",
          "Gedetailleerde historische verhalen",
          "Skip-the-line monumententoegang",
          "Kleine intieme groepen",
          "Verborgen juweeltjes en lokale verhalen",
          "Volledige dagervaring",
        ],
        bookNow: "Boek Insight Tour",
      },
      monuments: {
        title: "Monumentkaarten",
        description: "Sla de rij over bij Sintra's topattracties",
        features: [
          "Toegang tot Pena Paleis",
          "Quinta da Regaleira",
          "Toegang tot Moorse Kasteel",
          "Monserrate Paleis",
          "Prioriteitstoegang",
          "Geldig voor één dag",
        ],
        bookNow: "Koop Tickets",
      },
    },
    
    bookingCard: {
      title: "Boek Uw Dagpas",
      selectDate: "Selecteer Datum",
      quantity: "Aantal",
      total: "Totaal",
      bookNow: "Nu Boeken",
    },
    
    manualBooking: {
      title: "Handmatige Boeking Maken",
      subtitle: "Voor walk-ins en verkoop ter plaatse",
      step1Title: "Klantgegevens",
      step1Description: "Basisinformatie",
      customerName: "Klantnaam",
      customerNamePlaceholder: "Volledige naam",
      customerEmail: "Klant E-mail",
      customerEmailPlaceholder: "email@voorbeeld.com",
      nextDetails: "Volgende: Passen",
      step2Title: "Passen Selecteren",
      step2Description: "Tik om aan te passen",
      selectPasses: "Passen Selecteren",
      tapToAdjust: "Tik om aan te passen",
      nextAddons: "Volgende: Extra's",
      step3Title: "Extra's",
      step3Description: "Optionele extra's",
      guidedTour: "Begeleide Commentaar",
      guidedTourDescription: "Verbeterde ervaring met gedetailleerde verhalen",
      attractions: "Attractiekaarten",
      selectAttractions: "Selecteer welke attracties u wilt opnemen",
      step4Title: "Betaling",
      step4Description: "Hoe betaalt de klant?",
      paymentMethod: "Betaalmethode",
      cash: "Contant",
      card: "Kaart",
      createBooking: "Boeking Maken",
      bookingCreated: "Boeking Gemaakt!",
      shareIdWithCustomer: "Deel dit ID met de klant",
      customer: "Klant",
      totalPaid: "Totaal Betaald",
      payment: "Betaling",
      ticketsSentTo: "Tickets verzonden naar",
      passengersCheckedIn: "Passagiers automatisch ingecheckt",
      createAnother: "Maak Nog Een Boeking",
      backToAdmin: "Terug naar Admin",
      errorCreatingBooking: "Fout bij het maken van boeking",
      pleaseTryAgain: "Probeer het opnieuw",
      goBack: "Ga Terug",
    },
  },
  it: {
    perPass: "per pass",
    quantity: "Quantità",
    each: "ciascuno",
    back: "Indietro",
    next: "Avanti",
    adult: "Adulto",
    
    productCard: {
      daypass: {
        title: "Pass Giornaliero Completo",
        description: "Corse illimitate a tutte le attrazioni di Sintra",
        features: [
          "Corse illimitate hop-on hop-off",
          "Posti garantiti - nessuna attesa",
          "Autisti-guide professionisti",
          "Servizio 9-19 quotidiano",
          "Piccoli gruppi (max 8 persone)",
          "Tracciamento veicolo in tempo reale",
        ],
        bookNow: "Prenota Il Tuo Pass",
      },
      insightTour: {
        title: "Insight Tour",
        description: "Immersione profonda nella storia e cultura di Sintra",
        features: [
          "Guida locale esperta",
          "Narrazioni storiche dettagliate",
          "Accesso salta-fila ai monumenti",
          "Piccoli gruppi intimi",
          "Gemme nascoste e storie locali",
          "Esperienza di giornata intera",
        ],
        bookNow: "Prenota Insight Tour",
      },
      monuments: {
        title: "Biglietti Monumenti",
        description: "Salta la fila alle principali attrazioni di Sintra",
        features: [
          "Ingresso al Palazzo di Pena",
          "Quinta da Regaleira",
          "Accesso al Castello Moresco",
          "Palazzo di Monserrate",
          "Ingresso prioritario",
          "Valido per un giorno",
        ],
        bookNow: "Acquista Biglietti",
      },
    },
    
    bookingCard: {
      title: "Prenota Il Tuo Pass",
      selectDate: "Seleziona Data",
      quantity: "Quantità",
      total: "Totale",
      bookNow: "Prenota Ora",
    },
    
    manualBooking: {
      title: "Crea Prenotazione Manuale",
      subtitle: "Per walk-in e vendite in loco",
      step1Title: "Dettagli Cliente",
      step1Description: "Informazioni di base",
      customerName: "Nome Cliente",
      customerNamePlaceholder: "Nome completo",
      customerEmail: "Email Cliente",
      customerEmailPlaceholder: "email@esempio.com",
      nextDetails: "Avanti: Pass",
      step2Title: "Seleziona Pass",
      step2Description: "Tocca per regolare",
      selectPasses: "Seleziona Pass",
      tapToAdjust: "Tocca per regolare",
      nextAddons: "Avanti: Extra",
      step3Title: "Extra",
      step3Description: "Opzionali",
      guidedTour: "Commento Guidato",
      guidedTourDescription: "Esperienza migliorata con narrazioni dettagliate",
      attractions: "Biglietti Attrazioni",
      selectAttractions: "Seleziona quali attrazioni includere",
      step4Title: "Pagamento",
      step4Description: "Come pagherà il cliente?",
      paymentMethod: "Metodo di Pagamento",
      cash: "Contanti",
      card: "Carta",
      createBooking: "Crea Prenotazione",
      bookingCreated: "Prenotazione Creata!",
      shareIdWithCustomer: "Condividi questo ID con il cliente",
      customer: "Cliente",
      totalPaid: "Totale Pagato",
      payment: "Pagamento",
      ticketsSentTo: "Biglietti inviati a",
      passengersCheckedIn: "Passeggeri registrati automaticamente",
      createAnother: "Crea Altra Prenotazione",
      backToAdmin: "Torna all'Admin",
      errorCreatingBooking: "Errore nella creazione della prenotazione",
      pleaseTryAgain: "Riprova per favore",
      goBack: "Torna Indietro",
    },
  },
};

export function getComponentTranslation(languageCode: string): ComponentTranslations {
  return componentTranslations[languageCode] || componentTranslations.en;
}
