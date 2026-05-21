import { useState, useEffect, useRef, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  ArrowLeft,
  Ticket,
  Clock,
  MapPin,
  Check,
  Users,
  Car,
  ChevronRight,
  ChevronLeft,
  Camera,
  Sparkles,
  CalendarCheck,
  Star,
  BookOpen,
  Compass,
  MessageCircle,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  loadContentWithLanguage,
  type WebsiteContent,
  DEFAULT_CONTENT,
} from "../lib/contentManager";
import { useEditableContent } from "../lib/useEditableContent";
import { getTranslation } from "../lib/translations/loader";
import { Breadcrumbs } from "./Breadcrumbs";
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

// ── Mobile sticky booking bar ─────────────────────────────────────────────────
// Rendered below the hero on mobile. Uses position:sticky so it stays in the
// normal document flow (no page-shift on stick) and lands flush under the
// header. Hidden on desktop (lg+).
function MobileStickyBar({ basePrice, onBook, labelFrom, labelPerPerson, labelGetPass }: { basePrice: number; onBook: () => void; labelFrom: string; labelPerPerson: string; labelGetPass: string }) {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = document.querySelector("[data-site-header]") ?? document.querySelector("header");
    if (!el) return;
    // ResizeObserver fires whenever the element's size changes (initial paint,
    // font load, viewport resize, URL-bar collapse on mobile, etc.)
    const ro = new ResizeObserver(() => {
      setHeaderHeight((el as HTMLElement).offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="lg:hidden sticky z-40 bg-white border-b border-stone-200 shadow-sm"
      style={{ top: headerHeight }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 leading-none mb-0.5">
            {labelFrom}
          </p>
          <p className="text-2xl font-extrabold leading-none text-primary">
            €{basePrice}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/ {labelPerPerson}</span>
          </p>
        </div>
        <Button
          onClick={onBook}
          className="h-10 shrink-0 px-5 text-sm font-semibold"
        >
          <Ticket className="mr-1.5 h-4 w-4" />
          {labelGetPass}
        </Button>
      </div>
    </div>
  );
}

export function HopOnServiceDetailPage() {
  const { language = "en", onNavigate } =
    useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Use the hook that auto-updates when content changes
  const comprehensiveContent = useEditableContent(language);
  const t = getTranslation(language).hopOnService;

  const [contactOpen, setContactOpen] = useState(false);

  // Day pass price — read from localStorage (set by admin pricing sync)
  const [basePrice, setBasePrice] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("admin-pricing");
      if (saved) {
        const p = JSON.parse(saved);
        return p.basePrice || 25;
      }
    } catch (_) {}
    return 25;
  });
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-pricing");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.basePrice) setBasePrice(p.basePrice);
      }
    } catch (_) {}
  }, []);

  // Gallery images for the service - from editable content
  const galleryImages =
    comprehensiveContent.hopOnService.galleryImages || [];

  // Service features
  const features = useMemo(() => [
    {
      icon: <Car className="h-6 w-6" />,
      title: t.feature1Title,
      description: t.feature1Desc,
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: t.feature2Title,
      description: t.feature2Desc,
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t.feature3Title,
      description: t.feature3Desc,
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: t.feature4Title,
      description: t.feature4Desc,
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: t.feature5Title,
      description: t.feature5Desc,
    },
    {
      icon: <Check className="h-6 w-6" />,
      title: t.feature6Title,
      description: t.feature6Desc,
    },
  ], [t]);

  // FAQ items
  const faqItems = useMemo(() => [
    { question: t.faq1Q, answer: t.faq1A },
    { question: t.faq2Q, answer: t.faq2A },
    { question: t.faq3Q, answer: t.faq3A },
    { question: t.faq4Q, answer: t.faq4A },
    { question: t.faq5Q, answer: t.faq5A },
    { question: t.faq6Q, answer: t.faq6A },
    { question: t.faq7Q, answer: t.faq7A },
    { question: t.faq8Q, answer: t.faq8A },
  ], [t]);

  // Generate structured data for SEO
  const structuredData = useMemo(() => {
    // Product schema for the day pass service
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Hop On Sintra Day Pass",
      description:
        "Unlimited hop-on/hop-off day pass for exploring Sintra's palaces and attractions. Guaranteed seating in tuk-tuks and UMM jeeps with service from 9am to 7pm daily.",
      brand: {
        "@type": "Brand",
        name: "Hop On Sintra",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://hoponsintra.com/hop-on-hop-off-sintra",
        validFrom: new Date().toISOString(),
        priceValidUntil: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "523",
        bestRating: "5",
      },
      category: "Transportation Service",
    };

    // FAQPage schema for the FAQ section
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    // Organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Hop On Sintra",
      url: "https://hoponsintra.com",
      logo: "https://hoponsintra.com/logo.png",
      description:
        "Hop-on/hop-off day pass service in Sintra, Portugal offering unlimited rides on tuk-tuks and UMM jeeps with guaranteed seating.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sintra",
        addressCountry: "PT",
      },
      sameAs: [],
    };

    // TouristAttraction schema for the service
    const touristAttractionSchema = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: "Hop On Sintra Transportation Service",
      description:
        "Hop-on/hop-off transportation service connecting all major Sintra attractions including Pena Palace, Quinta da Regaleira, and more.",
      geo: {
        "@type": "GeoCoordinates",
        latitude: "38.7969",
        longitude: "-9.3894",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sintra",
        addressCountry: "PT",
      },
    };

    // BreadcrumbList schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://hoponsintra.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Hop On Service",
          item: "https://hoponsintra.com/hop-on-hop-off-sintra",
        },
      ],
    };

    return {
      product: productSchema,
      faq: faqSchema,
      organization: organizationSchema,
      touristAttraction: touristAttractionSchema,
      breadcrumb: breadcrumbSchema,
    };
  }, [faqItems]);

  // Page-specific meta tags via direct DOM manipulation (replaces react-helmet-async)
  useEffect(() => {
    const updateMeta = (attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const locale = language === "en" ? "en_US" : `${language}_${language.toUpperCase()}`;

    // Open Graph
    updateMeta("property", "og:type", "product");
    updateMeta("property", "og:title", "Hop On Sintra Day Pass - Unlimited Access to All Attractions");
    updateMeta("property", "og:description", "Explore Sintra with unlimited hop-on/hop-off access. Guaranteed seating, 9am-7pm service. Visit all major palaces and attractions at your pace.");
    updateMeta("property", "og:url", "https://hoponsintra.com/hop-on-hop-off-sintra");
    updateMeta("property", "og:image", comprehensiveContent.content?.seo?.hopOnService?.ogImage || comprehensiveContent.content?.seo?.defaultOgImage || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=630&fit=crop&q=80");
    updateMeta("property", "og:image:secure_url", comprehensiveContent.content?.seo?.hopOnService?.ogImage || comprehensiveContent.content?.seo?.defaultOgImage || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=630&fit=crop&q=80");
    updateMeta("property", "og:image:width", "1200");
    updateMeta("property", "og:image:height", "630");
    updateMeta("property", "og:image:alt", "Hop On Sintra - Tuk-tuk transportation in Sintra, Portugal");
    updateMeta("property", "og:site_name", "Hop On Sintra");
    updateMeta("property", "og:locale", locale);
    updateMeta("property", "product:price:amount", "25.00");
    updateMeta("property", "product:price:currency", "EUR");

    // Twitter Card
    updateMeta("name", "twitter:card", "summary_large_image");
    updateMeta("name", "twitter:title", "Hop On Sintra Day Pass - Unlimited Access to All Attractions");
    updateMeta("name", "twitter:description", "Explore Sintra with unlimited hop-on/hop-off access. Guaranteed seating, 9am-7pm service. Visit all major palaces and attractions at your pace.");
    updateMeta("name", "twitter:image", comprehensiveContent.content?.seo?.hopOnService?.ogImage || comprehensiveContent.content?.seo?.defaultOgImage || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=630&fit=crop&q=80");
    updateMeta("name", "twitter:image:alt", "Hop On Sintra - Tuk-tuk transportation in Sintra, Portugal");

    // Additional meta
    updateMeta("name", "author", "Hop On Sintra");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://hoponsintra.com/hop-on-hop-off-sintra";
  }, [language, comprehensiveContent]);

  return (
    <div className="flex-1">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Breadcrumb nav */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Hop-On Hop-Off Sintra", href: "/hop-on-hop-off-sintra" },
          ]} />
        </div>
      </div>

      {/* Hero Section — mobile only */}
      <section className="lg:hidden relative h-[50vh] min-h-[380px] sm:h-[55vh] overflow-hidden">
        <ImageWithFallback
          src="https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1772130531176_DSC00736.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzcyMTMwNTMxMTc2X0RTQzAwNzM2LmpwZyIsImlhdCI6MTc3MjEzMDUzMSwiZXhwIjoyMDg3NDkwNTMxfQ.NPoVTbN_JDAY3WeJMMOwDBZycryqw2oFM2MYfCaxi-8"
          alt="Hop On Sintra Service"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h1 className="mb-3 text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-xl">
                {t.heroTitle}
              </h1>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Car className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">{t.badgeUnlimitedRides}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">{t.badge9am7pm}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Desktop layout (lg+) ─────────────────────────────────────── */}
      <div className="hidden lg:block bg-background">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Page title */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground xl:text-5xl">{t.heroTitle}</h1>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                <Car className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-primary">{t.badgeUnlimitedRides}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium text-primary">{t.badge9am7pm}</span>
              </div>
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-3 gap-8">
            {/* ── Left column: image → description → gallery → features → FAQ → explore ── */}
            <div className="col-span-2 space-y-8">
              {/* Hero image */}
              <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                <ImageWithFallback
                  src="https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1772130531176_DSC00736.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzcyMTMwNTMxMTc2X0RTQzAwNzM2LmpwZyIsImlhdCI6MTc3MjEzMDUzMSwiZXhwIjoyMDg3NDkwNTMxfQ.NPoVTbN_JDAY3WeJMMOwDBZycryqw2oFM2MYfCaxi-8"
                  alt={t.heroTitle}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Description */}
              <p className="text-xl font-semibold leading-relaxed text-foreground border-l-4 border-primary pl-5">
                {t.descriptionP1}
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t.descriptionP2}
              </p>

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <div>
                  <Badge className="mb-4">
                    <Camera className="mr-1 h-3 w-3" />
                    {t.galleryBadge}
                  </Badge>
                  <div className="overflow-hidden rounded-2xl shadow-lg bg-gray-100">
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
                      {galleryImages.map((image, index) => (
                        <div key={index} className="w-full">
                          <div className="h-[450px] w-full bg-gray-200">
                            <img
                              src={image}
                              alt={`Hop On Sintra Service - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </div>
                </div>
              )}

              {/* Service Features */}
              <div>
                <h2 className="mb-6 text-2xl font-bold text-foreground">{t.featuresTitle}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <Card key={index} className="p-5 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="pb-6">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{t.faqTitle}</h2>
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`desktop-faq-${index}`} className="border rounded-lg px-4 bg-white shadow-sm">
                      <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Explore More */}
              <div className="pb-12">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{t.exploreSectionTitle}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate("/travel-guide")}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          {t.travelGuideTitle}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-sm text-muted-foreground">{t.travelGuideDesc}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate("/private-tours")}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                        <Compass className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          {t.privateToursTitle}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-sm text-muted-foreground">{t.privateToursDesc}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* ── Right column: sticky booking card + why choose ── */}
            <div className="col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Booking card */}
                <Card className="overflow-hidden shadow-md">
                  <div className="p-5">
                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{t.priceFrom}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-foreground">€{basePrice}</span>
                        <span className="text-sm text-muted-foreground">/ {t.pricePerPerson}</span>
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="mb-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span>{t.bookingDetail1}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
                        <span>{t.bookingDetail2}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <span>{t.bookingDetail3}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{t.bookingDetail4}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button onClick={() => navigate("/buy-ticket")} size="lg" className="mb-4 w-full font-semibold">
                      <Ticket className="mr-2 h-5 w-5" />
                      {t.bookNow}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mb-3">{t.bookingFootnote}</p>

                    {/* Contact CTA */}
                    <div className="text-center">
                      <button
                        onClick={() => setContactOpen(true)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      >
                        Have questions? Contact us
                      </button>
                    </div>

                    {/* Contact modal */}
                    <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                      <DialogContent className="max-w-xs rounded-2xl p-6 text-center">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold text-foreground">
                            We're here to help
                          </DialogTitle>
                        </DialogHeader>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Choose how you'd like to reach us
                        </p>
                        <div className="mt-5 flex flex-col gap-3">
                          <a
                            href="https://wa.me/351932967279"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            onClick={() => setContactOpen(false)}
                          >
                            <MessageCircle className="h-4 w-4 shrink-0" />
                            WhatsApp
                          </a>
                          <a
                            href="mailto:hoponsintra@gmail.com"
                            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                            onClick={() => setContactOpen(false)}
                          >
                            <Mail className="h-4 w-4 shrink-0" />
                            hoponsintra@gmail.com
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>

                {/* Why Choose card */}
                <Card className="p-5 shadow-lg bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    {t.whyUsTitle}
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t.whyUs1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t.whyUs2}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t.whyUs3}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{t.whyUs4}</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── only visible below lg breakpoint ── */}
      <MobileStickyBar basePrice={basePrice} onBook={() => navigate("/buy-ticket")} labelFrom={t.priceFrom} labelPerPerson={t.pricePerPerson} labelGetPass={t.getYourPass} />

      {/* Mobile description summary card */}
      <div className="lg:hidden bg-background px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-secondary/30 px-5 py-4 shadow-sm">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.descriptionP1}
          </p>
        </div>
      </div>

      {/* Mobile Content */}
      <section className="lg:hidden py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-8 sm:space-y-12">
            {/* Content */}
            <div className="space-y-8 sm:space-y-12 min-w-0">
              {/* Description */}
              <div>
                <h2 className="mb-4 sm:mb-5 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  {t.descriptionTitle}
                </h2>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground mb-4">
                  {t.descriptionP1}
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {t.descriptionP2}
                </p>
              </div>

              {/* Image Gallery Carousel */}
              {galleryImages.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <Badge className="mb-3 sm:mb-4">
                    <Camera className="mr-1 h-3 w-3" />
                    {t.galleryBadge}
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
                        {galleryImages.map((image, index) => (
                          <div key={index} className="w-full">
                            <div className="h-[250px] sm:h-[350px] lg:h-[450px] w-full bg-gray-200">
                              <img
                                src={image}
                                alt={`Hop On Sintra Service - Image ${index + 1}`}
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
                        ))}
                      </Slider>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Features */}
              <div>
                <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-foreground">
                  {t.featuresTitle}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      className="p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-foreground">
                  {t.faqTitle}
                </h2>
                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-3"
                >
                  {faqItems.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border rounded-lg px-4 bg-white shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Explore More Section */}
              <div>
                <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-foreground">
                  {t.exploreSectionTitle}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Travel Guide Link */}
                  <Card
                    className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => navigate("/travel-guide")}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          {t.travelGuideTitle}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.travelGuideDesc}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Private Tours Link */}
                  <Card
                    className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => navigate("/private-tours")}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                        <Compass className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          {t.privateToursTitle}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.privateToursDesc}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}