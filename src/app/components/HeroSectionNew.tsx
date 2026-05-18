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

// ── "What We Offer" card ─────────────────────────────────────────────────────
interface OfferCardProps {
  imageUrl?: string;
  imagePlaceholderLabel?: string;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
  fromPrice?: number | null;
}

function OfferCard({
  imageUrl,
  imagePlaceholderLabel,
  title,
  description,
  ctaLabel,
  onClick,
  fromPrice,
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
        <div className="flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-gap group-hover:gap-2">
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          {fromPrice != null && (
            <div className="flex items-baseline gap-1 text-right">
              <span className="text-xs font-medium text-stone-400">From</span>
              <span className="text-2xl font-extrabold leading-none text-primary">€{fromPrice}</span>
            </div>
          )}
        </div>
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
  basePrice,
  priceLoaded,
  lowestTourPrice,
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
      title: t.hero.daypassTitle,
      description: t.hero.daypassDescription,
      ctaLabel: t.hero.daypassCta,
      onClick: () => onNavigate("hop-on-hop-off-sintra"),
      fromPrice: priceLoaded && basePrice ? basePrice : null,
    },
    {
      key: "private-tours",
      imageUrl: privateToursImg,
      imagePlaceholderLabel: "People in jeep\nreal photo",
      title: t.hero.privateToursTitle,
      description: t.hero.privateToursDescription,
      ctaLabel: t.hero.privateToursCta,
      onClick: () => onNavigate("private-tours"),
      fromPrice: lowestTourPrice ?? null,
    },
    {
      key: "travel-guide",
      imageUrl: travelGuideImg,
      imagePlaceholderLabel: "Sintra palace\neditorial photo",
      title: travelGuideTitle,
      description: t.hero.travelGuideDescription,
      ctaLabel: t.hero.travelGuideCta,
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
          {offerCards.map((card) => (
            <OfferCard key={card.key} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
