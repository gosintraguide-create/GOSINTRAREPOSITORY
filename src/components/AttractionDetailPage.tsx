import {
  ArrowLeft,
  Check,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Star,
  Ticket,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import {
  loadComprehensiveContent,
  loadComprehensiveContentForLanguage,
  type ComprehensiveContent,
  DEFAULT_COMPREHENSIVE_CONTENT,
} from "../lib/comprehensiveContent";
import { motion } from "motion/react";
import Slider from "react-slick";
import "../styles/slick-custom.css";

interface AttractionDetailPageProps {
  onNavigate: (page: string) => void;
  attractionId: string;
  language?: string;
}

// Custom arrow components for the carousel
const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-2 sm:left-4 top-1/2 z-50 flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110"
    aria-label="Previous image"
    type="button"
  >
    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
  </button>
);

const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-2 sm:right-4 top-1/2 z-50 flex h-8 w-8 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110"
    aria-label="Next image"
    type="button"
  >
    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
  </button>
);

export function AttractionDetailPage({
  onNavigate,
  attractionId,
  language,
}: AttractionDetailPageProps) {
  const [content, setContent] = useState<ComprehensiveContent>(
    DEFAULT_COMPREHENSIVE_CONTENT,
  );
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");

  // Fallback images for attractions without uploaded images
  const attractionFallbackImages: { [key: string]: string } = {
    "pena-palace":
      "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5hJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwMnww&ixlib=rb-4.1.0&q=80&w=1080",
    "quinta-regaleira":
      "https://images.unsplash.com/photo-1668377298351-3f7a745a56fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWludGElMjBkYSUyMHJlZ2FsZWlyYSUyMHNpbnRyYXxlbnwxfHx8fDE3NjMxNjg3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "moorish-castle":
      "https://images.unsplash.com/photo-1651520011190-6f37b5213684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29yaXNoJTIwY2FzdGxlJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2ODc2OXww&ixlib=rb-4.1.0&q=80&w=1080",
    "monserrate-palace":
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zZXJyYXRlJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "sintra-palace":
      "https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHNpbnRyYSUyMHBvcnR1Z2FsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDE0MDIwMHww&ixlib=rb-4.1.0&q=80&w=1080",
    "convento-capuchos":
      "https://images.unsplash.com/photo-1672692921041-f676e2cae79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb252ZW50byUyMGNhcHVjaG9zJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
    "cabo-da-roca":
      "https://images.unsplash.com/photo-1700739745973-bbd552072e98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJvJTIwZGElMjByb2NhJTIwbGlnaHRob3VzZXxlbnwxfHx8fDE3NjMxNjY2MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "villa-sassetti":
      "https://images.unsplash.com/photo-1670060434149-220a5fce89da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYSUyMHNhc3NldHRpJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  };

  useEffect(() => {
    const freshContent = loadComprehensiveContentForLanguage(language || "en");
    setContent(freshContent);

    // Debug: log the gallery URLs
    console.log(
      "Attraction gallery URLs:",
      freshContent.attractions.attractionDetails[attractionId]
        ?.gallery,
    );
  }, [attractionId, language]);

  const attraction =
    content.attractions.attractionDetails[attractionId];

  if (!attraction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-foreground">
            Attraction not found
          </h2>
          <Button onClick={() => onNavigate("attractions")}>
            Back to Attractions
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (attraction.parkOnlyPrice && !selectedOption) {
      setSelectedOption("full");
    }
  }, [attraction, selectedOption]);

  const getCurrentPrice = () => {
    if (attraction.parkOnlyPrice) {
      return selectedOption === "parkOnly"
        ? attraction.parkOnlyPrice
        : attraction.price;
    }
    return attraction.price;
  };

  const handlePurchase = () => {
    alert(
      `Booking ${ticketQuantity} ticket(s) for ${attraction.name}. Total: €${getCurrentPrice() * ticketQuantity}`,
    );
  };

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!attraction) return null;
    
    // Address mapping for each attraction
    const attractionAddresses: { [key: string]: any } = {
      "pena-palace": {
        "@type": "PostalAddress",
        "streetAddress": "Estrada da Pena",
        "addressLocality": "Sintra",
        "postalCode": "2710-609",
        "addressCountry": "PT"
      },
      "quinta-regaleira": {
        "@type": "PostalAddress",
        "streetAddress": "Rua Barbosa du Bocage",
        "addressLocality": "Sintra",
        "postalCode": "2710-567",
        "addressCountry": "PT"
      },
      "moorish-castle": {
        "@type": "PostalAddress",
        "streetAddress": "Estrada da Pena",
        "addressLocality": "Sintra",
        "postalCode": "2710-609",
        "addressCountry": "PT"
      },
      "monserrate-palace": {
        "@type": "PostalAddress",
        "streetAddress": "R. Visc. de Monserrate",
        "addressLocality": "Sintra",
        "postalCode": "2710-591",
        "addressCountry": "PT"
      },
      "sintra-palace": {
        "@type": "PostalAddress",
        "streetAddress": "Largo Rainha Dona Amélia",
        "addressLocality": "Sintra",
        "postalCode": "2710-616",
        "addressCountry": "PT"
      },
      "convento-capuchos": {
        "@type": "PostalAddress",
        "streetAddress": "Convento dos Capuchos",
        "addressLocality": "Sintra",
        "postalCode": "2710-405",
        "addressCountry": "PT"
      },
      "cabo-da-roca": {
        "@type": "PostalAddress",
        "streetAddress": "Estrada do Cabo da Roca",
        "addressLocality": "Colares",
        "postalCode": "2705-001",
        "addressCountry": "PT"
      },
      "villa-sassetti": {
        "@type": "PostalAddress",
        "streetAddress": "Estrada da Pena",
        "addressLocality": "Sintra",
        "postalCode": "2710-609",
        "addressCountry": "PT"
      }
    };
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": attraction.name,
      "description": attraction.longDescription || attraction.shortDescription,
      "image": attraction.heroImage || attractionFallbackImages[attractionId] || "",
      "address": attractionAddresses[attractionId] || {
        "@type": "PostalAddress",
        "addressLocality": "Sintra",
        "addressCountry": "PT"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday", 
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "09:00",
        "closes": "19:00"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "250",
        "bestRating": "5"
      }
    };

    // Add price information if available
    if (attraction.price) {
      structuredData["priceRange"] = `€€`;
    }

    return structuredData;
  };

  return (
    <div className="flex-1">
      {/* Structured Data for SEO */}
      {attraction && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      )}

      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("attractions")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Attractions
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] sm:h-[60vh] sm:min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src={
            attraction.heroImage ||
            attractionFallbackImages[attractionId] ||
            "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920&h=1080&fit=crop"
          }
          alt={attraction.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-8 sm:pb-12 md:pb-16 lg:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.h1
                className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {attraction.name}
              </motion.h1>

              <motion.p
                className="max-w-2xl text-lg sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {attraction.shortDescription}
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Ticket className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">
                    €{getCurrentPrice()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">
                    {attraction.duration}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-white/90">
                    Must-See
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Left Column - Information */}
            <div className="space-y-8 sm:space-y-12 lg:col-span-2 min-w-0">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-4 sm:mb-5 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  What Makes It Special
                </h2>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {attraction.longDescription}
                </p>
              </motion.div>

              {/* Image Gallery Carousel */}
              {attraction.gallery &&
                attraction.gallery.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    className="mb-6 sm:mb-8"
                  >
                    <Badge className="mb-3 sm:mb-4">
                      <Camera className="mr-1 h-3 w-3" />
                      Gallery
                    </Badge>
                    <div className="w-full max-w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-lg bg-gray-100">
                      <div className="w-full max-w-full">
                        <Slider
                          dots={true}
                          infinite={true}
                          speed={500}
                          slidesToShow={1}
                          slidesToScroll={1}
                          arrows={true}
                          autoplay={true}
                          autoplaySpeed={4000}
                          prevArrow={<PrevArrow />}
                          nextArrow={<NextArrow />}
                          adaptiveHeight={false}
                          cssEase="ease-in-out"
                        >
                          {attraction.gallery.map(
                            (image, index) => (
                              <div
                                key={index}
                                className="w-full"
                              >
                                <div className="h-[250px] sm:h-[350px] lg:h-[450px] w-full bg-gray-200">
                                  <img
                                    src={image}
                                    alt={`${attraction.name} - Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error(
                                        `Failed to load image: ${image}`,
                                      );
                                      e.currentTarget.src =
                                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </Slider>
                      </div>
                    </div>
                  </motion.div>
                )}

              {/* Opening Hours & Ticket Info - Mobile Only */}
              <div className="space-y-6 lg:hidden">
                {/* Opening Hours Card - Mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6 shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="text-foreground">
                        Opening Hours
                      </h4>
                    </div>
                    <p className="text-muted-foreground">
                      {attraction.hours}
                    </p>
                  </Card>
                </motion.div>

                {/* Ticket Information Card - Mobile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="p-6 shadow-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Ticket className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-foreground">
                        Ticket Information
                      </h3>
                    </div>

                    <div className="mb-6 rounded-xl bg-secondary/30 p-6 text-center">
                      <div className="mb-2 text-sm text-muted-foreground">
                        Entrance Ticket
                      </div>
                      <div className="mb-4 text-3xl text-foreground">
                        €
                        {attraction.parkOnlyPrice
                          ? attraction.parkOnlyPrice
                          : attraction.price}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Online Booking Coming Soon
                      </Badge>
                    </div>

                    <div className="mb-6 space-y-2 rounded-xl bg-primary/5 p-4">
                      <p className="text-sm text-muted-foreground">
                        Attraction tickets are not yet available
                        for online purchase. You can buy tickets
                        at the entrance.
                      </p>
                    </div>

                    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-foreground">
                        💡 Get There Easily!
                      </h4>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Book a Hop On Sintra day pass for
                        unlimited transport between all
                        attractions with professional
                        driver-guides!
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => onNavigate("buy-ticket")}
                      >
                        Get Day Pass
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="mb-5 sm:mb-6 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Don't Miss These!
                </h3>
                <div className="grid gap-4">
                  {attraction.highlights.map(
                    (highlight, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-3 sm:gap-4 rounded-xl border border-border/50 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:border-primary/20"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-base sm:text-lg text-foreground leading-relaxed">
                          {highlight}
                        </span>
                      </motion.div>
                    ),
                  )}
                </div>
              </motion.div>

              {/* Visitor Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="mb-5 sm:mb-6 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  Insider Tips
                </h3>
                <div className="grid gap-4">
                  {attraction.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      className="rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5 transition-all hover:shadow-md hover:bg-accent/10"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                        <p className="text-base sm:text-lg text-foreground leading-relaxed">{tip}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Time Needed - Mobile Only */}
              <motion.div
                className="lg:hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 transition-all hover:shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Camera className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="text-foreground">
                      Time Needed
                    </h4>
                  </div>
                  <p className="text-muted-foreground">
                    {attraction.duration}
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Ticket Info Card (Desktop Only) */}
            <motion.div
              className="hidden lg:col-span-1 lg:block"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="sticky top-24 space-y-6">
                {/* Opening Hours Card */}
                <Card className="p-6 shadow-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-foreground">
                      Opening Hours
                    </h4>
                  </div>
                  <p className="text-muted-foreground">
                    {attraction.hours}
                  </p>
                </Card>

                {/* Ticket Information Card */}
                <Card className="p-6 shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-foreground">
                      Ticket Information
                    </h3>
                  </div>

                  <div className="mb-6 rounded-xl bg-secondary/30 p-6 text-center">
                    <div className="mb-2 text-sm text-muted-foreground">
                      Entrance Ticket
                    </div>
                    <div className="mb-4 text-3xl text-foreground">
                      €
                      {attraction.parkOnlyPrice
                        ? attraction.parkOnlyPrice
                        : attraction.price}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground"
                    >
                      Online Booking Coming Soon
                    </Badge>
                  </div>

                  <div className="mb-6 space-y-2 rounded-xl bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">
                      Attraction tickets are not yet available
                      for online purchase. You can buy tickets
                      at the entrance.
                    </p>
                  </div>

                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <h4 className="mb-2 flex items-center gap-2 text-foreground">
                      💡 Get There Easily!
                    </h4>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Book a Hop On Sintra day pass for
                      unlimited transport between all
                      attractions with professional
                      driver-guides!
                    </p>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => onNavigate("buy-ticket")}
                    >
                      Get Day Pass
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}