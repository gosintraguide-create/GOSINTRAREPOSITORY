import { WebsiteContent } from '../contentManager';
import { en } from './en';
import { pt } from './pt';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';

export const translations: { [key: string]: WebsiteContent } = {
  en,
  pt,
  es,
  fr,
  de,
};

export function getTranslation(languageCode: string): WebsiteContent {
  return translations[languageCode] || translations.en;
}

// UI translations for components (buttons, labels, etc.)
export interface UITranslations {
  // Navigation
  home: string;
  howItWorks: string;
  attractions: string;
  manageBooking: string;
  buyTicket: string;
  about: string;
  contact: string;
  
  // Common actions
  bookNow: string;
  learnMore: string;
  close: string;
  submit: string;
  cancel: string;
  download: string;
  print: string;
  
  // Booking flow
  selectDate: string;
  selectPassengers: string;
  addPassenger: string;
  passengerName: string;
  passengerType: string;
  adult: string;
  child: string;
  infant: string;
  total: string;
  confirmBooking: string;
  bookingConfirmed: string;
  
  // Request Pickup
  requestPickup: string;
  currentLocation: string;
  trackVehicle: string;
  estimatedArrival: string;
  
  // Live Chat
  chatWithUs: string;
  needHelp: string;
  whatsappUs: string;
  
  // Common phrases
  operatingHours: string;
  perPerson: string;
  fullDay: string;
  passengers: string;
  bookingId: string;
  date: string;
  
  // Footer
  quickLinks: string;
  contactInfo: string;
  followUs: string;
  
  // Attraction details
  ticketPrice: string;
  openingHours: string;
  recommendedDuration: string;
  highlights: string;
  tips: string;
  buyAttractionTicket: string;
}

