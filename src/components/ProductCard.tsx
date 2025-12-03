import { useState } from "react";
import { Check, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  language?: string;
  productType?: "daypass" | "insight-tour" | "monuments";
}

export function ProductCard({ onNavigate, basePrice, language = "en", productType = "daypass" }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const childPrice = (basePrice * 0.5).toFixed(2);

  const productImages = {
    daypass: [
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Colorful Pena Palace in Sintra",
      },
      {
        src: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=500&fit=crop",
        alt: "Tuk Tuk exploring Sintra",
      },
      {
        src: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=500&fit=crop",
        alt: "Quinta da Regaleira",
      },
      {
        src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop",
        alt: "Sintra Mountains view",
      },
    ],
    "insight-tour": [
      {
        src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=500&fit=crop",
        alt: "Professional tour guide",
      },
      {
        src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
        alt: "Guided tour experience",
      },
      {
        src: "https://images.unsplash.com/photo-1523874134873-4cd054343be4?w=800&h=500&fit=crop",
        alt: "Historical storytelling",
      },
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Pena Palace tour",
      },
    ],
    monuments: [
      {
        src: "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY",
        alt: "Pena Palace",
      },
      {
        src: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&h=500&fit=crop",
        alt: "Quinta da Regaleira",
      },
      {
        src: "https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800&h=500&fit=crop",
        alt: "Moorish Castle",
      },
      {
        src: "https://images.unsplash.com/photo-1555881490-a0b9f8f4b6b5?w=800&h=500&fit=crop",
        alt: "Monserrate Palace",
      },
    ],
  };

  const images = productImages[productType];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const translations = {
    en: {
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
      "insight-tour": {
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
      adult: "Adult",
      child: "Child (5-12 yrs)",
    },
    pt: {
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
      "insight-tour": {
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
      adult: "Adulto",
      child: "Criança (5-12 anos)",
    },
    es: {
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
      "insight-tour": {
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
      adult: "Adulto",
      child: "Niño (5-12 años)",
    },
    fr: {
      daypass: {
        title: "Pass Journée Complète",
        description: "Trajets illimités dans toutes les attractions de Sintra",
        features: [
          "Trajets illimités hop-on hop-off",
          "Places garanties - pas d'attente",
          "Chauffeurs-guides professionnels",
          "Service 9h - 19h quotidiennement",
          "Petits groupes (max. 8 personnes)",
          "Suivi en temps réel",
        ],
        bookNow: "Réservez Votre Pass",
      },
      "insight-tour": {
        title: "Tour Insight",
        description: "Plongée profonde dans l'histoire et la culture de Sintra",
        features: [
          "Guide local expert",
          "Récits historiques approfondis",
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
          "Accès au Château des Maures",
          "Palais de Monserrate",
          "Entrée prioritaire",
          "Valable un jour",
        ],
        bookNow: "Acheter Billets",
      },
      adult: "Adulte",
      child: "Enfant (5-12 ans)",
    },
    de: {
      daypass: {
        title: "Ganztagespass",
        description: "Unbegrenzte Fahrten zu allen Sintra Sehenswürdigkeiten",
        features: [
          "Unbegrenzte Hop-on Hop-off Fahrten",
          "Garantierte Plätze - keine Wartezeit",
          "Professionelle Fahrer-Guides",
          "Service 9-19 Uhr täglich",
          "Kleine Gruppen (max. 8 Personen)",
          "Echtzeit-Tracking",
        ],
        bookNow: "Buchen Sie Ihren Pass",
      },
      "insight-tour": {
        title: "Insight Tour",
        description: "Tiefer Einblick in Sintras Geschichte und Kultur",
        features: [
          "Experte lokaler Führer",
          "Ausführliche historische Erzählungen",
          "Bevorzugter Monumentzugang",
          "Kleine intime Gruppen",
          "Versteckte Juwelen & lokale Geschichten",
          "Ganztägiges Erlebnis",
        ],
        bookNow: "Insight Tour Buchen",
      },
      monuments: {
        title: "Monumenttickets",
        description: "Überspringen Sie die Warteschlange bei Sintras Top-Attraktionen",
        features: [
          "Pena-Palast Eintritt",
          "Quinta da Regaleira",
          "Maurische Burg Zugang",
          "Monserrate-Palast",
          "Bevorzugter Einlass",
          "Einen Tag gültig",
        ],
        bookNow: "Tickets Kaufen",
      },
      adult: "Erwachsene",
      child: "Kind (5-12 Jahre)",
    },
    nl: {
      daypass: {
        title: "Hele Dag Pas",
        description: "Onbeperkt reizen naar alle Sintra attracties",
        features: [
          "Onbeperkt hop-on hop-off reizen",
          "Gegarandeerde plaatsen - geen wachten",
          "Professionele chauffeur-gidsen",
          "Service 9-19 uur dagelijks",
          "Kleine groepen (max. 8 personen)",
          "Real-time tracking",
        ],
        bookNow: "Boek Uw Pas",
      },
      "insight-tour": {
        title: "Insight Tour",
        description: "Diepgaande duik in Sintra's geschiedenis en cultuur",
        features: [
          "Expert lokale gids",
          "Diepgaande historische verhalen",
          "Sla-de-rij-over monumententoegang",
          "Kleine intieme groepen",
          "Verborgen pareltjes & lokale verhalen",
          "Hele dag ervaring",
        ],
        bookNow: "Boek Insight Tour",
      },
      monuments: {
        title: "Monumenttickets",
        description: "Sla de rij over bij Sintra's topattracties",
        features: [
          "Pena Paleis toegang",
          "Quinta da Regaleira",
          "Moorse Kasteel toegang",
          "Monserrate Paleis",
          "Prioritaire toegang",
          "Geldig voor één dag",
        ],
        bookNow: "Koop Tickets",
      },
      adult: "Volwassene",
      child: "Kind (5-12 jaar)",
    },
    it: {
      daypass: {
        title: "Pass Giornaliero",
        description: "Viaggi illimitati a tutte le attrazioni di Sintra",
        features: [
          "Viaggi illimitati hop-on hop-off",
          "Posti garantiti - nessuna attesa",
          "Autisti-guide professionali",
          "Servizio 9-19 quotidiano",
          "Piccoli gruppi (max. 8 persone)",
          "Tracciamento in tempo reale",
        ],
        bookNow: "Prenota Il Tuo Pass",
      },
      "insight-tour": {
        title: "Tour Insight",
        description: "Immersione profonda nella storia e cultura di Sintra",
        features: [
          "Guida locale esperta",
          "Narrazioni storiche approfondite",
          "Accesso salta-fila ai monumenti",
          "Piccoli gruppi intimi",
          "Gemme nascoste e storie locali",
          "Esperienza di un'intera giornata",
        ],
        bookNow: "Prenota Tour Insight",
      },
      monuments: {
        title: "Biglietti Monumenti",
        description: "Salta la fila alle principali attrazioni di Sintra",
        features: [
          "Ingresso Palazzo Pena",
          "Quinta da Regaleira",
          "Accesso Castello dei Mori",
          "Palazzo di Monserrate",
          "Ingresso prioritario",
          "Valido per un giorno",
        ],
        bookNow: "Acquista Biglietti",
      },
      adult: "Adulto",
      child: "Bambino (5-12 anni)",
    },
  };

  const langContent = translations[language as keyof typeof translations] || translations.en;
  const t = langContent[productType];

  return (
    <Card className="w-full bg-white shadow-xl border-0 overflow-hidden group flex flex-col h-full gap-0">
      {/* Image Carousel */}
      <div 
        className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer select-none flex-shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0">
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Desktop */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-gray-800" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 hidden sm:block"
          aria-label="Next image"
        >
          <ChevronRight className="h-3.5 w-3.5 text-gray-800" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentImageIndex
                  ? "bg-white w-5"
                  : "bg-white/60 w-1.5 hover:bg-white/80"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 px-5 py-3">
        <h4 className="text-white mb-0.5">{t.title}</h4>
        <p className="text-white/90 text-xs">{t.description}</p>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Features List */}
        <div className="space-y-2 flex-1">
          {t.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent" />
                </div>
              </div>
              <span className="text-xs text-foreground leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="border-t border-border pt-3 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{langContent.adult}</span>
            <span className="text-lg font-bold text-primary">€{basePrice}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{langContent.child}</span>
            <span className="text-lg font-bold text-primary">€{childPrice}</span>
          </div>

          {/* Book Now Button */}
          <Button
            onClick={() => onNavigate("buy-ticket")}
            className="h-11 w-full bg-accent text-white hover:bg-accent/90 shadow-md text-sm"
            size="lg"
          >
            {t.bookNow}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}