import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router";
import { Link } from "react-router";
// Force rebuild - all fields required - Build 2025-02-10
import {
  ArrowRight,
  Check,
  Users,
  Clock,
  MapPin,
  Sparkles,
  MessageCircle,
  Rocket,
  Calendar as CalendarIcon,
  Mail,
  Phone,
  User,
  Car,
  Landmark,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { featureFlags } from "../lib/featureFlags";

const SITE_URL = "https://www.hoponsintra.com";

// Module-level cache so navigating back doesn't re-fetch
const toursListCache: Record<string, { tours: PrivateTour[]; ts: number }> = {};
const CACHE_TTL = 30 * 1000; // 30 s — only for back-navigation within a session
const LS_KEY = (lang: string) => `private-tours-cache-${lang}`;
const LS_TS_KEY = (lang: string) => `private-tours-cache-ts-${lang}`;

import { getTranslation, getUITranslation } from "../lib/translations/loader";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// Force rebuild - search bar removed

// Private Tours Page - Updated to fix module loading
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
  features: string[];
  badge?: string;
  badgeColor?: "primary" | "accent";
  buttonText: string;
  buttonVariant?: "default" | "outline";
  published: boolean;
  order: number;
  heroImage?: string;
  rating?: number;
  reviewCount?: number;
  // Category field — may not exist in older records; inferred from title if absent
  category?: string;
}

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "classic_sintra",
    name: "CLASSIC SINTRA",
    description: "Palaces, history, and the iconic route — Sintra as it should be seen.",
    accent: "#c8a84b",
    comingSoonDesc: "A new classic experience is being crafted.",
  },
  {
    id: "off_the_beaten_path",
    name: "OFF THE BEATEN PATH",
    description: "Hidden corners, local spots, the Sintra most tourists never find.",
    accent: "#2d5a3d",
    comingSoonDesc: "Another hidden gem is on its way.",
  },
  {
    id: "nature_adventure",
    name: "NATURE & ADVENTURE",
    description: "Less castles, more wilderness. Off-road, raw, and unforgettable.",
    accent: "#cc5500",
    comingSoonDesc: "A wilder adventure is being built.",
  },
  {
    id: "hiking",
    name: "HIKING",
    description: "On foot, at your pace. Different trails, different landscapes, one unforgettable region.",
    accent: "#4a6a8a",
    comingSoonDesc: "Trail guides launching soon.",
  },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  classic_sintra: "Classic",
  off_the_beaten_path: "Hidden gems",
  nature_adventure: "Adventure",
  hiking: "Hiking",
};

/** Assign a tour to a category. Uses the `category` field when present,
 *  otherwise infers from the title using keyword matching. */
function getCategoryForTour(tour: PrivateTour): CategoryId {
  if (tour.category) return tour.category as CategoryId;
  const t = tour.title.toLowerCase();
  if (t.includes("off-road") || t.includes("off road") || t.includes("nature") || t.includes("adventure")) {
    return "nature_adventure";
  }
  if (t.includes("hiking") || t.includes("hike") || t.includes("trail") || t.includes("walk")) {
    return "hiking";
  }
  if (
    t.includes("hidden") || t.includes("gem") || t.includes("beaten") ||
    t.includes("secret") || t.includes("local") || t.includes("full day")
  ) {
    return "off_the_beaten_path";
  }
  return "classic_sintra";
}

/** Return the price string to show on the compact card. */
function getDisplayPrice(tour: PrivateTour): string {
  if (tour.pricingMode === "quote-only") return "Custom quote";
  if (tour.perPersonPrice && tour.perPersonPrice > 0) return `From €${tour.perPersonPrice} / person`;
  if (tour.fixedPrice && tour.fixedPrice > 0) return `From €${tour.fixedPrice}`;
  if (tour.groupTiers && tour.groupTiers.length > 0) {
    const min = Math.min(...tour.groupTiers.map((g) => g.price));
    return `From €${min} / group`;
  }
  return tour.price || "";
}

