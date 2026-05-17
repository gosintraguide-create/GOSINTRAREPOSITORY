import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import type { WebsiteContent } from "../lib/contentManager";
import { getTranslation } from "../lib/translations/loader";

interface HeroSectionProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  priceLoaded: boolean;
  language?: string;
  legacyContent: WebsiteContent;
  content?: any;
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

// ── "What We Offer" card ─────────────────────────────────────────────────────
interface OfferCardProps {
  imageUrl?: string;
  imagePlaceholderLabel?: string;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
}

function OfferCard({
  imageUrl,
  imagePlaceholderLabel,
  title,
  description,
  ctaLabel,
  onClick,
}: OfferCardProps) {
  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-stone-100">
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
      </div>

      {/* Text */}
      <div className="p-5">
        <h3 className="mb-1.5 text-base font-bold text-foreground">{title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-gap group-hover:gap-2">
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

// ── Main HeroSection ─────────────────────────────────────────────────────────
export function HeroSection({
  onNavigate,
  language = "en",
  legacyContent,
  content,
}: HeroSectionProps) {
  const editableContent = content || legacyContent;
  const t = getTranslation(language).homepage;
  const travelGuideTitle = getTranslation(language).homepage.quickLinks.travelGuide.title;

  // ── Hero images ────────────────────────────────────────────────────────────
  // Three named CMS fields — set via Content Editor → Home Page → Hero Images
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

  // ── "What We Offer" cards ─────────────────────────────────────────────────
  const offerCards = [
    {
      key: "daypass",
      imageUrl: daypassImg,
      imagePlaceholderLabel: "People in tuk tuk\nreal photo",
      title: "Full day pass",
      description:
        "Unlimited rides across all Sintra attractions. Local guide on every vehicle.",
      ctaLabel: "See what's included",
      onClick: () => onNavigate("hop-on-hop-off-sintra"),
    },
    {
      key: "private-tours",
      imageUrl: privateToursImg,
      imagePlaceholderLabel: "People in jeep\nreal photo",
      title: "Private tours",
      description:
        "Full day experiences tailored to your group. Hidden gems, coastline, monuments.",
      ctaLabel: "See private tours",
      onClick: () => onNavigate("private-tours"),
    },
    {
      key: "travel-guide",
      imageUrl: travelGuideImg,
      imagePlaceholderLabel: "Sintra palace\neditorial photo",
      title: travelGuideTitle,
      description:
        "Local insights, hidden spots, and practical advice for planning your day in Sintra.",
      ctaLabel: "Read the guide",
      onClick: () => onNavigate("travel-guide"),
    },
  ];

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
                Sintra, Portugal
              </span>
            </div>

            {/* Heading */}
            <h1 className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3rem] xl:text-[3.25rem]">
              Sintra deserves more than a rushed afternoon. Explore it in a{" "}
              <em className="not-italic text-accent">tuk tuk</em> or{" "}
              <em className="italic text-accent">vintage jeep</em>, at your own
              pace.
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Hop on and off as many times as you want, with a local guide on
              every vehicle and rides always available. Private full-day tours
              also available.
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
                Private tours
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
          What we offer
        </p>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {offerCards.map((card) => (
            <OfferCard key={card.key} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
