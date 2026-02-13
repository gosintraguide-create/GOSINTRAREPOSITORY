import { ArrowRight, Users, MapPin, Clock, Shield, Smartphone, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductCard } from "./ProductCard";
import { InfoCard } from "./InfoCard";
import type { WebsiteContent } from "../lib/contentManager";
import { useEditableContent } from "../lib/useEditableContent";

interface HeroSectionProps {
  onNavigate: (page: string) => void;
  basePrice: number;
  priceLoaded: boolean;
  language?: string;
  legacyContent: WebsiteContent;
  content?: any; // Optional content parameter
}

export function HeroSection({
  onNavigate,
  basePrice,
  priceLoaded,
  language = "en",
  legacyContent,
  content,
}: HeroSectionProps) {
  // Content is already passed in with the correct language, no need to call useEditableContent again
  const editableContent = content || legacyContent;
  
  // Safely access hero content with fallbacks
  const heroTitle = editableContent?.homepage?.hero?.title || legacyContent.homepage.hero.title;
  const heroSubtitle = editableContent?.homepage?.hero?.subtitle || legacyContent.homepage.hero.subtitle;
  const heroCtaButton = editableContent?.homepage?.hero?.ctaButton || legacyContent.homepage.hero.ctaButton;
  const heroBenefitPills = editableContent?.homepage?.hero?.benefitPills || legacyContent.homepage.hero.benefitPills || [];
  
  return (
    <section className="relative overflow-hidden">
      <div className="relative">
        {/* Hero Image with Overlay */}
        <div className="relative min-h-[600px] lg:min-h-[650px]">
          <div className="absolute inset-0">
            <ImageWithFallback
              src="https://dwiznaefeqnduglmcivr.supabase.co/storage/v1/object/sign/make-3bd0ade8-images/1762977905581_pena-palace-3.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yNmFjMWMyYy1lNjZlLTQwYWEtYjcwNS1kNTcwYzA5NGZmYzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtYWtlLTNiZDBhZGU4LWltYWdlcy8xNzYyOTc3OTA1NTgxX3BlbmEtcGFsYWNlLTMuanBnIiwiaWF0IjoxNzYyOTc3OTA1LCJleHAiOjIwNzgzMzc5MDV9.yMxtg8g3UvVUzf-xdAwUmGyjRATPWQwdvRlpIa8D7eY"
              alt="Tuk tuk sightseeing in Sintra with colorful Pena Palace"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/60" />
          </div>

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <div className="flex flex-col items-center text-center">
                {/* Hero Text */}
                <div className="max-w-4xl">
                  <h1 className="mb-4 text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-[0_8px_32px_rgba(0,0,0,1)] sm:mb-5">
                    {heroTitle}
                  </h1>

                  <p className="mb-6 text-base sm:text-lg md:text-xl text-white/95 drop-shadow-[0_6px_20px_rgba(0,0,0,1)] sm:mb-7">
                    {heroSubtitle}
                  </p>

                  {/* Key Benefits */}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
                    {heroBenefitPills.map(
                      (benefit, index) => {
                        const IconComponent =
                          benefit.icon === "Users"
                            ? Users
                            : benefit.icon === "Clock"
                              ? Clock
                              : benefit.icon === "MapPin"
                                ? MapPin
                                : benefit.icon === "Smartphone"
                                  ? Smartphone
                                  : Shield;

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2"
                          >
                            <IconComponent className="h-3.5 w-3.5 text-white/90 sm:h-4 sm:w-4" />
                            <span className="text-xs text-white/90 sm:text-sm">
                              {benefit.text}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      size="lg"
                      className="h-14 w-full max-w-sm border-2 border-white/90 bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90"
                      onClick={() => onNavigate("buy-ticket")}
                    >
                      {heroCtaButton}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Card Section - Underneath Hero */}
      <div className="relative bg-secondary/20 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Day Pass Card */}
            <ProductCard
              onNavigate={onNavigate}
              basePrice={basePrice}
              language={language}
              productType="daypass"
              customImages={editableContent.homepage?.productCards?.daypass?.images}
              customContent={editableContent.homepage?.productCards?.daypass ? {
                title: editableContent.homepage.productCards.daypass.title,
                description: editableContent.homepage.productCards.daypass.description,
                features: editableContent.homepage.productCards.daypass.features,
                buttonText: editableContent.homepage.productCards.daypass.buttonText,
              } : undefined}
            />

            {/* Travel Guide Card */}
            <InfoCard
              onNavigate={onNavigate}
              language={language}
              cardType="travel-guide"
              customImages={editableContent.homepage?.productCards?.travelGuide?.images}
              customContent={editableContent.homepage?.productCards?.travelGuide ? {
                title: editableContent.homepage.productCards.travelGuide.title,
                description: editableContent.homepage.productCards.travelGuide.description,
                content: editableContent.homepage.productCards.travelGuide.content,
                buttonText: editableContent.homepage.productCards.travelGuide.buttonText,
              } : undefined}
            />

            {/* Monuments Card */}
            <InfoCard
              onNavigate={onNavigate}
              language={language}
              cardType="monuments"
              customImages={editableContent.homepage?.productCards?.monuments?.images}
              customContent={editableContent.homepage?.productCards?.monuments ? {
                title: editableContent.homepage.productCards.monuments.title,
                description: editableContent.homepage.productCards.monuments.description,
                content: editableContent.homepage.productCards.monuments.content,
                buttonText: editableContent.homepage.productCards.monuments.buttonText,
              } : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}