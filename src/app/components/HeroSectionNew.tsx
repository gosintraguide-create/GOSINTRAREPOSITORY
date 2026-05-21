import { useState } from "react";
import { ArrowRight, MessageCircle, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { WebsiteContent } from "../lib/contentManager";
import { getTranslation } from "../lib/translations/loader";

interface HeroSectionProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  priceLoaded: boolean;
  language?: string;
  legacyContent: WebsiteContent;
  content?: any;
  lowestTourPrice?: number | null;
}

const DEFAULT_HERO_IMAGE =
  "https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY";

// ── Image placeholder for cards / secondary hero slots ──────────────────────
function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-stone-200 text-center">
      <span className="text-xs text-stone-400 leading-snug px-2">{label}</span>
    </div>
  );
}

// ── Contact modal (shared markup, used per-card) ─────────────────────────────
function ContactModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            WhatsApp
          </a>
          <a
            href="mailto:hoponsintra@gmail.com"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            onClick={() => onOpenChange(false)}
          >
            <Mail className="h-4 w-4 shrink-0" />
            hoponsintra@gmail.com
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── "What We Offer" card ─────────────────────────────────────────────────────
interface OfferCardProps {
  imageUrl?: string;
  imagePlaceholderLabel?: string;
  title: string;
  description: string;
  /** Small text link at bottom of content (e.g. "See what's included →") */
  ctaLabel?: string;
  /** Primary CTA button label — if provided, renders a full-width button */
  ctaButtonLabel?: string;
  /** Navigates to detail page (card click + ctaLabel) */
  onClick: () => void;
  /** Navigates on primary CTA button press; falls back to onClick if omitted */
  onBookClick?: () => void;
  fromPrice?: number | null;
  /** Appended to price: "person" → "€15/person" */
  priceUnit?: string;
  /** Overlay badge top-left on the image */
  badge?: string;
  badgeVariant?: "accent" | "primary";
  pills?: string[];
  quote?: string;
  /** Dark card style (slate-800 background) */
  dark?: boolean;
  /** Show "Have questions? Chat with us" link */
  showContact?: boolean;
}