export const uiTranslations: { [key: string]: UITranslations } = {
  en: {
    home: "Home",
    howItWorks: "How It Works",
    attractions: "Attractions",
    manageBooking: "My Booking",
    buyTicket: "Buy Day Pass",
    about: "About & Contact",
    contact: "Contact",
    
    bookNow: "Book Now",
    learnMore: "Learn More",
    close: "Close",
    submit: "Submit",
    cancel: "Cancel",
    download: "Download",
    print: "Print",
    
    selectDate: "Select Date",
    selectPassengers: "Select Passengers",
    addPassenger: "Add Passenger",
    passengerName: "Passenger Name",
    passengerType: "Passenger Type",
    adult: "Adult",
    child: "Child (4-12)",
    infant: "Infant (0-3)",
    total: "Total",
    confirmBooking: "Confirm Booking",
    bookingConfirmed: "Booking Confirmed!",
    
    requestPickup: "Request Pickup",
    currentLocation: "Current Location",
    trackVehicle: "Track Vehicle",
    estimatedArrival: "Estimated Arrival",
    
    chatWithUs: "Chat with us",
    needHelp: "Need help?",
    whatsappUs: "WhatsApp Us",
    
    operatingHours: "Operating Hours",
    perPerson: "per person",
    fullDay: "full day",
    passengers: "passengers",
    bookingId: "Booking ID",
    date: "Date",
    
    quickLinks: "Quick Links",
    contactInfo: "Contact Info",
    followUs: "Follow Us",
    
    ticketPrice: "Ticket Price",
    openingHours: "Opening Hours",
    recommendedDuration: "Recommended Duration",
    highlights: "Highlights",
    tips: "Tips",
    buyAttractionTicket: "Buy Attraction Ticket",
  },
  pt: {
    home: "Início",
    howItWorks: "Como Funciona",
    attractions: "Atrações",
    manageBooking: "Minha Reserva",
    buyTicket: "Comprar Passe",
    about: "Sobre & Contacto",
    contact: "Contacto",
    
    bookNow: "Reservar Agora",
    learnMore: "Saber Mais",
    close: "Fechar",
    submit: "Enviar",
    cancel: "Cancelar",
    download: "Descarregar",
    print: "Imprimir",
    
    selectDate: "Selecionar Data",
    selectPassengers: "Selecionar Passageiros",
    addPassenger: "Adicionar Passageiro",
    passengerName: "Nome do Passageiro",
    passengerType: "Tipo de Passageiro",
    adult: "Adulto",
    child: "Criança (4-12)",
    infant: "Bebé (0-3)",
    total: "Total",
    confirmBooking: "Confirmar Reserva",
    bookingConfirmed: "Reserva Confirmada!",
    
    requestPickup: "Solicitar Recolha",
    currentLocation: "Localização Atual",
    trackVehicle: "Rastrear Veículo",
    estimatedArrival: "Chegada Estimada",
    
    chatWithUs: "Converse connosco",
    needHelp: "Precisa de ajuda?",
    whatsappUs: "WhatsApp",
    
    operatingHours: "Horário de Funcionamento",
    perPerson: "por pessoa",
    fullDay: "dia completo",
    passengers: "passageiros",
    bookingId: "ID da Reserva",
    date: "Data",
    
    quickLinks: "Links Rápidos",
    contactInfo: "Informações de Contacto",
    followUs: "Siga-nos",
    
    ticketPrice: "Preço do Bilhete",
    openingHours: "Horário de Abertura",
    recommendedDuration: "Duração Recomendada",
    highlights: "Destaques",
    tips: "Dicas",
    buyAttractionTicket: "Comprar Bilhete da Atração",
  },
  es: {
    home: "Inicio",
    howItWorks: "Cómo Funciona",
    attractions: "Atracciones",
    manageBooking: "Mi Reserva",
    buyTicket: "Comprar Pase",
    about: "Sobre & Contacto",
    contact: "Contacto",
    
    bookNow: "Reservar Ahora",
    learnMore: "Saber Más",
    close: "Cerrar",
    submit: "Enviar",
    cancel: "Cancelar",
    download: "Descargar",
    print: "Imprimir",
    
    selectDate: "Seleccionar Fecha",
    selectPassengers: "Seleccionar Pasajeros",
    addPassenger: "Añadir Pasajero",
    passengerName: "Nombre del Pasajero",
    passengerType: "Tipo de Pasajero",
    adult: "Adulto",
    child: "Niño (4-12)",
    infant: "Bebé (0-3)",
    total: "Total",
    confirmBooking: "Confirmar Reserva",
    bookingConfirmed: "¡Reserva Confirmada!",
    
    requestPickup: "Solicitar Recogida",
    currentLocation: "Ubicación Actual",
    trackVehicle: "Rastrear Vehículo",
    estimatedArrival: "Llegada Estimada",
    
    chatWithUs: "Chatea con nosotros",
    needHelp: "¿Necesitas ayuda?",
    whatsappUs: "WhatsApp",
    
    operatingHours: "Horario de Operación",
    perPerson: "por persona",
    fullDay: "día completo",
    passengers: "pasajeros",
    bookingId: "ID de Reserva",
    date: "Fecha",
    
    quickLinks: "Enlaces Rápidos",
    contactInfo: "Información de Contacto",
    followUs: "Síguenos",
    
    ticketPrice: "Precio de Entrada",
    openingHours: "Horario de Apertura",
    recommendedDuration: "Duración Recomendada",
    highlights: "Aspectos Destacados",
    tips: "Consejos",
    buyAttractionTicket: "Comprar Entrada de Atracción",
  },
  fr: {
    home: "Accueil",
    howItWorks: "Comment Ça Marche",
    attractions: "Attractions",
    manageBooking: "Ma Réservation",
    buyTicket: "Acheter Pass",
    about: "À Propos & Contact",
    contact: "Contact",
    
    bookNow: "Réserver Maintenant",
    learnMore: "En Savoir Plus",
    close: "Fermer",
    submit: "Soumettre",
    cancel: "Annuler",
    download: "Télécharger",
    print: "Imprimer",
    
    selectDate: "Sélectionner la Date",
    selectPassengers: "Sélectionner les Passagers",
    addPassenger: "Ajouter un Passager",
    passengerName: "Nom du Passager",
    passengerType: "Type de Passager",
    adult: "Adulte",
    child: "Enfant (4-12)",
    infant: "Bébé (0-3)",
    total: "Total",
    confirmBooking: "Confirmer la Réservation",
    bookingConfirmed: "Réservation Confirmée!",
    
    requestPickup: "Demander un Ramassage",
    currentLocation: "Localisation Actuelle",
    trackVehicle: "Suivre le Véhicule",
    estimatedArrival: "Arrivée Estimée",
    
    chatWithUs: "Chattez avec nous",
    needHelp: "Besoin d'aide?",
    whatsappUs: "WhatsApp",
    
    operatingHours: "Heures d'Ouverture",
    perPerson: "par personne",
    fullDay: "journée complète",
    passengers: "passagers",
    bookingId: "ID de Réservation",
    date: "Date",
    
    quickLinks: "Liens Rapides",
    contactInfo: "Informations de Contact",
    followUs: "Suivez-nous",
    
    ticketPrice: "Prix du Billet",
    openingHours: "Heures d'Ouverture",
    recommendedDuration: "Durée Recommandée",
    highlights: "Points Forts",
    tips: "Conseils",
    buyAttractionTicket: "Acheter un Billet d'Attraction",
  },
  de: {
    home: "Startseite",
    howItWorks: "So Funktioniert's",
    attractions: "Sehenswürdigkeiten",
    manageBooking: "Meine Buchung",
    buyTicket: "Pass Kaufen",
    about: "Über & Kontakt",
    contact: "Kontakt",
    
    bookNow: "Jetzt Buchen",
    learnMore: "Mehr Erfahren",
    close: "Schließen",
    submit: "Absenden",
    cancel: "Abbrechen",
    download: "Herunterladen",
    print: "Drucken",
    
    selectDate: "Datum Auswählen",
    selectPassengers: "Passagiere Auswählen",
    addPassenger: "Passagier Hinzufügen",
    passengerName: "Passagiername",
    passengerType: "Passagiertyp",
    adult: "Erwachsener",
    child: "Kind (4-12)",
    infant: "Kleinkind (0-3)",
    total: "Gesamt",
    confirmBooking: "Buchung Bestätigen",
    bookingConfirmed: "Buchung Bestätigt!",
    
    requestPickup: "Abholung Anfordern",
    currentLocation: "Aktueller Standort",
    trackVehicle: "Fahrzeug Verfolgen",
    estimatedArrival: "Geschätzte Ankunft",
    
    chatWithUs: "Chatten Sie mit uns",
    needHelp: "Brauchen Sie Hilfe?",
    whatsappUs: "WhatsApp",
    
    operatingHours: "Betriebszeiten",
    perPerson: "pro Person",
    fullDay: "ganzer Tag",
    passengers: "Passagiere",
    bookingId: "Buchungs-ID",
    date: "Datum",
    
    quickLinks: "Schnelllinks",
    contactInfo: "Kontaktinformationen",
    followUs: "Folgen Sie uns",
    
    ticketPrice: "Ticketpreis",
    openingHours: "Öffnungszeiten",
    recommendedDuration: "Empfohlene Dauer",
    highlights: "Highlights",
    tips: "Tipps",
    buyAttractionTicket: "Sehenswürdigkeiten-Ticket Kaufen",
  },
};

export function getUITranslation(languageCode: string): UITranslations {
  return uiTranslations[languageCode] || uiTranslations.en;
}

// Cookie Consent Translations
export interface CookieContent {
  title: string;
  description: string;
  privacyLink: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  settingsTitle: string;
  settingsDescription: string;
  savePreferences: string;
  categories: {
    necessary: { title: string; description: string };
    functional: { title: string; description: string };
    analytics: { title: string; description: string };
    marketing: { title: string; description: string };
  };
}

