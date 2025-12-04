import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Landmark } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface InfoCardProps {
  onNavigate: (page: string) => void;
  language?: string;
  cardType: "travel-guide" | "monuments";
  customImages?: Array<{ src: string; alt: string }>;
  customContent?: {
    title?: string;
    description?: string;
    content?: string;
    buttonText?: string;
  };
}

export function InfoCard({ onNavigate, language = "en", cardType, customImages, customContent }: InfoCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const defaultCardImages = {
    "travel-guide": [
      {
        src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop",
        alt: "Sintra travel guide",
      },
      {
        src: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&h=500&fit=crop",
        alt: "Travel planning",
      },
      {
        src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop",
        alt: "Local tips and guides",
      },
      {
        src: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=800&h=500&fit=crop",
        alt: "Sintra exploration",
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

  const images = customImages || defaultCardImages[cardType];

  const translations = {
    en: {
      "travel-guide": {
        title: "Sintra Travel Guide",
        description: "Expert tips, local insights, and hidden gems",
        content: "Discover the best of Sintra with our comprehensive travel guides. From the best time to visit each palace to secret viewpoints locals love, our blog shares insider knowledge to help you make the most of your Sintra adventure.",
        learnMore: "Read Travel Guides",
      },
      monuments: {
        title: "Sintra's Top Attractions",
        description: "Explore UNESCO World Heritage monuments",
        content: "Sintra is home to some of Portugal's most spectacular palaces and gardens. From the colorful Pena Palace perched atop the hills to the mystical Quinta da Regaleira with its enchanting gardens, each monument tells a unique story.",
        learnMore: "View All Attractions",
      },
    },
    pt: {
      "travel-guide": {
        title: "Guia de Viagem de Sintra",
        description: "Dicas de especialistas, insights locais e joias escondidas",
        content: "Descubra o melhor de Sintra com nossos guias de viagem abrangentes. Do melhor momento para visitar cada palácio aos miradouros secretos que os locais adoram, nosso blog compartilha conhecimento interno para ajudá-lo a aproveitar ao máximo sua aventura em Sintra.",
        learnMore: "Ler Guias de Viagem",
      },
      monuments: {
        title: "Principais Atrações de Sintra",
        description: "Explore monumentos Património Mundial da UNESCO",
        content: "Sintra abriga alguns dos palácios e jardins mais espetaculares de Portugal. Do colorido Palácio da Pena no topo das colinas à mística Quinta da Regaleira com seus jardins encantadores, cada monumento conta uma história única.",
        learnMore: "Ver Todas as Atrações",
      },
    },
    es: {
      "travel-guide": {
        title: "Guía de Viaje de Sintra",
        description: "Consejos expertos, ideas locales y gemas ocultas",
        content: "Descubre lo mejor de Sintra con nuestras guías de viaje completas. Desde el mejor momento para visitar cada palacio hasta miradores secretos que los locales aman, nuestro blog comparte conocimiento interno para ayudarte a aprovechar al máximo tu aventura en Sintra.",
        learnMore: "Leer Guías de Viaje",
      },
      monuments: {
        title: "Principales Atracciones de Sintra",
        description: "Explora monumentos Patrimonio de la Humanidad UNESCO",
        content: "Sintra alberga algunos de los palacios y jardines más espectaculares de Portugal. Desde el colorido Palacio de Pena en la cima de las colinas hasta la mística Quinta da Regaleira con sus jardines encantadores, cada monumento cuenta una historia única.",
        learnMore: "Ver Todas las Atracciones",
      },
    },
    fr: {
      "travel-guide": {
        title: "Guide de Voyage de Sintra",
        description: "Conseils d'experts, aperçus locaux et joyaux cachés",
        content: "Découvrez le meilleur de Sintra avec nos guides de voyage complets. Du meilleur moment pour visiter chaque palais aux points de vue secrets que les locaux adorent, notre blog partage des connaissances d'initiés pour vous aider à tirer le meilleur parti de votre aventure à Sintra.",
        learnMore: "Lire les Guides de Voyage",
      },
      monuments: {
        title: "Principales Attractions de Sintra",
        description: "Explorez les monuments du patrimoine mondial de l'UNESCO",
        content: "Sintra abrite certains des palais et jardins les plus spectaculaires du Portugal. Du coloré Palais de Pena au sommet des collines à la mystique Quinta da Regaleira avec ses jardins enchanteurs, chaque monument raconte une histoire unique.",
        learnMore: "Voir Toutes Les Attractions",
      },
    },
    de: {
      "travel-guide": {
        title: "Sintra Reiseführer",
        description: "Expertentipps, lokale Einblicke und versteckte Juwelen",
        content: "Entdecken Sie das Beste von Sintra mit unseren umfassenden Reiseführern. Von der besten Zeit, jeden Palast zu besuchen, bis zu geheimen Aussichtspunkten, die Einheimische lieben, teilt unser Blog Insider-Wissen, um Ihnen zu helfen, das Beste aus Ihrem Sintra-Abenteuer zu machen.",
        learnMore: "Reiseführer Lesen",
      },
      monuments: {
        title: "Sintras Top-Attraktionen",
        description: "Erkunden Sie UNESCO-Welterbe-Monumente",
        content: "Sintra beherbergt einige der spektakulärsten Paläste und Gärten Portugals. Vom farbenfrohen Pena-Palast auf den Hügeln bis zur mystischen Quinta da Regaleira mit ihren bezaubernden Gärten erzählt jedes Monument eine einzigartige Geschichte.",
        learnMore: "Alle Attraktionen Anzeigen",
      },
    },
    nl: {
      "travel-guide": {
        title: "Sintra Reisgids",
        description: "Experttips, lokale inzichten en verborgen pareltjes",
        content: "Ontdek het beste van Sintra met onze uitgebreide reisgidsen. Van de beste tijd om elk paleis te bezoeken tot geheime uitkijkpunten waar locals van houden, deelt onze blog insider-kennis om u te helpen het meeste uit uw Sintra-avontuur te halen.",
        learnMore: "Lees Reisgidsen",
      },
      monuments: {
        title: "Top Attracties van Sintra",
        description: "Verken UNESCO Werelderfgoed monumenten",
        content: "Sintra herbergt enkele van de meest spectaculaire paleizen en tuinen van Portugal. Van het kleurrijke Pena Paleis op de heuvels tot de mystieke Quinta da Regaleira met zijn betoverende tuinen, elk monument vertelt een uniek verhaal.",
        learnMore: "Bekijk Alle Attracties",
      },
    },
    it: {
      "travel-guide": {
        title: "Guida di Viaggio di Sintra",
        description: "Consigli esperti, approfondimenti locali e gemme nascoste",
        content: "Scopri il meglio di Sintra con le nostre guide di viaggio complete. Dal momento migliore per visitare ogni palazzo ai punti panoramici segreti che i locali amano, il nostro blog condivide conoscenze da insider per aiutarti a sfruttare al meglio la tua avventura a Sintra.",
        learnMore: "Leggi le Guide di Viaggio",
      },
      monuments: {
        title: "Principali Attrazioni di Sintra",
        description: "Esplora i monumenti Patrimonio dell'Umanità UNESCO",
        content: "Sintra ospita alcuni dei palazzi e giardini più spettacolari del Portogallo. Dal colorato Palazzo Pena in cima alle colline alla mistica Quinta da Regaleira con i suoi giardini incantevoli, ogni monumento racconta una storia unica.",
        learnMore: "Visualizza Tutte Le Attrazioni",
      },
    },
  };

  const langContent = translations[language as keyof typeof translations] || translations.en;
  const defaultContent = langContent[cardType];
  const t = customContent ? {
    title: customContent.title || defaultContent.title,
    description: customContent.description || defaultContent.description,
    content: customContent.content || defaultContent.content,
    learnMore: customContent.buttonText || defaultContent.learnMore,
  } : defaultContent;

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

  const handleNavigate = () => {
    if (cardType === "travel-guide") {
      onNavigate("blog");
    } else {
      onNavigate("attractions");
    }
  };

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
          className="flex h-full transition-transform duration-500 ease-out w-full"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="min-w-full h-full flex-shrink-0 w-full">
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
        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
          {t.content}
        </p>

        {/* Divider */}
        <div className="border-t border-border pt-3 mt-4">
          {/* Learn More Button */}
          <Button
            onClick={handleNavigate}
            variant="outline"
            className="h-11 w-full border-primary text-primary hover:bg-primary/5 shadow-md text-sm"
            size="lg"
          >
            {t.learnMore}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}