function OfferCard({
  imageUrl,
  imagePlaceholderLabel,
  title,
  description,
  ctaLabel,
  ctaButtonLabel,
  onClick,
  onBookClick,
  fromPrice,
  priceUnit,
  badge,
  badgeVariant = "accent",
  pills,
  quote,
  dark = false,
  showContact = false,
}: OfferCardProps) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div
      className={`group flex flex-row sm:flex-col overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-lg cursor-pointer sm:cursor-default ${
        dark ? "bg-slate-800" : "border border-stone-200 bg-white"
      }`}
      onClick={onClick}
    >
      {/* ── Image + overlays ── */}
      {/* Mobile: fixed 130px wide, full card height. sm+: full width, 4/3 aspect */}
      <div
        className="relative w-[130px] shrink-0 overflow-hidden bg-stone-200 sm:w-auto sm:aspect-[4/3] sm:cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder label={imagePlaceholderLabel ?? title} />
        )}

        {/* Badge top-left — smaller on mobile */}
        {badge && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${
              badgeVariant === "accent" ? "bg-accent" : "bg-primary"
            }`}
          >
            {badge}
          </span>
        )}

        {/* Price pill — image overlay on desktop only; mobile shows it in content */}
        {fromPrice != null && (
          <div
            className={`absolute right-3 top-3 hidden rounded-full px-3 py-1 text-xs font-semibold shadow sm:block ${
              dark ? "bg-slate-700/90 text-white" : "bg-white/90 text-foreground"
            }`}
          >
            From <span className="font-bold">€{fromPrice}</span>
            {priceUnit ? `/${priceUnit}` : ""}
          </div>
        )}
      </div>

      {/* ── Content — flex-1 so it stretches to fill card height ── */}
      <div className="flex flex-1 flex-col p-3 sm:p-6">

        {/* Top section: title + description + pills + quote */}
        <div className="flex-1">

          {/* Price line — mobile only (replaces image overlay pill) */}
          {fromPrice != null && (
            <p className={`mb-1 text-xs font-semibold sm:hidden ${dark ? "text-slate-300" : "text-foreground"}`}>
              From <span className="font-bold">€{fromPrice}</span>{priceUnit ? `/${priceUnit}` : ""}
            </p>
          )}

          <h3
            className={`mb-1 text-sm font-bold sm:mb-2 sm:text-lg ${
              dark ? "text-white" : "text-foreground"
            }`}
          >
            {title}
          </h3>

          <p
            className={`mb-2 hidden text-xs leading-relaxed sm:mb-4 sm:block sm:text-sm ${
              dark ? "text-slate-400" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>

          {/* Feature pills */}
          {pills && pills.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1 sm:mb-4 sm:gap-1.5">
              {pills.map((pill, i) => (
                <span
                  key={i}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:text-xs ${
                    dark ? "bg-slate-700 text-slate-300" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          {/* Testimonial quote — hidden on mobile to keep cards compact */}
          {quote && (
            <div
              className={`mb-3 hidden items-start gap-2 rounded-xl p-2 sm:mb-5 sm:flex sm:p-3 ${
                dark ? "bg-slate-700/50" : "border border-stone-100 bg-stone-50"
              }`}
            >
              <span className="mt-0.5 shrink-0 text-xs sm:text-sm">⭐</span>
              <p
                className={`text-[10px] italic leading-relaxed sm:text-xs ${
                  dark ? "text-slate-300" : "text-stone-600"
                }`}
              >
                {quote}
              </p>
            </div>
          )}
        </div>

        {/* Bottom section: buttons — hidden on mobile (whole card is the tap target) */}
        <div className="mt-2 hidden space-y-1.5 sm:mt-5 sm:block sm:space-y-2">
          {/* Primary CTA button */}
          {ctaButtonLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                (onBookClick ?? onClick)();
              }}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-opacity hover:opacity-90 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-sm ${
                dark ? "bg-accent text-white" : "bg-foreground text-background"
              }`}
            >
              {ctaButtonLabel}
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}

          {/* Secondary text link */}
          {ctaLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={`flex w-full items-center justify-center gap-1 text-xs font-medium transition-colors sm:text-sm ${
                dark ? "text-slate-400 hover:text-white" : "text-accent hover:text-accent/80"
              }`}
            >
              {ctaLabel}
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          )}

          {/* Contact link */}
          {showContact && (
            <div className="pt-0.5 text-center sm:pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContactOpen(true);
                }}
                className={`text-[10px] underline underline-offset-2 transition-colors sm:text-xs ${
                  dark
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Have questions? Chat with us
              </button>
            </div>
          )}
        </div>
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

// ── Main HeroSection ─────────────────────────────────────────────────────────
export function HeroSection({
  onNavigate,
  language = "en",
  legacyContent,
  content,
  basePrice,
  priceLoaded,
  lowestTourPrice,
}: HeroSectionProps) {
  const editableContent = content || legacyContent;
  const t = getTranslation(language).homepage;
  const travelGuideTitle = getTranslation(language).homepage.quickLinks.travelGuide.title;

  // ── Hero images ────────────────────────────────────────────────────────────
  const mainImage =
    editableContent?.homepage?.hero?.heroImage ?? DEFAULT_HERO_IMAGE;
  const tukTukImage: string | null =
    editableContent?.homepage?.hero?.tukTukImage ?? null;
  const jeepImage: string | null =
    editableContent?.homepage?.hero?.jeepImage ?? null;

  // ── "What We Offer" card images ────────────────────────────────────────────
  const daypassImg =
    editableContent?.homepage?.productCards?.daypass?.images?.[0]?.src ?? null;
  const privateToursImg =
    editableContent?.homepage?.productCards?.privateTours?.images?.[0]?.src ?? null;
  const travelGuideImg =
    editableContent?.homepage?.productCards?.travelGuide?.images?.[0]?.src ?? null;

  // Lowest price across all products — used in mobile social proof strip
  const lowestPrice =
    priceLoaded && basePrice
      ? lowestTourPrice != null
        ? Math.min(basePrice, lowestTourPrice)
        : basePrice
      : null;

  return (
    <section className="bg-[#F5EFE3]">

      {/* ── MOBILE LAYOUT (hidden at md+) ──────────────────────────────── */}
      <div className="md:hidden">

        {/* 1. Hero image — full bleed, 220px, gradient fade into bg */}
        <div className="relative h-[220px] overflow-hidden">
          <img
            src={mainImage}
            alt="Wide landscape of Sintra forest and palace"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#F5EFE3] to-transparent" />
        </div>

        {/* 2. Social proof */}
        <div className="px-4 pt-4 text-center">
          <span className="text-xs text-muted-foreground">
            {"★★★★★"} 4.9 &nbsp;·&nbsp;
            {/* TODO: update review count here if it changes — mirrors reviewCount in HopOnServiceDetailPage.tsx JSON-LD */}
            523 reviews &nbsp;·&nbsp;
            {lowestPrice != null ? `From €${lowestPrice}/person` : "From €25/person"}
          </span>
        </div>

        {/* 3. Heading */}
        <div className="px-4 pt-5">
          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-foreground">
            {t.hero.heroHeadingPre}{" "}
            <em className="not-italic text-accent">{t.hero.heroTukTuk}</em>{" "}
            {t.hero.heroHeadingMid}{" "}
            <em className="italic text-accent">{t.hero.heroVintageJeep}</em>
            {t.hero.heroHeadingPost}
          </h1>
        </div>

        {/* 4. Subtitle */}
        <p className="px-4 pt-3 text-sm leading-relaxed text-muted-foreground">
          {t.hero.heroSubtitleNew}
        </p>

        {/* 5. Primary CTA — smooth-scrolls to product cards */}
        <div className="px-4 pt-5">
          <button
            onClick={() =>
              document.getElementById("offer-cards")?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-opacity active:opacity-80"
          >
            Find your experience
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* 6. Secondary link — private tours */}
        <div className="px-4 pb-8 pt-3 text-center">
          <button
            onClick={() => onNavigate("private-tours")}
            className="text-sm font-medium text-accent hover:text-accent/80"
          >
            Private tours →
          </button>
        </div>

      </div>

      {/* ── DESKTOP LAYOUT (hidden on mobile, shown at md+) ────────────── */}
      <div className="hidden md:block">
      {/* ── Top: Split hero ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left column — text */}
          <div className="flex flex-col">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8 shrink-0 bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t.hero.heroEyebrow}
              </span>
            </div>

            {/* Heading */}
            <h1 className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3rem] xl:text-[3.25rem]">
              {t.hero.heroHeadingPre}{" "}
              <em className="not-italic text-accent">{t.hero.heroTukTuk}</em>{" "}
              {t.hero.heroHeadingMid}{" "}
              <em className="italic text-accent">{t.hero.heroVintageJeep}</em>
              {t.hero.heroHeadingPost}
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t.hero.heroSubtitleNew}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-11 border border-foreground/20 bg-foreground px-6 text-sm text-background hover:bg-foreground/90"
                onClick={() => onNavigate("buy-ticket")}
              >
                {t.hero.ctaButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 border border-foreground/30 bg-transparent px-6 text-sm text-foreground hover:bg-foreground/5"
                onClick={() => onNavigate("private-tours")}
              >
                {t.hero.privateToursButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right column — photo grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Large landscape image — spans both columns */}
            <div className="col-span-2 overflow-hidden rounded-2xl bg-stone-200" style={{ aspectRatio: "16/9" }}>
              <img
                src={mainImage}
                alt="Wide landscape of Sintra forest and palace"
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>

            {/* Tuk tuk */}
            <div className="overflow-hidden rounded-2xl bg-stone-200" style={{ aspectRatio: "4/3" }}>
              {tukTukImage ? (
                <img
                  src={tukTukImage}
                  alt="Tuk tuk in action in Sintra"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ImagePlaceholder label={"Tuk tuk\nin action"} />
              )}
            </div>

            {/* Vintage jeep */}
            <div className="overflow-hidden rounded-2xl bg-stone-200" style={{ aspectRatio: "4/3" }}>
              {jeepImage ? (
                <img
                  src={jeepImage}
                  alt="Vintage jeep in action in Sintra"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ImagePlaceholder label={"Vintage jeep\nin action"} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-stone-300/60" />
      </div>
      </div>{/* end desktop-only block */}

      {/* ── Bottom: "What We Offer" ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        {/* Section eyebrow */}
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
          {t.hero.whatWeOffer}
        </p>

        {/* Cards */}
        <div id="offer-cards" className="grid gap-5 sm:grid-cols-3">

          {/* ── Day Pass card (light) ── */}
          <OfferCard
            imageUrl={daypassImg}
            imagePlaceholderLabel="People in tuk tuk"
            title={t.hero.daypassTitle}
            description={t.hero.daypassDescription}
            badge="Great Value"
            badgeVariant="primary"
            pills={["Hop on & off", "All attractions", "Guaranteed seat"]}
            quote={"\"Saw everything at our own pace — best transport decision we made in Portugal.\""}
            ctaButtonLabel="Buy a day pass"
            onBookClick={() => onNavigate("buy-ticket")}
            ctaLabel={t.hero.daypassCta}
            onClick={() => onNavigate("hop-on-hop-off-sintra")}
            fromPrice={priceLoaded && basePrice ? basePrice : null}
            priceUnit="person"
            showContact
          />

          {/* ── Private Tours card (dark) ── */}
          <OfferCard
            imageUrl={privateToursImg}
            imagePlaceholderLabel="People in jeep"
            title={t.hero.privateToursTitle}
            description={t.hero.privateToursDescription}
            dark
            badge="Most Popular"
            badgeVariant="accent"
            pills={["Up to 6 people", "Custom stops", "Half or full day"]}
            quote={"\"Best day of our whole Portugal trip. Our guide knew every hidden corner.\""}
            ctaButtonLabel="Book a private tour"
            onClick={() => onNavigate("private-tours")}
            fromPrice={lowestTourPrice ?? null}
            priceUnit="person"
            showContact
          />

          {/* ── Travel Guide card (light, editorial) ── */}
          <OfferCard
            imageUrl={travelGuideImg}
            imagePlaceholderLabel="Sintra palace editorial photo"
            title={travelGuideTitle}
            description={t.hero.travelGuideDescription}
            pills={["Palace guides", "Hidden gems", "Expert tips"]}
            ctaButtonLabel="Explore Sintra guides"
            ctaLabel={t.hero.travelGuideCta}
            onClick={() => onNavigate("travel-guide")}
          />

        </div>
      </div>
    </section>
  );
}