export const cookieTranslations: { [key: string]: CookieContent } = {
  en: {
    title: "We Value Your Privacy",
    description: "We use cookies to enhance your browsing experience, personalize content, and analyze our traffic. Read our",
    privacyLink: "Privacy Policy",
    acceptAll: "Accept All",
    rejectAll: "Reject All",
    customize: "Customize",
    settingsTitle: "Cookie Settings",
    settingsDescription: "Choose which cookies you want to accept. You can change your preferences at any time.",
    savePreferences: "Save Preferences",
    categories: {
      necessary: {
        title: "Necessary Cookies",
        description: "Essential for the website to function properly. These cookies enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies."
      },
      functional: {
        title: "Functional Cookies",
        description: "Help us remember your preferences and settings, such as language selection, to provide you with a more personalized experience."
      },
      analytics: {
        title: "Analytics Cookies",
        description: "Help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our service."
      },
      marketing: {
        title: "Marketing Cookies",
        description: "Used to track visitors across websites to display relevant advertisements and encourage them to engage with our service."
      }
    }
  },
  pt: {
    title: "Valorizamos a Sua Privacidade",
    description: "Utilizamos cookies para melhorar a sua experiência de navegação, personalizar conteúdo e analisar o nosso tráfego. Leia a nossa",
    privacyLink: "Política de Privacidade",
    acceptAll: "Aceitar Todos",
    rejectAll: "Rejeitar Todos",
    customize: "Personalizar",
    settingsTitle: "Configurações de Cookies",
    settingsDescription: "Escolha quais cookies deseja aceitar. Pode alterar as suas preferências a qualquer momento.",
    savePreferences: "Guardar Preferências",
    categories: {
      necessary: {
        title: "Cookies Necessários",
        description: "Essenciais para o funcionamento adequado do website. Estes cookies permitem funcionalidades essenciais como segurança, gestão de rede e acessibilidade. Não pode desativar estes cookies."
      },
      functional: {
        title: "Cookies Funcionais",
        description: "Ajudam-nos a lembrar as suas preferências e configurações, como a seleção de idioma, para lhe proporcionar uma experiência mais personalizada."
      },
      analytics: {
        title: "Cookies de Análise",
        description: "Ajudam-nos a compreender como os visitantes interagem com o nosso website, recolhendo e reportando informações anonimamente. Isto ajuda-nos a melhorar o nosso serviço."
      },
      marketing: {
        title: "Cookies de Marketing",
        description: "Utilizados para rastrear visitantes em websites para exibir anúncios relevantes e incentivá-los a interagir com o nosso serviço."
      }
    }
  },
  es: {
    title: "Valoramos Su Privacidad",
    description: "Utilizamos cookies para mejorar su experiencia de navegación, personalizar el contenido y analizar nuestro tráfico. Lea nuestra",
    privacyLink: "Política de Privacidad",
    acceptAll: "Aceptar Todo",
    rejectAll: "Rechazar Todo",
    customize: "Personalizar",
    settingsTitle: "Configuración de Cookies",
    settingsDescription: "Elija qué cookies desea aceptar. Puede cambiar sus preferencias en cualquier momento.",
    savePreferences: "Guardar Preferencias",
    categories: {
      necessary: {
        title: "Cookies Necesarias",
        description: "Esenciales para que el sitio web funcione correctamente. Estas cookies habilitan funciones básicas como seguridad, gestión de red y accesibilidad. No puede rechazar estas cookies."
      },
      functional: {
        title: "Cookies Funcionales",
        description: "Nos ayudan a recordar sus preferencias y configuraciones, como la selección de idioma, para brindarle una experiencia más personalizada."
      },
      analytics: {
        title: "Cookies de Análisis",
        description: "Nos ayudan a comprender cómo los visitantes interactúan con nuestro sitio web al recopilar e informar información de forma anónima. Esto nos ayuda a mejorar nuestro servicio."
      },
      marketing: {
        title: "Cookies de Marketing",
        description: "Se utilizan para rastrear visitantes en sitios web para mostrar anuncios relevantes y alentarlos a interactuar con nuestro servicio."
      }
    }
  },
  fr: {
    title: "Nous Valorisons Votre Vie Privée",
    description: "Nous utilisons des cookies pour améliorer votre expérience de navigation, personnaliser le contenu et analyser notre trafic. Lisez notre",
    privacyLink: "Politique de Confidentialité",
    acceptAll: "Tout Accepter",
    rejectAll: "Tout Refuser",
    customize: "Personnaliser",
    settingsTitle: "Paramètres des Cookies",
    settingsDescription: "Choisissez les cookies que vous souhaitez accepter. Vous pouvez modifier vos préférences à tout moment.",
    savePreferences: "Enregistrer les Préférences",
    categories: {
      necessary: {
        title: "Cookies Nécessaires",
        description: "Essentiels au bon fonctionnement du site web. Ces cookies permettent des fonctionnalités de base telles que la sécurité, la gestion du réseau et l'accessibilité. Vous ne pouvez pas refuser ces cookies."
      },
      functional: {
        title: "Cookies Fonctionnels",
        description: "Nous aident à mémoriser vos préférences et paramètres, comme la sélection de langue, pour vous offrir une expérience plus personnalisée."
      },
      analytics: {
        title: "Cookies d'Analyse",
        description: "Nous aident à comprendre comment les visiteurs interagissent avec notre site web en collectant et en rapportant des informations de manière anonyme. Cela nous aide à améliorer notre service."
      },
      marketing: {
        title: "Cookies Marketing",
        description: "Utilisés pour suivre les visiteurs sur les sites web afin d'afficher des publicités pertinentes et de les encourager à interagir avec notre service."
      }
    }
  },
  de: {
    title: "Wir Schätzen Ihre Privatsphäre",
    description: "Wir verwenden Cookies, um Ihr Browsing-Erlebnis zu verbessern, Inhalte zu personalisieren und unseren Traffic zu analysieren. Lesen Sie unsere",
    privacyLink: "Datenschutzerklärung",
    acceptAll: "Alle Akzeptieren",
    rejectAll: "Alle Ablehnen",
    customize: "Anpassen",
    settingsTitle: "Cookie-Einstellungen",
    settingsDescription: "Wählen Sie aus, welche Cookies Sie akzeptieren möchten. Sie können Ihre Präferenzen jederzeit ändern.",
    savePreferences: "Einstellungen Speichern",
    categories: {
      necessary: {
        title: "Notwendige Cookies",
        description: "Wesentlich für das ordnungsgemäße Funktionieren der Website. Diese Cookies ermöglichen Kernfunktionen wie Sicherheit, Netzwerkverwaltung und Zugänglichkeit. Sie können diese Cookies nicht ablehnen."
      },
      functional: {
        title: "Funktionale Cookies",
        description: "Helfen uns, Ihre Präferenzen und Einstellungen wie die Sprachauswahl zu speichern, um Ihnen ein personalisierteres Erlebnis zu bieten."
      },
      analytics: {
        title: "Analyse-Cookies",
        description: "Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden. Dies hilft uns, unseren Service zu verbessern."
      },
      marketing: {
        title: "Marketing-Cookies",
        description: "Werden verwendet, um Besucher über Websites hinweg zu verfolgen, um relevante Werbung anzuzeigen und sie zu ermutigen, mit unserem Service zu interagieren."
      }
    }
  }
};

