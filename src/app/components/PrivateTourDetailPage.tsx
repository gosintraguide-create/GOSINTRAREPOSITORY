import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TourBookingDialog } from "./TourBookingDialog";
import {
  ArrowLeft,
  Users,
  Clock,
  Check,
  CheckCircle,
  Euro,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronDown,
  Ticket,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { analytics } from "../lib/analytics";
import { getTranslation } from "../lib/translations/loader";
import { Breadcrumbs } from "./Breadcrumbs";
import { Link } from "react-router";

const SITE_URL = "https://www.hoponsintra.com";

// Module-level cache so navigating back to a tour skips the API call
const toursCache: Record<string, { tours: PrivateTour[]; ts: number }> = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/** Convert a human-readable duration string to ISO 8601 (e.g. "4 hours" → "PT4H") */
function parseDuration(durationStr: string): string {
  const s = durationStr.toLowerCase();
  if (s.includes("full day")) return "PT8H";
  if (s.includes("half day")) return "PT4H";

  // Range like "4-5 hours" → average
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)\s*h/);
  if (range) {
    const avg = Math.round((parseInt(range[1]) + parseInt(range[2])) / 2);
    return `PT${avg}H`;
  }

  // Decimal hours like "1.5 hours"
  const dec = s.match(/(\d+\.?\d*)\s*h/);
  if (dec) {
    const total = parseFloat(dec[1]);
    const h = Math.floor(total);
    const m = Math.round((total - h) * 60);
    return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
  }

  return "PT3H"; // safe fallback
}

/** Extract the lowest numeric price from a tour object */
function getLowestPrice(tour: PrivateTour): number | null {
  if (tour.perPersonPrice && tour.perPersonPrice > 0) return tour.perPersonPrice;
  if (tour.fixedPrice && tour.fixedPrice > 0) return tour.fixedPrice;
  if (tour.groupTiers && tour.groupTiers.length > 0) {
    return Math.min(...tour.groupTiers.map((t) => t.price));
  }
  // Parse from price string like "€150" or "From €75 per person"
  const m = tour.price.replace(/,/g, "").match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function MobileStickyBar({ price, duration, onBook }: { price: number | null; duration?: string; onBook: () => void }) {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = document.querySelector("[data-site-header]") ?? document.querySelector("header");
    if (!el) return;
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
          {price != null ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 leading-none mb-0.5">From</p>
              <p className="text-2xl font-extrabold leading-none text-primary">
                €{price}
                <span className="ml-1 text-xs font-medium text-muted-foreground">/ person</span>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-foreground">Private Tour</p>
          )}
        </div>
        {duration && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{duration}</span>
          </div>
        )}
        <Button onClick={onBook} className="h-10 shrink-0 px-5 text-sm font-semibold">
          <Ticket className="mr-1.5 h-4 w-4" />
          Book this tour
        </Button>
      </div>
    </div>
  );
}

