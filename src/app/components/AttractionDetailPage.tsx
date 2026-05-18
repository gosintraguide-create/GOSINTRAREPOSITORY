import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Ticket,
  Clock,
  Star,
  Camera,
  Check,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  DEFAULT_COMPREHENSIVE_CONTENT,
} from "../lib/comprehensiveContent";
import { useEditableContent } from "../lib/useEditableContent";
import { getTranslation } from "../lib/translations/loader";
import { Breadcrumbs } from "./Breadcrumbs";
import { Link } from "react-router";
import Slider from "react-slick";
import "../../styles/slick-custom.css";

// Custom arrow components for slider
const PrevArrow = (props: any) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <button
      {...restProps}
      className="slick-prev"
      aria-label="Previous slide"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
};

const NextArrow = (props: any) => {
  const { currentSlide, slideCount, ...restProps } = props;
  return (
    <button
      {...restProps}
      className="slick-next"
      aria-label="Next slide"
    >
      <ChevronRight className="h-6 w-6" />
    </button>
  );
};

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}


// Address mapping for each attraction
const attractionAddresses: { [key: string]: any } = {
  "pena-palace": {
    "@type": "PostalAddress",
    streetAddress: "Estrada da Pena",
    addressLocality: "Sintra",
    postalCode: "2710-609",
    addressCountry: "PT",
  },
  "quinta-regaleira": {
    "@type": "PostalAddress",
    streetAddress: "Rua Barbosa du Bocage",
    addressLocality: "Sintra",
    postalCode: "2710-567",
    addressCountry: "PT",
  },
  "moorish-castle": {
    "@type": "PostalAddress",
    streetAddress: "Estrada da Pena",
    addressLocality: "Sintra",
    postalCode: "2710-609",
    addressCountry: "PT",
  },
  "monserrate-palace": {
    "@type": "PostalAddress",
    streetAddress: "R. Visc. de Monserrate",
    addressLocality: "Sintra",
    postalCode: "2710-591",
    addressCountry: "PT",
  },
  "sintra-palace": {
    "@type": "PostalAddress",
    streetAddress: "Largo Rainha Dona Amélia",
    addressLocality: "Sintra",
    postalCode: "2710-616",
    addressCountry: "PT",
  },
  "convento-capuchos": {
    "@type": "PostalAddress",
    streetAddress: "Convento dos Capuchos",
    addressLocality: "Sintra",
    postalCode: "2710-405",
    addressCountry: "PT",
  },
  "cabo-da-roca": {
    "@type": "PostalAddress",
    streetAddress: "Estrada do Cabo da Roca",
    addressLocality: "Colares",
    postalCode: "2705-001",
    addressCountry: "PT",
  },
  "villa-sassetti": {
    "@type": "PostalAddress",
    streetAddress: "Estrada da Pena",
    addressLocality: "Sintra",
    postalCode: "2710-609",
    addressCountry: "PT",
  },
};