export function getCookieContent(languageCode: string): CookieContent {
  return cookieTranslations[languageCode] || cookieTranslations.en;
}

// Privacy Policy Translations
export interface PrivacyContent {
  title: string;
  lastUpdated: string;
  date: string;
  backToHome: string;
  sections: {
    introduction: { title: string; content: string[] };
    dataCollection: { title: string; intro: string; items: Array<{ title: string; description: string }> };
    dataUse: { title: string; items: string[] };
    dataSharing: { title: string; intro: string; items: string[] };
    cookies: { title: string; intro: string; items: Array<{ type: string; description: string }> };
    rights: { title: string; intro: string; items: string[] };
    security: { title: string; content: string[] };
    thirdParty: { title: string; intro: string; items: string[] };
    children: { title: string; content: string[] };
    contact: { title: string; intro: string };
  };
}

export const privacyTranslations: { [key: string]: PrivacyContent } = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated",
    date: "October 12, 2025",
    backToHome: "Back to Home",
    sections: {
      introduction: {
        title: "Introduction",
        content: [
          "Go Sintra (\"we\", \"our\", or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hop-on/hop-off day pass service in Sintra, Portugal.",
          "Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services."
        ]
      },
      dataCollection: {
        title: "Information We Collect",
        intro: "We collect information that you provide directly to us when booking our services:",
        items: [
          { title: "Personal Information", description: "Name, email address, phone number, and other contact details you provide during booking" },
          { title: "Payment Information", description: "Credit card details and billing information (processed securely through our payment provider)" },
          { title: "Booking Information", description: "Date of service, number of passengers, selected attractions, and pickup locations" },
          { title: "Usage Data", description: "Information about how you interact with our website, including pages visited, time spent, and navigation paths" },
          { title: "Location Data", description: "GPS location when you request pickup service (only with your permission)" },
          { title: "Device Information", description: "Browser type, operating system, IP address, and device identifiers" }
        ]
      },
      dataUse: {
        title: "How We Use Your Information",
        items: [
          "Process and fulfill your bookings and day pass purchases",
          "Send you booking confirmations, QR codes, and service-related communications",
          "Provide customer support and respond to your inquiries",
          "Improve our services and develop new features",
          "Send marketing communications (only with your consent)",
          "Prevent fraud and enhance security",
          "Comply with legal obligations and enforce our terms"
        ]
      },
      dataSharing: {
        title: "How We Share Your Information",
        intro: "We do not sell your personal information. We may share your information with:",
        items: [
          "Service providers who help us operate our business (payment processors, email services, cloud hosting)",
          "Our vehicle operators to coordinate pickups and verify passengers",
          "Attraction partners when you purchase bundled tickets",
          "Law enforcement or government authorities when required by law",
          "Business successors in the event of a merger, acquisition, or sale of assets"
        ]
      },
      cookies: {
        title: "Cookies and Tracking Technologies",
        intro: "We use cookies and similar technologies to enhance your experience:",
        items: [
          { type: "Necessary Cookies", description: "Essential for website functionality, security, and booking process" },
          { type: "Functional Cookies", description: "Remember your preferences like language selection" },
          { type: "Analytics Cookies", description: "Help us understand how visitors use our site to improve services" },
          { type: "Marketing Cookies", description: "Used to deliver relevant advertisements (only with your consent)" }
        ]
      },
      rights: {
        title: "Your Rights (GDPR)",
        intro: "As a user in the European Union, you have the following rights:",
        items: [
          "Right to Access: Request a copy of your personal data we hold",
          "Right to Rectification: Request correction of inaccurate or incomplete data",
          "Right to Erasure: Request deletion of your personal data (\"right to be forgotten\")",
          "Right to Restrict Processing: Request limitation on how we use your data",
          "Right to Data Portability: Receive your data in a structured, machine-readable format",
          "Right to Object: Object to our processing of your personal data",
          "Right to Withdraw Consent: Withdraw consent at any time (without affecting prior processing)"
        ]
      },
      security: {
        title: "Data Security",
        content: [
          "We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
          "Payment information is encrypted using industry-standard SSL/TLS protocols. We do not store complete credit card details on our servers.",
          "However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security."
        ]
      },
      thirdParty: {
        title: "Third-Party Services",
        intro: "Our website and services integrate with third-party providers:",
        items: [
          "Payment processing (Stripe or similar payment gateways)",
          "Email delivery (Resend for booking confirmations)",
          "Cloud hosting and database services (Supabase)",
          "WhatsApp for customer service communications",
          "Analytics services to improve our website"
        ]
      },
      children: {
        title: "Children's Privacy",
        content: [
          "Our services are not directed to children under 16. We do not knowingly collect personal information from children under 16.",
          "If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete it."
        ]
      },
      contact: {
        title: "Contact Us",
        intro: "If you have questions about this Privacy Policy or want to exercise your rights, please contact us:"
      }
    }
  },
  // Portuguese, Spanish, French, German versions would follow the same structure
  // For brevity, I'll create abbreviated versions
  pt: {
    title: "Política de Privacidade",
    lastUpdated: "Última Atualização",
    date: "12 de outubro de 2025",
    backToHome: "Voltar ao Início",
    sections: {
      introduction: {
        title: "Introdução",
        content: [
          "A Go Sintra (\"nós\", \"nosso\" ou \"nos\") está comprometida em proteger a sua privacidade. Esta Política de Privacidade explica como recolhemos, utilizamos, divulgamos e protegemos as suas informações quando utiliza o nosso serviço de passe diário hop-on/hop-off em Sintra, Portugal.",
          "Por favor, leia esta política de privacidade cuidadosamente. Se não concordar com os termos desta política de privacidade, não aceda ao site ou utilize os nossos serviços."
        ]
      },
      dataCollection: {
        title: "Informações que Recolhemos",
        intro: "Recolhemos informações que nos fornece diretamente ao reservar os nossos serviços:",
        items: [
          { title: "Informações Pessoais", description: "Nome, endereço de e-mail, número de telefone e outros detalhes de contacto fornecidos durante a reserva" },
          { title: "Informações de Pagamento", description: "Detalhes do cartão de crédito e informações de faturação (processados de forma segura através do nosso fornecedor de pagamentos)" },
          { title: "Informações de Reserva", description: "Data do serviço, número de passageiros, atrações selecionadas e locais de recolha" },
          { title: "Dados de Utilização", description: "Informações sobre como interage com o nosso website, incluindo páginas visitadas, tempo gasto e percursos de navegação" },
          { title: "Dados de Localização", description: "Localização GPS quando solicita o serviço de recolha (apenas com a sua permissão)" },
          { title: "Informações do Dispositivo", description: "Tipo de navegador, sistema operativo, endereço IP e identificadores do dispositivo" }
        ]
      },
      dataUse: {
        title: "Como Utilizamos as Suas Informações",
        items: [
          "Processar e cumprir as suas reservas e compras de passes diários",
          "Enviar confirmações de reserva, códigos QR e comunicações relacionadas com o serviço",
          "Fornecer apoio ao cliente e responder às suas questões",
          "Melhorar os nossos serviços e desenvolver novas funcionalidades",
          "Enviar comunicações de marketing (apenas com o seu consentimento)",
          "Prevenir fraudes e melhorar a segurança",
          "Cumprir obrigações legais e fazer cumprir os nossos termos"
        ]
      },
      dataSharing: {
        title: "Como Partilhamos as Suas Informações",
        intro: "Não vendemos as suas informações pessoais. Podemos partilhar as suas informações com:",
        items: [
          "Fornecedores de serviços que nos ajudam a operar o nosso negócio (processadores de pagamentos, serviços de e-mail, alojamento na nuvem)",
          "Os nossos operadores de veículos para coordenar recolhas e verificar passageiros",
          "Parceiros de atrações quando compra bilhetes combinados",
          "Autoridades policiais ou governamentais quando exigido por lei",
          "Sucessores empresariais em caso de fusão, aquisição ou venda de ativos"
        ]
      },
      cookies: {
        title: "Cookies e Tecnologias de Rastreamento",
        intro: "Utilizamos cookies e tecnologias similares para melhorar a sua experiência:",
        items: [
          { type: "Cookies Necessários", description: "Essenciais para a funcionalidade do website, segurança e processo de reserva" },
          { type: "Cookies Funcionais", description: "Lembram as suas preferências como a seleção de idioma" },
          { type: "Cookies de Análise", description: "Ajudam-nos a compreender como os visitantes utilizam o nosso site para melhorar os serviços" },
          { type: "Cookies de Marketing", description: "Utilizados para fornecer anúncios relevantes (apenas com o seu consentimento)" }
        ]
      },
      rights: {
        title: "Os Seus Direitos (RGPD)",
        intro: "Como utilizador na União Europeia, tem os seguintes direitos:",
        items: [
          "Direito de Acesso: Solicitar uma cópia dos seus dados pessoais que detemos",
          "Direito de Retificação: Solicitar a correção de dados incorretos ou incompletos",
          "Direito ao Apagamento: Solicitar a eliminação dos seus dados pessoais (\"direito ao esquecimento\")",
          "Direito de Restringir o Processamento: Solicitar limitação na forma como utilizamos os seus dados",
          "Direito à Portabilidade dos Dados: Receber os seus dados num formato estruturado e legível por máquina",
          "Direito de Oposição: Opor-se ao nosso processamento dos seus dados pessoais",
          "Direito de Retirar o Consentimento: Retirar o consentimento a qualquer momento (sem afetar o processamento anterior)"
        ]
      },
      security: {
        title: "Segurança dos Dados",
        content: [
          "Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger as suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.",
          "As informações de pagamento são encriptadas usando protocolos SSL/TLS padrão da indústria. Não armazenamos detalhes completos de cartões de crédito nos nossos servidores.",
          "No entanto, nenhum método de transmissão pela internet é 100% seguro. Embora nos esforcemos para proteger os seus dados, não podemos garantir segurança absoluta."
        ]
      },
      thirdParty: {
        title: "Serviços de Terceiros",
        intro: "O nosso website e serviços integram-se com fornecedores terceiros:",
        items: [
          "Processamento de pagamentos (Stripe ou gateways de pagamento similares)",
          "Entrega de e-mail (Resend para confirmações de reserva)",
          "Alojamento na nuvem e serviços de base de dados (Supabase)",
          "WhatsApp para comunicações de apoio ao cliente",
          "Serviços de análise para melhorar o nosso website"
        ]
      },
      children: {
        title: "Privacidade de Crianças",
        content: [
          "Os nossos serviços não são direcionados a crianças com menos de 16 anos. Não recolhemos intencionalmente informações pessoais de crianças com menos de 16 anos.",
          "Se é pai ou tutor e acredita que o seu filho nos forneceu informações pessoais, contacte-nos para que possamos eliminá-las."
        ]
      },
      contact: {
        title: "Contacte-nos",
        intro: "Se tiver questões sobre esta Política de Privacidade ou quiser exercer os seus direitos, contacte-nos:"
      }
    }
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última Actualización",
    date: "12 de octubre de 2025",
    backToHome: "Volver al Inicio",
    sections: {
      introduction: {
        title: "Introducción",
        content: [
          "Go Sintra (\"nosotros\", \"nuestro\" o \"nos\") está comprometido a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos su información cuando utiliza nuestro servicio de pase diario hop-on/hop-off en Sintra, Portugal.",
          "Por favor, lea esta política de privacidad cuidadosamente. Si no está de acuerdo con los términos de esta política de privacidad, no acceda al sitio ni utilice nuestros servicios."
        ]
      },
      dataCollection: {
        title: "Información que Recopilamos",
        intro: "Recopilamos información que nos proporciona directamente al reservar nuestros servicios:",
        items: [
          { title: "Información Personal", description: "Nombre, dirección de correo electrónico, número de teléfono y otros detalles de contacto proporcionados durante la reserva" },
          { title: "Información de Pago", description: "Detalles de tarjeta de crédito e información de facturación (procesados de forma segura a través de nuestro proveedor de pagos)" },
          { title: "Información de Reserva", description: "Fecha del servicio, número de pasajeros, atracciones seleccionadas y lugares de recogida" },
          { title: "Datos de Uso", description: "Información sobre cómo interactúa con nuestro sitio web, incluyendo páginas visitadas, tiempo dedicado y rutas de navegación" },
          { title: "Datos de Ubicación", description: "Ubicación GPS cuando solicita el servicio de recogida (solo con su permiso)" },
          { title: "Información del Dispositivo", description: "Tipo de navegador, sistema operativo, dirección IP e identificadores del dispositivo" }
        ]
      },
      dataUse: {
        title: "Cómo Usamos Su Información",
        items: [
          "Procesar y cumplir sus reservas y compras de pases diarios",
          "Enviar confirmaciones de reserva, códigos QR y comunicaciones relacionadas con el servicio",
          "Proporcionar atención al cliente y responder a sus consultas",
          "Mejorar nuestros servicios y desarrollar nuevas funciones",
          "Enviar comunicaciones de marketing (solo con su consentimiento)",
          "Prevenir fraudes y mejorar la seguridad",
          "Cumplir obligaciones legales y hacer cumplir nuestros términos"
        ]
      },
      dataSharing: {
        title: "Cómo Compartimos Su Información",
        intro: "No vendemos su información personal. Podemos compartir su información con:",
        items: [
          "Proveedores de servicios que nos ayudan a operar nuestro negocio (procesadores de pagos, servicios de correo electrónico, alojamiento en la nube)",
          "Nuestros operadores de vehículos para coordinar recogidas y verificar pasajeros",
          "Socios de atracciones cuando compra boletos combinados",
          "Autoridades policiales o gubernamentales cuando lo requiera la ley",
          "Sucesores comerciales en caso de fusión, adquisición o venta de activos"
        ]
      },
      cookies: {
        title: "Cookies y Tecnologías de Seguimiento",
        intro: "Utilizamos cookies y tecnologías similares para mejorar su experiencia:",
        items: [
          { type: "Cookies Necesarias", description: "Esenciales para la funcionalidad del sitio web, seguridad y proceso de reserva" },
          { type: "Cookies Funcionales", description: "Recuerdan sus preferencias como la selección de idioma" },
          { type: "Cookies de Análisis", description: "Nos ayudan a comprender cómo los visitantes usan nuestro sitio para mejorar los servicios" },
          { type: "Cookies de Marketing", description: "Utilizadas para entregar anuncios relevantes (solo con su consentimiento)" }
        ]
      },
      rights: {
        title: "Sus Derechos (RGPD)",
        intro: "Como usuario en la Unión Europea, tiene los siguientes derechos:",
        items: [
          "Derecho de Acceso: Solicitar una copia de sus datos personales que conservamos",
          "Derecho de Rectificación: Solicitar la corrección de datos inexactos o incompletos",
          "Derecho al Olvido: Solicitar la eliminación de sus datos personales (\"derecho al olvido\")",
          "Derecho a Restringir el Procesamiento: Solicitar limitación en cómo usamos sus datos",
          "Derecho a la Portabilidad de Datos: Recibir sus datos en un formato estructurado y legible por máquina",
          "Derecho a Oponerse: Oponerse a nuestro procesamiento de sus datos personales",
          "Derecho a Retirar el Consentimiento: Retirar el consentimiento en cualquier momento (sin afectar el procesamiento anterior)"
        ]
      },
      security: {
        title: "Seguridad de Datos",
        content: [
          "Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.",
          "La información de pago se cifra utilizando protocolos SSL/TLS estándar de la industria. No almacenamos detalles completos de tarjetas de crédito en nuestros servidores.",
          "Sin embargo, ningún método de transmisión por internet es 100% seguro. Aunque nos esforzamos por proteger sus datos, no podemos garantizar seguridad absoluta."
        ]
      },
      thirdParty: {
        title: "Servicios de Terceros",
        intro: "Nuestro sitio web y servicios se integran con proveedores terceros:",
        items: [
          "Procesamiento de pagos (Stripe o gateways de pago similares)",
          "Entrega de correo electrónico (Resend para confirmaciones de reserva)",
          "Alojamiento en la nube y servicios de base de datos (Supabase)",
          "WhatsApp para comunicaciones de atención al cliente",
          "Servicios de análisis para mejorar nuestro sitio web"
        ]
      },
      children: {
        title: "Privacidad de Niños",
        content: [
          "Nuestros servicios no están dirigidos a niños menores de 16 años. No recopilamos intencionalmente información personal de niños menores de 16 años.",
          "Si es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos para que podamos eliminarla."
        ]
      },
      contact: {
        title: "Contáctenos",
        intro: "Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, contáctenos:"
      }
    }
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière Mise à Jour",
    date: "12 octobre 2025",
    backToHome: "Retour à l'Accueil",
    sections: {
      introduction: {
        title: "Introduction",
        content: [
          "Go Sintra (\"nous\", \"notre\" ou \"nos\") s'engage à protéger votre vie privée. Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre service de pass journalier hop-on/hop-off à Sintra, Portugal.",
          "Veuillez lire attentivement cette politique de confidentialité. Si vous n'acceptez pas les termes de cette politique de confidentialité, veuillez ne pas accéder au site ou utiliser nos services."
        ]
      },
      dataCollection: {
        title: "Informations que Nous Collectons",
        intro: "Nous collectons les informations que vous nous fournissez directement lors de la réservation de nos services:",
        items: [
          { title: "Informations Personnelles", description: "Nom, adresse e-mail, numéro de téléphone et autres coordonnées fournies lors de la réservation" },
          { title: "Informations de Paiement", description: "Détails de carte de crédit et informations de facturation (traités en toute sécurité via notre fournisseur de paiement)" },
          { title: "Informations de Réservation", description: "Date du service, nombre de passagers, attractions sélectionnées et lieux de prise en charge" },
          { title: "Données d'Utilisation", description: "Informations sur la façon dont vous interagissez avec notre site web, y compris les pages visitées, le temps passé et les chemins de navigation" },
          { title: "Données de Localisation", description: "Localisation GPS lorsque vous demandez un service de prise en charge (uniquement avec votre permission)" },
          { title: "Informations sur l'Appareil", description: "Type de navigateur, système d'exploitation, adresse IP et identifiants de l'appareil" }
        ]
      },
      dataUse: {
        title: "Comment Nous Utilisons Vos Informations",
        items: [
          "Traiter et exécuter vos réservations et achats de pass journaliers",
          "Envoyer des confirmations de réservation, codes QR et communications liées au service",
          "Fournir un support client et répondre à vos questions",
          "Améliorer nos services et développer de nouvelles fonctionnalités",
          "Envoyer des communications marketing (uniquement avec votre consentement)",
          "Prévenir la fraude et améliorer la sécurité",
          "Respecter les obligations légales et faire respecter nos conditions"
        ]
      },
      dataSharing: {
        title: "Comment Nous Partageons Vos Informations",
        intro: "Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations avec:",
        items: [
          "Des prestataires de services qui nous aident à exploiter notre entreprise (processeurs de paiement, services de messagerie, hébergement cloud)",
          "Nos opérateurs de véhicules pour coordonner les prises en charge et vérifier les passagers",
          "Partenaires d'attractions lorsque vous achetez des billets groupés",
          "Autorités policières ou gouvernementales lorsque la loi l'exige",
          "Successeurs commerciaux en cas de fusion, acquisition ou vente d'actifs"
        ]
      },
      cookies: {
        title: "Cookies et Technologies de Suivi",
        intro: "Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience:",
        items: [
          { type: "Cookies Nécessaires", description: "Essentiels pour la fonctionnalité du site web, la sécurité et le processus de réservation" },
          { type: "Cookies Fonctionnels", description: "Mémorisent vos préférences comme la sélection de langue" },
          { type: "Cookies d'Analyse", description: "Nous aident à comprendre comment les visiteurs utilisent notre site pour améliorer les services" },
          { type: "Cookies Marketing", description: "Utilisés pour diffuser des publicités pertinentes (uniquement avec votre consentement)" }
        ]
      },
      rights: {
        title: "Vos Droits (RGPD)",
        intro: "En tant qu'utilisateur dans l'Union Européenne, vous avez les droits suivants:",
        items: [
          "Droit d'Accès: Demander une copie de vos données personnelles que nous détenons",
          "Droit de Rectification: Demander la correction de données inexactes ou incomplètes",
          "Droit à l'Effacement: Demander la suppression de vos données personnelles (\"droit à l'oubli\")",
          "Droit de Restreindre le Traitement: Demander une limitation de la façon dont nous utilisons vos données",
          "Droit à la Portabilité des Données: Recevoir vos données dans un format structuré et lisible par machine",
          "Droit d'Opposition: S'opposer à notre traitement de vos données personnelles",
          "Droit de Retirer le Consentement: Retirer le consentement à tout moment (sans affecter le traitement antérieur)"
        ]
      },
      security: {
        title: "Sécurité des Données",
        content: [
          "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations personnelles contre l'accès non autorisé, l'altération, la divulgation ou la destruction.",
          "Les informations de paiement sont cryptées à l'aide de protocoles SSL/TLS standard de l'industrie. Nous ne stockons pas les détails complets des cartes de crédit sur nos serveurs.",
          "Cependant, aucune méthode de transmission sur Internet n'est sûre à 100%. Bien que nous nous efforcions de protéger vos données, nous ne pouvons garantir une sécurité absolue."
        ]
      },
      thirdParty: {
        title: "Services Tiers",
        intro: "Notre site web et nos services s'intègrent avec des fournisseurs tiers:",
        items: [
          "Traitement des paiements (Stripe ou passerelles de paiement similaires)",
          "Livraison d'e-mails (Resend pour les confirmations de réservation)",
          "Hébergement cloud et services de base de données (Supabase)",
          "WhatsApp pour les communications de service client",
          "Services d'analyse pour améliorer notre site web"
        ]
      },
      children: {
        title: "Confidentialité des Enfants",
        content: [
          "Nos services ne sont pas destinés aux enfants de moins de 16 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 16 ans.",
          "Si vous êtes un parent ou un tuteur et pensez que votre enfant nous a fourni des informations personnelles, veuillez nous contacter afin que nous puissions les supprimer."
        ]
      },
      contact: {
        title: "Nous Contacter",
        intro: "Si vous avez des questions sur cette Politique de Confidentialité ou souhaitez exercer vos droits, veuillez nous contacter:"
      }
    }
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdated: "Letzte Aktualisierung",
    date: "12. Oktober 2025",
    backToHome: "Zurück zur Startseite",
    sections: {
      introduction: {
        title: "Einführung",
        content: [
          "Go Sintra (\"wir\", \"unser\" oder \"uns\") ist dem Schutz Ihrer Privatsphäre verpflichtet. Diese Datenschutzerklärung erklärt, wie wir Ihre Informationen sammeln, verwenden, offenlegen und schützen, wenn Sie unseren Hop-on/Hop-off-Tagespass-Service in Sintra, Portugal, nutzen.",
          "Bitte lesen Sie diese Datenschutzerklärung sorgfältig durch. Wenn Sie mit den Bedingungen dieser Datenschutzerklärung nicht einverstanden sind, greifen Sie bitte nicht auf die Website zu oder nutzen Sie unsere Dienste nicht."
        ]
      },
      dataCollection: {
        title: "Informationen, die Wir Sammeln",
        intro: "Wir sammeln Informationen, die Sie uns direkt bei der Buchung unserer Dienste zur Verfügung stellen:",
        items: [
          { title: "Persönliche Informationen", description: "Name, E-Mail-Adresse, Telefonnummer und andere Kontaktdaten, die Sie bei der Buchung angeben" },
          { title: "Zahlungsinformationen", description: "Kreditkartendaten und Rechnungsinformationen (sicher über unseren Zahlungsanbieter verarbeitet)" },
          { title: "Buchungsinformationen", description: "Datum des Services, Anzahl der Passagiere, ausgewählte Attraktionen und Abholorte" },
          { title: "Nutzungsdaten", description: "Informationen darüber, wie Sie mit unserer Website interagieren, einschließlich besuchter Seiten, verbrachter Zeit und Navigationspfade" },
          { title: "Standortdaten", description: "GPS-Standort, wenn Sie den Abholservice anfordern (nur mit Ihrer Erlaubnis)" },
          { title: "Geräteinformationen", description: "Browsertyp, Betriebssystem, IP-Adresse und Geräte-IDs" }
        ]
      },
      dataUse: {
        title: "Wie Wir Ihre Informationen Verwenden",
        items: [
          "Verarbeitung und Erfüllung Ihrer Buchungen und Tagespass-Käufe",
          "Versand von Buchungsbestätigungen, QR-Codes und servicebezogenen Mitteilungen",
          "Bereitstellung von Kundenservice und Beantwortung Ihrer Anfragen",
          "Verbesserung unserer Dienste und Entwicklung neuer Funktionen",
          "Versand von Marketing-Mitteilungen (nur mit Ihrer Zustimmung)",
          "Betrugsprävention und Verbesserung der Sicherheit",
          "Erfüllung gesetzlicher Verpflichtungen und Durchsetzung unserer Bedingungen"
        ]
      },
      dataSharing: {
        title: "Wie Wir Ihre Informationen Teilen",
        intro: "Wir verkaufen Ihre persönlichen Informationen nicht. Wir können Ihre Informationen teilen mit:",
        items: [
          "Dienstleistern, die uns beim Betrieb unseres Geschäfts helfen (Zahlungsabwickler, E-Mail-Dienste, Cloud-Hosting)",
          "Unseren Fahrzeugbetreibern zur Koordination von Abholungen und Überprüfung von Passagieren",
          "Attraktionspartnern, wenn Sie gebündelte Tickets kaufen",
          "Strafverfolgungs- oder Regierungsbehörden, wenn gesetzlich vorgeschrieben",
          "Geschäftsnachfolgern im Falle einer Fusion, Übernahme oder Vermögensveräußerung"
        ]
      },
      cookies: {
        title: "Cookies und Tracking-Technologien",
        intro: "Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu verbessern:",
        items: [
          { type: "Notwendige Cookies", description: "Wesentlich für Website-Funktionalität, Sicherheit und Buchungsprozess" },
          { type: "Funktionale Cookies", description: "Speichern Ihre Präferenzen wie Sprachauswahl" },
          { type: "Analyse-Cookies", description: "Helfen uns zu verstehen, wie Besucher unsere Website nutzen, um Dienste zu verbessern" },
          { type: "Marketing-Cookies", description: "Werden verwendet, um relevante Werbung zu liefern (nur mit Ihrer Zustimmung)" }
        ]
      },
      rights: {
        title: "Ihre Rechte (DSGVO)",
        intro: "Als Nutzer in der Europäischen Union haben Sie folgende Rechte:",
        items: [
          "Recht auf Zugang: Anforderung einer Kopie Ihrer persönlichen Daten, die wir speichern",
          "Recht auf Berichtigung: Anforderung der Korrektur ungenauer oder unvollständiger Daten",
          "Recht auf Löschung: Anforderung der Löschung Ihrer persönlichen Daten (\"Recht auf Vergessenwerden\")",
          "Recht auf Einschränkung der Verarbeitung: Anforderung einer Begrenzung, wie wir Ihre Daten verwenden",
          "Recht auf Datenübertragbarkeit: Erhalt Ihrer Daten in einem strukturierten, maschinenlesbaren Format",
          "Widerspruchsrecht: Widerspruch gegen unsere Verarbeitung Ihrer persönlichen Daten",
          "Recht auf Widerruf der Einwilligung: Widerruf der Einwilligung jederzeit (ohne Auswirkung auf frühere Verarbeitung)"
        ]
      },
      security: {
        title: "Datensicherheit",
        content: [
          "Wir implementieren angemessene technische und organisatorische Sicherheitsmaßnahmen, um Ihre persönlichen Informationen vor unbefugtem Zugriff, Änderung, Offenlegung oder Zerstörung zu schützen.",
          "Zahlungsinformationen werden mit branchenüblichen SSL/TLS-Protokollen verschlüsselt. Wir speichern keine vollständigen Kreditkartendaten auf unseren Servern.",
          "Keine Übertragungsmethode über das Internet ist jedoch zu 100% sicher. Obwohl wir uns bemühen, Ihre Daten zu schützen, können wir keine absolute Sicherheit garantieren."
        ]
      },
      thirdParty: {
        title: "Drittanbieter-Dienste",
        intro: "Unsere Website und Dienste integrieren sich mit Drittanbietern:",
        items: [
          "Zahlungsabwicklung (Stripe oder ähnliche Payment-Gateways)",
          "E-Mail-Zustellung (Resend für Buchungsbestätigungen)",
          "Cloud-Hosting und Datenbankdienste (Supabase)",
          "WhatsApp für Kundenservice-Kommunikation",
          "Analysedienste zur Verbesserung unserer Website"
        ]
      },
      children: {
        title: "Privatsphäre von Kindern",
        content: [
          "Unsere Dienste richten sich nicht an Kinder unter 16 Jahren. Wir sammeln nicht wissentlich persönliche Informationen von Kindern unter 16 Jahren.",
          "Wenn Sie ein Elternteil oder Erziehungsberechtigter sind und glauben, dass Ihr Kind uns persönliche Informationen zur Verfügung gestellt hat, kontaktieren Sie uns bitte, damit wir diese löschen können."
        ]
      },
      contact: {
        title: "Kontaktieren Sie Uns",
        intro: "Wenn Sie Fragen zu dieser Datenschutzerklärung haben oder Ihre Rechte ausüben möchten, kontaktieren Sie uns bitte:"
      }
    }
  }
};

export function getPrivacyContent(languageCode: string): PrivacyContent {
  return privacyTranslations[languageCode] || privacyTranslations.en;
}