interface PrivateTour {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  duration: string;
  price: string;
  priceSubtext?: string;
  pricingMode?: 'per-person' | 'group-tiers' | 'fixed' | 'quote-only';
  perPersonPrice?: number;
  minPeople?: number;
  groupTiers?: Array<{
    minPeople: number;
    maxPeople: number;
    price: number;
  }>;
  fixedPrice?: number;
  maxGroupSize?: number;
  allowQuoteRequest?: boolean;
  availableTimeSlots?: string[];
  features: string[];
  badge?: string;
  badgeColor?: "primary" | "accent";
  buttonText: string;
  buttonVariant?: "default" | "outline";
  published: boolean;
  order: number;
  heroImage?: string;
}

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function PrivateTourDetailPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const { slug } = useParams<{ slug: string }>();
  const tTour = getTranslation(language).privateTourDetail;
  const tBreadcrumbs = getTranslation(language).breadcrumbs;

  const [tour, setTour] = useState<PrivateTour | null>(null);
  const [otherTours, setOtherTours] = useState<PrivateTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Desktop booking card pre-fill state
  const [cardDate, setCardDate] = useState<Date | undefined>(undefined);
  const [cardPeople, setCardPeople] = useState(1);

  const loadTour = async () => {
    setLoading(true);
    try {
      const cacheKey = language || "en";
      const cached = toursCache[cacheKey];

      let tours: PrivateTour[];
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        tours = cached.tours;
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours${language && language !== 'en' ? `?lang=${language}` : ''}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        tours = data.tours || [];
        toursCache[cacheKey] = { tours, ts: Date.now() };
      }

      const foundTour = tours.find((t) => t.id === slug);
      setTour(foundTour || null);
      setOtherTours(tours.filter((t) => t.id !== slug && t.published).slice(0, 3));
    } catch (error) {
      console.error("Error loading tour:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTour();
  }, [slug, language]);

  // Sync people count with tour minimum when tour loads
  useEffect(() => {
    if (tour?.minPeople) setCardPeople(tour.minPeople);
  }, [tour?.id]);

  const tourStructuredData = useMemo(() => {
    if (!tour) return null;
    const lowestPrice = getLowestPrice(tour);
    const tourUrl = `${SITE_URL}/private-tours/${tour.id}`;
    const tourImage =
      tour.heroImage ||
      "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200";

    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: tour.title,
      description: tour.longDescription || tour.description,
      image: tourImage,
      url: tourUrl,
      duration: parseDuration(tour.duration),
      touristType: "Private Tour",
      provider: {
        "@type": "TravelAgency",
        name: "Go Sintra",
        url: SITE_URL,
        telephone: "+351 919 495 826",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sintra",
          addressCountry: "PT",
        },
      },
      itinerary: {
        "@type": "ItemList",
        itemListElement: tour.features.map((feature, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: feature,
        })),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "48",
        bestRating: "5",
        worstRating: "1",
      },
      potentialAction: {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: tourUrl,
          actionPlatform: [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform",
          ],
        },
        result: {
          "@type": "Reservation",
          name: `Book ${tour.title}`,
        },
      },
    };

    if (lowestPrice !== null && tour.pricingMode !== "quote-only") {
      schema["offers"] = {
        "@type": "Offer",
        price: lowestPrice,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: tourUrl,
      };
    }

    return schema;
  }, [tour]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">{tTour.loading}</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-2xl font-bold">{tTour.notFound}</div>
        <Button onClick={() => onNavigate("private-tours")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {tTour.backToPrivateTours}
        </Button>
      </div>
    );
  }

  const tourUrl = `${SITE_URL}/private-tours/${tour.id}`;
  const tourImage =
    tour.heroImage ||
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200";

  return (
    <div className="flex-1">
      <Helmet>
        <title>{tour.title} | Private Tours Sintra – Go Sintra</title>
        <meta name="description" content={tour.description} />
        <link rel="canonical" href={tourUrl} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${tour.title} | Go Sintra`} />
        <meta property="og:description" content={tour.description} />
        <meta property="og:image" content={tourImage} />
        <meta property="og:url" content={tourUrl} />
        <meta property="og:site_name" content="Go Sintra" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${tour.title} | Go Sintra`} />
        <meta name="twitter:description" content={tour.description} />
        <meta name="twitter:image" content={tourImage} />
        {/* JSON-LD */}
        {tourStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(tourStructuredData)}
          </script>
        )}
      </Helmet>

      {/* Breadcrumb */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: tBreadcrumbs.home, href: "/" },
            { label: tBreadcrumbs.privateTours, href: "/private-tours" },
            { label: tour.title, href: `/private-tours/${tour.id}` },
          ]} />
        </div>
      </div>

      {/* ── Mobile hero — image with title overlay ──────────────────── */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden lg:hidden">
        <ImageWithFallback
          src={tour.heroImage || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1920"}
          alt={tour.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-white sm:text-5xl">
                  {tour.title}
                </h1>
                {tour.badge && (
                  <Badge
                    variant={tour.badgeColor === "accent" ? "default" : "secondary"}
                    className={
                      tour.badgeColor === "accent" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    }
                  >
                    {tour.badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Desktop layout — persistent two-column ──────────────────── */}
      <div className="hidden lg:block bg-background">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {/* Page title */}
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-4xl font-bold text-foreground xl:text-5xl">
              {tour.title}
            </h1>
            {tour.badge && (
              <Badge
                variant={tour.badgeColor === "accent" ? "default" : "secondary"}
                className={
                  tour.badgeColor === "accent" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                }
              >
                {tour.badge}
              </Badge>
            )}
          </div>

          {/* Two-column grid — spans entire page body */}
          <div className="grid grid-cols-3 gap-8">
            {/* ── Left column: image → description → about → features ── */}
            <div className="col-span-2 space-y-8">
              {/* Hero image */}
              <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                <ImageWithFallback
                  src={tourImage}
                  alt={tour.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Short description */}
              <p className="text-base leading-relaxed text-muted-foreground">
                {tour.description}
              </p>

              {/* About This Tour */}
              {tour.longDescription && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold">{tTour.aboutThisTour}</h2>
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
                    {tour.longDescription}
                  </p>
                </div>
              )}

              {/* Features / Highlights */}
              {tour.features && tour.features.length > 0 && (
                <div className="pb-12">
                  <h2 className="mb-4 text-2xl font-bold">{tTour.tourFeatures}</h2>
                  <div className="space-y-3">
                    {tour.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: booking card + other tours ─────────── */}
            <div className="col-span-1">
              {/* Booking card */}
              <Card className="overflow-hidden shadow-md">
                {/* Badge strip */}
                {tour.badge && (
                  <div className={`px-4 py-2 text-sm font-bold text-white ${tour.badgeColor === "accent" ? "bg-accent" : "bg-red-600"}`}>
                    {tour.badge}
                  </div>
                )}

                <div className="p-5">
                  {/* Price */}
                  {tour.pricingMode !== "quote-only" && getLowestPrice(tour) != null && (
                    <div className="mb-5">
                      <p className="text-sm text-muted-foreground">From</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-foreground">€{getLowestPrice(tour)}</span>
                        <span className="text-sm text-muted-foreground">per person</span>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 space-y-3">
                    {/* Guests dropdown */}
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={cardPeople}
                        onChange={(e) => setCardPeople(Number(e.target.value))}
                        className="w-full appearance-none rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {Array.from(
                          { length: (tour.maxGroupSize ?? 20) - (tour.minPeople ?? 1) + 1 },
                          (_, i) => i + (tour.minPeople ?? 1)
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n === 1 ? "Adult × 1" : `Adults × ${n}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    {/* Date input */}
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={cardDate ? `${cardDate.getFullYear()}-${String(cardDate.getMonth() + 1).padStart(2, "0")}-${String(cardDate.getDate()).padStart(2, "0")}` : ""}
                        onChange={(e) => {
                          if (!e.target.value) { setCardDate(undefined); return; }
                          const [y, m, d] = e.target.value.split("-").map(Number);
                          setCardDate(new Date(y, m - 1, d));
                        }}
                        className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Select date"
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="mb-5 w-full"
                    onClick={() => { setShowBookingDialog(true); analytics.privateTourInquiry(); }}
                  >
                    Check availability
                  </Button>

                  {/* Trust signals */}
                  <div className="space-y-3">
                    <div className="flex gap-2.5">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Free cancellation</p>
                        <p className="text-xs text-muted-foreground">Cancel up to 24 hours in advance for a full refund</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">100% private tour</p>
                        <p className="text-xs text-muted-foreground">Exclusively for your group — no shared buses or strangers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Other tours — below the sticky card */}
              {otherTours.length > 0 && (
                <div className="mt-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {tTour.morePrivateTours}
                  </p>
                  <div className="space-y-3">
                    {otherTours.map((t) => {
                      const lowestOtherPrice = getLowestPrice(t);
                      return (
                        <Link
                          key={t.id}
                          to={`/private-tours/${t.id}`}
                          className="group flex overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          {t.heroImage && (
                            <div className="w-28 shrink-0 overflow-hidden">
                              <img
                                src={t.heroImage}
                                alt={t.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                            <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                              {t.title}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-sm">
                              {lowestOtherPrice != null && (
                                <span className="font-bold text-primary">
                                  From €{lowestOtherPrice}
                                </span>
                              )}
                              {t.duration && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  {t.duration}
                                </span>
                              )}
                              <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-primary">
                                {tTour.viewTour} <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <MobileStickyBar
        price={getLowestPrice(tour)}
        duration={tour.duration}
        onBook={() => setShowBookingDialog(true)}
      />

      {/* Tour description summary card — mobile only */}
      <div className="lg:hidden bg-background px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-secondary/30 px-5 py-4 shadow-sm">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tour.description}
          </p>
        </div>
      </div>

      {/* Main Content — About + Features (mobile only; desktop uses the two-column layout above) */}
      <section className="lg:hidden py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Long Description */}
            {tour.longDescription && (
              <div className="mb-8">
                <h2 className="mb-4 text-3xl font-bold">{tTour.aboutThisTour}</h2>
                <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
                  {tour.longDescription}
                </p>
              </div>
            )}

            {/* Tour Highlights */}
            {tour.features && tour.features.length > 0 && (
              <>
                <h2 className="mb-6 text-3xl font-bold">{tTour.tourFeatures}</h2>
                <div className="space-y-4">
                  {tour.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border p-4"
                    >
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-lg">{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Booking Dialog */}
      {tour && (
        <TourBookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          initialDate={cardDate}
          initialPeople={cardPeople}
          tour={{
            id: tour.id,
            title: tour.title,
            price: tour.price,
            pricingMode: tour.pricingMode,
            perPersonPrice: tour.perPersonPrice,
            minPeople: tour.minPeople,
            groupTiers: tour.groupTiers,
            fixedPrice: tour.fixedPrice,
            maxGroupSize: tour.maxGroupSize,
            allowQuoteRequest: tour.allowQuoteRequest,
            availableTimeSlots: tour.availableTimeSlots,
          }}
        />
      )}

      {/* Other Private Tours — mobile only; desktop shows them in the right column */}
      {otherTours.length > 0 && (
        <section className="lg:hidden border-t border-border bg-secondary/20 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
              {tTour.morePrivateTours}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {otherTours.map((t) => (
                <Link
                  key={t.id}
                  to={`/private-tours/${t.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {t.heroImage && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={t.heroImage}
                        alt={t.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="mb-1 font-semibold text-foreground">{t.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {tTour.viewTour} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}