export function AttractionDetailPage() {
  const { language = "en", onNavigate } =
    useOutletContext<OutletContext>();
  const { slug } = useParams<{ slug: string }>();

  // Map slug to attraction ID - we'll need to find the attraction by slug or ID
  const attractionId = slug || "";

  // Live CMS data (saved via Content Editor → Supabase)
  const content = useEditableContent(language);
  const cmsAttraction =
    content.attractions?.attractionDetails?.[attractionId] ??
    DEFAULT_COMPREHENSIVE_CONTENT.attractions.attractionDetails[attractionId];

  const tAttr = getTranslation(language).attractionDetail;
  const tBreadcrumbs = getTranslation(language).breadcrumbs;

  // Get translated text from JSON locale (used for multilingual text)
  const translatedAttractions = getTranslation(language).attractions;
  const translatedAttraction = (translatedAttractions as any)[attractionId];

  // Merge: locale translations always win for text in non-English languages.
  // Images always come from CMS when available.
  const attraction = cmsAttraction
    ? {
        ...cmsAttraction,
        // Text: locale translation takes priority for non-English; fall back to CMS
        name:
          (language !== "en" && translatedAttraction?.name) ||
          cmsAttraction.name,
        shortDescription:
          (language !== "en" &&
            (translatedAttraction?.description ??
              translatedAttraction?.shortDescription)) ||
          cmsAttraction.shortDescription ||
          translatedAttraction?.description ||
          "",
        longDescription:
          (language !== "en" && translatedAttraction?.longDescription) ||
          cmsAttraction.longDescription ||
          "",
        highlights:
          (language !== "en" && translatedAttraction?.highlights?.length
            ? translatedAttraction.highlights
            : null) ??
          cmsAttraction.highlights ??
          [],
        tips:
          (language !== "en" && translatedAttraction?.tips?.length
            ? translatedAttraction.tips
            : null) ??
          cmsAttraction.tips ??
          [],
        hours:
          (language !== "en" && translatedAttraction?.hours) ||
          cmsAttraction.hours ||
          "",
        // Image resolution: cardImage → heroImage → gallery[0] → imageUrl
        imageUrl:
          cmsAttraction.cardImage ||
          cmsAttraction.heroImage ||
          cmsAttraction.gallery?.[0] ||
          (cmsAttraction as any).imageUrl ||
          "",
      }
    : translatedAttraction
      ? {
          ...translatedAttraction,
          shortDescription: translatedAttraction.description,
        }
      : null;

  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");

  if (!attraction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-foreground">
            {tAttr.notFound}
          </h2>
          <Button onClick={() => onNavigate("attractions")}>
            {tAttr.backToAttractions}
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
  const structuredData = useMemo(() => {
    if (!attraction) return null;

    return {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: attraction.name,
      description:
        attraction.longDescription ||
        attraction.shortDescription,
      image:
        attraction.heroImage ||
        attraction.imageUrl ||
        "",
      address: attractionAddresses[attractionId] || {
        "@type": "PostalAddress",
        addressLocality: "Sintra",
        addressCountry: "PT",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "250",
        bestRating: "5",
      },
      ...(attraction.price && { priceRange: "€€" }),
    };
  }, [attraction, attractionId]);

  return (
    <div className="flex-1">
      {/* SEO Meta Tags - React Helmet Async */}
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{attraction.name} - Tickets, Hours & Visitor Guide | Hop On Sintra</title>
        <meta name="title" content={`${attraction.name} - Tickets, Hours & Visitor Guide | Hop On Sintra`} />
        <meta 
          name="description" 
          content={`${attraction.shortDescription} Entry tickets from €${attraction.price}. ${attraction.duration}. ${attraction.longDescription.substring(0, 100)}...`} 
        />
        <meta 
          name="keywords" 
          content={`${attraction.name}, ${attraction.name} Sintra, ${attraction.name} tickets, ${attraction.name} hours, ${attraction.name} entrance fee, Sintra attractions, visit ${attraction.name}, Portugal UNESCO sites`} 
        />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.hoponsintra.com/attractions/${attractionId}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.hoponsintra.com/attractions/${attractionId}`} />
        <meta property="og:title" content={`${attraction.name} - Tickets & Visitor Guide`} />
        <meta property="og:description" content={`${attraction.shortDescription} Entry from €${attraction.price}. ${attraction.duration}.`} />
        <meta
          property="og:image"
          content={attraction.heroImage || attraction.imageUrl || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop"}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${attraction.name} - Sintra UNESCO Heritage Site`} />
        <meta property="og:site_name" content="Hop On Sintra" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://www.hoponsintra.com/attractions/${attractionId}`} />
        <meta name="twitter:title" content={`${attraction.name} - Tickets & Visitor Guide`} />
        <meta name="twitter:description" content={`${attraction.shortDescription} Entry from €${attraction.price}.`} />
        <meta
          name="twitter:image"
          content={attraction.heroImage || attraction.imageUrl || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop"}
        />
        <meta name="twitter:image:alt" content={`${attraction.name} - Sintra`} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Hop On Sintra" />
        <meta name="geo.placename" content="Sintra, Portugal" />
        <meta name="geo.region" content="PT-11" />
      </Helmet>

      {/* Structured Data for SEO */}
      {attraction && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      {/* Breadcrumb + Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: tBreadcrumbs.home, href: "/" },
            { label: tBreadcrumbs.attractions, href: "/attractions" },
            { label: attraction.name, href: `/attractions/${attractionId}` },
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] sm:h-[60vh] sm:min-h-[500px] overflow-hidden">
        <ImageWithFallback
          src={attraction.heroImage || attraction.imageUrl || ""}
          fallbackSrc={attraction.imageUrl}
          alt={attraction.name}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-8 sm:pb-12 md:pb-16 lg:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                {attraction.name}
              </h1>

              <p className="max-w-2xl text-lg sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-8 leading-relaxed">
                {attraction.shortDescription}
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-3">
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
                    {tAttr.mustSee}
                  </span>
                </div>
              </div>
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
              <div>
                <h2 className="mb-4 sm:mb-5 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  {tAttr.whatMakesItSpecial}
                </h2>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {attraction.longDescription}
                </p>
              </div>

              {/* Image Gallery Carousel */}
              {attraction.gallery &&
                attraction.gallery.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <Badge className="mb-3 sm:mb-4">
                      <Camera className="mr-1 h-3 w-3" />
                      {tAttr.gallery}
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
                                    loading="lazy"
                                    decoding="async"
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
                  </div>
                )}

              {/* Opening Hours & Ticket Info - Mobile Only */}
              <div className="space-y-6 lg:hidden">
                {/* Opening Hours Card - Mobile */}
                <div>
                  <Card className="p-6 shadow-xl">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="text-foreground">
                        {tAttr.openingHours}
                      </h4>
                    </div>
                    <p className="text-muted-foreground">
                      {attraction.hours}
                    </p>
                  </Card>
                </div>

                {/* Ticket Information Card - Mobile */}
                <div>
                  <Card className="p-6 shadow-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Ticket className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-foreground">
                        {tAttr.ticketInformation}
                      </h3>
                    </div>

                    <div className="mb-6 rounded-xl bg-secondary/30 p-6 text-center">
                      <div className="mb-2 text-sm text-muted-foreground">
                        {tAttr.entranceTicket}
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
                        {tAttr.onlineBookingComingSoon}
                      </Badge>
                    </div>

                    <div className="mb-6 space-y-2 rounded-xl bg-primary/5 p-4">
                      <p className="text-sm text-muted-foreground">
                        {tAttr.ticketsAtEntrance}
                      </p>
                    </div>

                    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                      <h4 className="mb-2 flex items-center gap-2 text-foreground">
                        {"💡 " + tAttr.getThereEasily}
                      </h4>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {tAttr.dayPassPromo}
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => onNavigate("buy-ticket")}
                      >
                        {tAttr.getDayPass}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h3 className="mb-5 sm:mb-6 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {tAttr.dontMissThese}
                </h3>
                <div className="grid gap-4">
                  {attraction.highlights.map(
                    (highlight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 sm:gap-4 rounded-xl border border-border/50 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:border-primary/20"
                      >
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-base sm:text-lg text-foreground leading-relaxed">
                          {highlight}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Visitor Tips */}
              <div>
                <h3 className="mb-5 sm:mb-6 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {tAttr.insiderTips}
                </h3>
                <div className="grid gap-4">
                  {attraction.tips.map((tip, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5 transition-all hover:shadow-md hover:bg-accent/10"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                        <p className="text-base sm:text-lg text-foreground leading-relaxed">
                          {tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Needed - Mobile Only */}
              <div className="lg:hidden">
                <Card className="p-6 transition-all hover:shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Camera className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="text-foreground">
                      {tAttr.timeNeeded}
                    </h4>
                  </div>
                  <p className="text-muted-foreground">
                    {attraction.duration}
                  </p>
                </Card>
              </div>
            </div>

            {/* Right Column - Ticket Info Card (Desktop Only) */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Opening Hours Card */}
                <Card className="p-6 shadow-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-foreground">
                      {tAttr.openingHours}
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
                      {tAttr.ticketInformation}
                    </h3>
                  </div>

                  <div className="mb-6 rounded-xl bg-secondary/30 p-6 text-center">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {tAttr.entranceTicket}
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
                      {tAttr.onlineBookingComingSoon}
                    </Badge>
                  </div>

                  <div className="mb-6 space-y-2 rounded-xl bg-primary/5 p-4">
                    <p className="text-sm text-muted-foreground">
                      {tAttr.ticketsAtEntrance}
                    </p>
                  </div>

                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <h4 className="mb-2 flex items-center gap-2 text-foreground">
                      {"💡 " + tAttr.getThereEasily}
                    </h4>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {tAttr.dayPassPromo}
                    </p>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => onNavigate("buy-ticket")}
                    >
                      {tAttr.getDayPass}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Attractions */}
      {(() => {
        const allAttractionIds = Object.keys(attractionAddresses);
        const otherAttractions = allAttractionIds
          .filter((id) => id !== attractionId)
          .slice(0, 3)
          .map((id) => {
            const translated = (getTranslation(language).attractions as any)[id];
            // Prefer live CMS data; fall back to hardcoded defaults
            const cms = content.attractions?.attractionDetails?.[id];
            const comprehensive = cms ?? DEFAULT_COMPREHENSIVE_CONTENT.attractions.attractionDetails[id];
            return translated || comprehensive ? {
              id,
              name: comprehensive?.name || translated?.name || id,
              description: comprehensive?.shortDescription || translated?.description || "",
              // Correct field priority: cardImage → heroImage → gallery[0] → locale imageUrl
              imageUrl:
                comprehensive?.cardImage ||
                comprehensive?.heroImage ||
                comprehensive?.gallery?.[0] ||
                translated?.imageUrl ||
                "",
            } : null;
          })
          .filter(Boolean) as { id: string; name: string; description: string; imageUrl: string }[];

        if (otherAttractions.length === 0) return null;

        return (
          <section className="border-t border-border bg-secondary/20 py-10 sm:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
                {tAttr.exploreMoreAttractions}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {otherAttractions.map((a) => (
                  <Link
                    key={a.id}
                    to={`/attractions/${a.id}`}
                    className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={a.imageUrl}
                        alt={a.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 font-semibold text-foreground">{a.name}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {tAttr.learnMore} <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}