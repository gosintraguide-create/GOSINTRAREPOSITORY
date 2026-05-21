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
            href="mailto:info@hoponsintra.com"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            onClick={() => onOpenChange(false)}
          >
            <Mail className="h-4 w-4 shrink-0" />
            info@hoponsintra.com
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
      className={`group overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-lg ${
        dark
          ? "bg-slate-800"
          : "border border-stone-200 bg-white"
      }`}
    >
      {/* ── Image + overlays ── */}
      <div className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-stone-200" onClick={onClick}>
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

        {/* Badge top-left */}
        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow ${
              badgeVariant === "accent" ? "bg-accent" : "bg-primary"
            }`}
          >
            {badge}
          </span>
        )}

        {/* Price pill top-right */}
        {fromPrice != null && (
          <div
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow ${
              dark
                ? "bg-slate-700/90 text-white"
                : "bg-white/90 text-foreground"
            }`}
          >
            From <span className="font-bold">€{fromPrice}</span>
            {priceUnit ? `/${priceUnit}` : ""}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-5">
        {/* Title */}
        <h3
          className={`mb-1.5 text-lg font-bold ${
            dark ? "text-white" : "text-foreground"
          }`}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className={`mb-3 text-sm leading-relaxed ${
            dark ? "text-slate-400" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>

        {/* Feature pills */}
        {pills && pills.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {pills.map((pill, i) => (
              <span
                key={i}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  dark
                    ? "bg-slate-700 text-slate-300"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {pill}
              </span>
            ))}
          </div>
        )}

        {/* Testimonial quote */}
        {quote && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl p-3 ${
              dark ? "bg-slate-700/50" : "border border-stone-100 bg-stone-50"
            }`}
          >
            <span className="mt-0.5 shrink-0 text-sm">⭐</span>
            <p
              className={`text-xs italic leading-relaxed ${
                dark ? "text-slate-300" : "text-stone-600"
              }`}
            >
              {quote}
            </p>
          </div>
        )}

        {/* Primary CTA button */}
        {ctaButtonLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              (onBookClick ?? onClick)();
            }}
            className={`mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98] ${
              dark
                ? "bg-accent text-white"
                : "bg-foreground text-background"
            }`}
          >
            {ctaButtonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Secondary text link */}
        {ctaLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`mb-2 flex w-full items-center justify-center gap-1 text-sm font-medium transition-colors ${
              dark
                ? "text-slate-400 hover:text-white"
                : "text-accent hover:text-accent/80"
            }`}
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Contact link */}
        {showContact && (
          <div className="mt-1 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContactOpen(true);
              }}
              className={`text-xs underline underline-offset-2 transition-colors ${
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

  return (
    <section className="bg-[#F5EFE3]">
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

      {/* ── Bottom: "What We Offer" ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
        {/* Section eyebrow */}
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
          {t.hero.whatWeOffer}
        </p>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-3">

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