// ── Coming Soon Card ─────────────────────────────────────────────────────────
function ComingSoonCard({ accent, description, isMobile }: { accent: string; description: string; isMobile?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fdf9f3",
        borderRadius: "14px",
        border: "0.5px solid rgba(180,140,80,0.2)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        opacity: 0.35,
        height: "100%",
        ...(isMobile ? { width: "240px", minWidth: "240px", maxWidth: "240px", flexShrink: 0 } : {}),
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          width: "100%",
          height: "180px",
          flexShrink: 0,
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          color: "white",
        }}
      >
        ＋
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
        <p style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a1a", margin: 0, lineHeight: 1.3 }}>
          More coming soon
        </p>
        <p style={{ fontSize: "12px", color: "#6b5a3a", lineHeight: 1.5, margin: 0 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ── Tour Card ────────────────────────────────────────────────────────────────
function TourCard({
  tour,
  accent,
  categoryLabel,
  isMobile,
}: {
  tour: PrivateTour;
  accent: string;
  categoryLabel: string;
  isMobile?: boolean;
}) {
  const price = getDisplayPrice(tour);
  const slashIdx = price.indexOf(" / ");
  const priceBase = slashIdx >= 0 ? price.slice(0, slashIdx) : price;
  const priceSuffix = slashIdx >= 0 ? price.slice(slashIdx + 3) : null;
  const metaParts: string[] = [categoryLabel];
  if (tour.badge) metaParts.push(tour.badge);

  return (
    <Link
      to={`/private-tours/${tour.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fdf9f3",
        borderRadius: "14px",
        border: "0.5px solid rgba(180,140,80,0.2)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.2s ease",
        height: "100%",
        ...(isMobile ? { width: "240px", minWidth: "240px", maxWidth: "240px", flexShrink: 0 } : {}),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", height: "180px", flexShrink: 0 }}>
        {tour.heroImage ? (
          <img
            src={tour.heroImage}
            alt={tour.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `${accent}40` }} />
        )}
        {tour.duration && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              color: "white",
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            {tour.duration.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          flex: 1,
        }}
      >
        {/* Meta */}
        <p style={{ fontSize: "11px", fontWeight: 600, color: "#a08050", letterSpacing: "0.3px", margin: 0 }}>
          {metaParts.join(" · ")}
        </p>
        {/* Title */}
        <p
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#1a1a1a",
            lineHeight: 1.3,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {tour.title}
        </p>
        {/* Description */}
        <p
          style={{
            fontSize: "12px",
            color: "#6b5a3a",
            lineHeight: 1.5,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            flex: 1,
          }}
        >
          {tour.description}
        </p>
        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "10px",
            borderTop: "0.5px solid rgba(180,140,80,0.2)",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a" }}>
            {tour.rating ? (
              <>★ {tour.rating} <span style={{ color: "#a08050", fontWeight: 500 }}>({tour.reviewCount})</span></>
            ) : (
              <span style={{ fontSize: "11px", fontWeight: 600, color: accent }}>View tour →</span>
            )}
          </div>
          {price && (
            <p style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
              {priceBase}
              {priceSuffix && <span style={{ fontSize: "10px", fontWeight: 500, color: "#a08050" }}> / {priceSuffix}</span>}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Category Section ─────────────────────────────────────────────────────────
function CategorySection({
  category,
  tours,
}: {
  category: typeof CATEGORIES[number];
  tours: PrivateTour[];
}) {
  const needsComingSoon = tours.length < 2;

  return (
    <div>
      {/* Category header */}
      <>
        {/* Desktop header */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: "16px", marginBottom: "20px" }}
        >
          <div
            style={{
              width: "4px",
              height: "52px",
              borderRadius: "2px",
              background: `linear-gradient(to bottom, ${category.accent}, ${category.accent}33)`,
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: category.accent,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
                marginBottom: "4px",
              }}
            >
              {category.name}
            </p>
            <p style={{ fontSize: "13px", color: "#7a6040", lineHeight: 1.5, margin: 0 }}>
              {category.description}
            </p>
          </div>
        </div>

        {/* Mobile header */}
        <div
          className="md:hidden"
          style={{
            paddingLeft: "16px",
            borderLeft: `4px solid ${category.accent}`,
            marginLeft: "18px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: 900,
              color: category.accent,
              letterSpacing: "-0.3px",
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            {category.name}
          </p>
          <p style={{ fontSize: "12px", color: "#7a6040", lineHeight: 1.5, margin: 0 }}>
            {category.description}
          </p>
        </div>
      </>

      {/* Desktop grid */}
      <div
        className="hidden md:grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", alignItems: "stretch" }}
      >
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} accent={category.accent} categoryLabel={CATEGORY_LABELS[category.id] ?? ""} />
        ))}
        {needsComingSoon && (
          <ComingSoonCard accent={category.accent} description={category.comingSoonDesc} />
        )}
      </div>

      {/* Mobile horizontal scroll */}
      <div
        className="flex md:hidden"
        style={{
          overflowX: "auto",
          gap: "12px",
          padding: "0 18px 8px",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          alignItems: "stretch",
        } as React.CSSProperties}
      >
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} accent={category.accent} categoryLabel={CATEGORY_LABELS[category.id] ?? ""} isMobile />
        ))}
        {needsComingSoon && (
          <ComingSoonCard accent={category.accent} description={category.comingSoonDesc} isMobile />
        )}
      </div>
    </div>
  );
}

// ── Category Sticky Nav ──────────────────────────────────────────────────────
const STICKY_NAV_PILLS = [
  { id: "classic_sintra", label: "Classic Sintra", sectionId: "section-classic" },
  { id: "off_the_beaten_path", label: "Off the Beaten Path", sectionId: "section-beaten" },
  { id: "nature_adventure", label: "Nature & Adventure", sectionId: "section-nature" },
  { id: "hiking", label: "Hiking", sectionId: "section-hiking" },
] as const;

function CategoryStickyNav({
  navbarHeight,
  activeCategory,
  onPillClick,
}: {
  navbarHeight: number;
  activeCategory: string;
  onPillClick: (catId: string) => void;
}) {
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = pillRefs.current[activeCategory];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeCategory]);

  return (
    <nav
      id="private-tours-sticky-nav"
      className="px-[18px] md:px-[48px]"
      style={{
        position: "sticky",
        top: navbarHeight,
        zIndex: 100,
        background: "#f5f0e8",
        borderBottom: "1px solid rgba(180,140,80,0.25)",
        display: "flex",
        justifyContent: "center",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      {STICKY_NAV_PILLS.map((pill) => {
        const isActive = activeCategory === pill.id;
        return (
          <button
            key={pill.id}
            ref={(el) => { pillRefs.current[pill.id] = el; }}
            onClick={() => onPillClick(pill.id)}
            style={{
              padding: "14px 18px",
              fontSize: "11px",
              fontWeight: 700,
              color: isActive ? "#1a1a1a" : "#a08050",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              borderWidth: "0 0 2px 0",
              borderStyle: "solid",
              borderColor: isActive ? "#ff6b35" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
              background: "transparent",
              outline: "none",
              flexShrink: 0,
            }}
          >
            {pill.label}
          </button>
        );
      })}
    </nav>
  );
}

export function PrivateToursPage() {
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();

  const content = getTranslation(language);
  const t = content.privateTours;
  const uiT = getUITranslation(language);

  const [tours, setTours] = useState<PrivateTour[]>([]);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState(false);
  const [selectedTour, setSelectedTour] = useState<PrivateTour | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    numberOfPeople: "",
    preferredDate: undefined as Date | undefined,
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Sticky nav state ──────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [stickyNavHeight, setStickyNavHeight] = useState(46);

  // Measure the site header and sticky nav heights (updates on resize too)
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector("[data-site-header]");
      if (header) setNavbarHeight(header.getBoundingClientRect().height);
      const stickyNav = document.getElementById("private-tours-sticky-nav");
      if (stickyNav) setStickyNavHeight(stickyNav.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Track which category section is in view using IntersectionObserver
  useEffect(() => {
    const offset = navbarHeight + stickyNavHeight;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pill = STICKY_NAV_PILLS.find((p) => p.sectionId === entry.target.id);
            if (pill) setActiveCategory(pill.id);
          }
        });
      },
      {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    for (const pill of STICKY_NAV_PILLS) {
      const el = document.getElementById(pill.sectionId);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [navbarHeight, stickyNavHeight]);

  const handlePillClick = (catId: string) => {
    const pill = STICKY_NAV_PILLS.find((p) => p.id === catId);
    const el = pill ? document.getElementById(pill.sectionId) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Check if Private Tours feature is enabled
  const getFeatureFlag = () => {
    try {
      const flags = localStorage.getItem("feature-flags");
      if (flags) {
        const parsed = JSON.parse(flags);
        return parsed.privateToursEnabled === true;
      }
    } catch (e) {
      console.error("Failed to parse feature flags:", e);
    }
    return featureFlags.privateToursEnabled;
  };

  const loadTours = async () => {
    setFetchError(false);
    const cacheKey = language || "en";

    // 1. Module-level cache — instant for same-session back navigation
    const inMemory = toursListCache[cacheKey];
    if (inMemory && Date.now() - inMemory.ts < CACHE_TTL) {
      setTours(inMemory.tours);
      setLoading(false);
      return;
    }

    // 2. localStorage — show immediately, always fetch fresh data in background
    let hasStaleData = false;
    try {
      const lsData = localStorage.getItem(LS_KEY(cacheKey));
      if (lsData) {
        const parsed: PrivateTour[] = JSON.parse(lsData);
        toursListCache[cacheKey] = { tours: parsed, ts: Date.now() };
        setTours(parsed);
        setLoading(false);
        hasStaleData = true; // shown instantly — always revalidate below
      }
    } catch (_) {}

    // 3. Network fetch — foreground spinner only if nothing cached yet
    if (!hasStaleData) setLoading(true);

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours${cacheKey !== 'en' ? `?lang=${cacheKey}` : ''}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) continue;
        const data = await response.json();
        const publishedTours = (data.tours || []).filter((tour: PrivateTour) => tour.published);
        // Persist to localStorage so next page load is instant
        localStorage.setItem(LS_KEY(cacheKey), JSON.stringify(publishedTours));
        localStorage.setItem(LS_TS_KEY(cacheKey), Date.now().toString());
        toursListCache[cacheKey] = { tours: publishedTours, ts: Date.now() };
        setTours(publishedTours);
        setLoading(false);
        return;
      } catch (err) {
        if (attempt === 0) continue;
        console.error("Error loading tours:", err);
      }
    }

    // Both attempts failed
    if (!hasStaleData) {
      setFetchError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getFeatureFlag()) {
      loadTours();
    }
  }, [language]);

  const toursStructuredData = useMemo(() => {
    if (tours.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Private Tours in Sintra",
      description:
        "Exclusive private tours of Sintra's palaces, castles, and historic sites with Hop On Sintra",
      url: `${SITE_URL}/private-tours`,
      numberOfItems: tours.length,
      itemListElement: tours.map((tour, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristTrip",
          name: tour.title,
          description: tour.description,
          url: `${SITE_URL}/private-tours/${tour.id}`,
          image:
            tour.heroImage ||
            "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800",
          provider: {
            "@type": "TravelAgency",
            name: "Hop On Sintra",
            url: SITE_URL,
          },
        },
      })),
    };
  }, [tours]);

  const submitTourRequest = async () => {
    if (!selectedTour) return;

    if (!formData.customerName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/tour-requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tourTitle: selectedTour.title,
            customerName: formData.customerName,
            email: formData.email,
            phone: formData.phone,
            preferredDate: formData.preferredDate?.toISOString(),
            numberOfPeople: formData.numberOfPeople ? parseInt(formData.numberOfPeople) : undefined,
            message: formData.message,
          }),
        }
      );

      if (response.ok) {
        toast.success("Request submitted! We'll contact you soon.");
        setShowRequestDialog(false);
        setFormData({
          customerName: "",
          email: "",
          phone: "",
          numberOfPeople: "",
          preferredDate: undefined,
          message: "",
        });
        setSelectedTour(null);
      } else {
        toast.error("Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting tour request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Coming Soon page (feature flag off) ─────────────────────────────────
  if (!getFeatureFlag()) {
    return (
      <div className="flex-1">
        <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-6 py-3 backdrop-blur-sm">
              <Rocket className="h-6 w-6 text-accent" />
              <span className="text-white">{t.comingSoon.badge}</span>
            </div>

            <h1 className="mb-6 text-white">{t.comingSoon.title}</h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90 sm:text-2xl">
              {t.comingSoon.subtitle}
            </p>

            <div className="mb-12 space-y-4">
              <p className="text-lg text-white/80">{t.comingSoon.stayTunedText}</p>
              <div className="mx-auto max-w-2xl space-y-3">
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature1}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature2}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/90">
                  <Check className="h-5 w-5 text-accent" />
                  <span>{t.comingSoon.feature3}</span>
                </div>
              </div>
            </div>

            <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
                onClick={() => onNavigate("live-chat")}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t.comingSoon.notifyButton}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                onClick={() => onNavigate("buy-ticket")}
              >
                {t.comingSoon.exploreDayPassButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-white/70">{t.comingSoon.footerText}</p>
          </div>
        </section>
      </div>
    );
  }

  // ── Group tours by category ──────────────────────────────────────────────
  const toursByCategory = useMemo(() => {
    const map: Record<string, PrivateTour[]> = {};
    for (const cat of CATEGORIES) map[cat.id] = [];
    for (const tour of tours) {
      const catId = getCategoryForTour(tour);
      if (!map[catId]) map[catId] = [];
      map[catId].push(tour);
    }
    return map;
  }, [tours]);

  // ── Main redesigned page ─────────────────────────────────────────────────
  return (
    <div className="flex-1" style={{ background: "#f5f0e8" }}>
      <Helmet>
        <title>Private Tours in Sintra | Hop On Sintra</title>
        <meta
          name="description"
          content="Private guided tours in Sintra with a dedicated local expert. Visit Pena Palace, Quinta da Regaleira, hidden gems, and the Atlantic coastline. Custom itineraries for families, couples, and small groups."
        />
        <link rel="canonical" href={`${SITE_URL}/private-tours`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Private Tours in Sintra | Hop On Sintra" />
        <meta
          property="og:description"
          content="Private guided tours in Sintra with a dedicated local expert. Custom itineraries for families, couples, and small groups."
        />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200"
        />
        <meta property="og:url" content={`${SITE_URL}/private-tours`} />
        <meta property="og:site_name" content="Hop On Sintra" />
        {toursStructuredData && (
          <script type="application/ld+json">
            {JSON.stringify(toursStructuredData)}
          </script>
        )}
      </Helmet>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      {/* Desktop */}
      <div
        className="hidden md:flex"
        style={{ padding: "32px 48px 0", flexDirection: "column", alignItems: "center", textAlign: "center" }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b35", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Sintra, Portugal
        </p>
        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-1px", lineHeight: 1.1, margin: 0 }}>
          {t.hero?.title || "Private tours"}
        </h1>
      </div>

      {/* Mobile */}
      <div className="md:hidden" style={{ padding: "24px 18px 0", textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#ff6b35", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Sintra, Portugal
        </p>
        <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: "8px" }}>
          {t.hero?.title || "Private tours"}
        </h1>
      </div>

      {/* ── Sticky category nav ───────────────────────────────────────────── */}
      <CategoryStickyNav
        navbarHeight={navbarHeight}
        activeCategory={activeCategory}
        onPillClick={handlePillClick}
      />

      {/* Gradient divider */}
      <div className="hidden md:block" style={{ padding: "0 48px" }}>
        <div style={{ height: "2px", background: "linear-gradient(to right, #ff6b35, #c8a84b, transparent)", borderRadius: "2px", margin: "20px 0 32px" }} />
      </div>
      <div className="md:hidden">
        <div style={{ height: "2px", background: "linear-gradient(to right, #ff6b35, #c8a84b, transparent)", borderRadius: "2px", margin: "16px 18px 24px" }} />
      </div>

      {/* ── Loading / error / empty states ────────────────────────────────── */}
      {loading && (
        <div style={{ padding: "48px 48px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#888" }}>{t.loading}</p>
        </div>
      )}

      {!loading && fetchError && (
        <div style={{ padding: "32px 48px" }}>
          <Card className="p-8 text-center">
            <p className="text-lg font-medium mb-2">Could not load tours</p>
            <p className="text-muted-foreground mb-4">
              There was a problem connecting to the server. Please try again.
            </p>
            <Button onClick={loadTours}>Try Again</Button>
          </Card>
        </div>
      )}

      {!loading && !fetchError && tours.length === 0 && (
        <div style={{ padding: "32px 48px" }}>
          <Card className="p-8 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">{t.noPackagesAvailable}</p>
            <p className="text-muted-foreground mb-4">{t.contactForCustomTours}</p>
            <Button onClick={() => onNavigate("live-chat")}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {t.contactUs}
            </Button>
          </Card>
        </div>
      )}

      {/* ── Category sections — single mount, responsive padding ────────── */}
      {!loading && !fetchError && (
        <div className="px-[18px] pb-8 pt-3 md:px-[48px] md:pb-10" style={{ maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" as const }}>
          <div className="flex flex-col gap-[28px] md:gap-[36px]">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                id={STICKY_NAV_PILLS[idx].sectionId}
                style={{ scrollMarginTop: `${navbarHeight + stickyNavHeight}px` }}
              >
                <CategorySection
                  category={cat}
                  tours={toursByCategory[cat.id] ?? []}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <>
        {/* Desktop CTA */}
        <div
          className="hidden md:flex"
          style={{
            background: "#1a1a1a",
            padding: "28px 48px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "5px" }}>
              Not sure which tour is right for you?
            </p>
            <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.5 }}>
              Chat with us and we'll help you find the perfect experience.
            </p>
          </div>
          <a
            href="https://wa.me/351932967279"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#ff6b35",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "10px",
              padding: "14px 28px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: "24px",
            }}
          >
            Chat with us →
          </a>
        </div>

        {/* Mobile CTA */}
        <div
          className="md:hidden"
          style={{
            background: "#1a1a1a",
            padding: "20px 18px",
          }}
        >
          <p style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "5px" }}>
            Not sure which tour is right for you?
          </p>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.5, marginBottom: "12px" }}>
            Chat with us and we'll help you find the perfect experience.
          </p>
          <a
            href="https://wa.me/351932967279"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              background: "#ff6b35",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "10px",
              padding: "13px 24px",
              textDecoration: "none",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            Chat with us →
          </a>
        </div>
      </>

      {/* ── Tour Request Dialog (kept for potential future use) ────────────── */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request a Private Tour</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll get back to you shortly with a personalized quote.
            </DialogDescription>
          </DialogHeader>

          {selectedTour && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-sm font-medium text-muted-foreground">Selected Tour</p>
                <p className="text-lg font-semibold text-foreground">{selectedTour.title}</p>
                <p className="text-sm text-muted-foreground">{selectedTour.price} • {selectedTour.duration}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+351 123 456 789"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="people">Number of People *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="people"
                      type="number"
                      min="1"
                      value={formData.numberOfPeople}
                      onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                      placeholder="2"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Label>Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredDate ? formData.preferredDate.toLocaleDateString() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDate}
                        onSelect={(date) => setFormData({ ...formData, preferredDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="message">Additional Information *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Any special requirements or questions?"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={submitTourRequest} disabled={submitting} className="flex-1">
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
