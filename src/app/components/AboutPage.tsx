import { useOutletContext } from "react-router";
import { Users, Car, Award, Camera, Heart, Shield, Target } from "lucide-react";
import { getTranslation } from "../lib/translations/loader";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

const PERK_ICONS = [Users, Car, Award, Camera];

export function AboutPage() {
  const { language = "en" } = useOutletContext<OutletContext>();
  const content = getTranslation(language).about;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faq.map((item: { q: string; a: string }) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a }
    }))
  };

  return (
    <div className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero Section */}
      <section className="bg-primary py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6 flex justify-center animate-[scaleIn_0.5s_ease-out]">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white shadow-xl lg:h-24 lg:w-24">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-accent lg:h-12 lg:w-12" />
            </div>
          </div>

          <h1 className="mb-4 text-white animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            {content.title}
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg lg:text-xl text-white/90 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            {content.subtitle}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <Badge className="mb-4">{content.storyBadge}</Badge>
              <h2 className="mb-6 text-foreground">{content.storyHeading}</h2>
              <div className="space-y-4 text-muted-foreground">
                {content.story.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl shadow-2xl transition-transform hover:scale-[1.02]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Sintra Palace"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-y border-border bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4">{content.missionBadge}</Badge>
          <h2 className="mb-6 text-foreground">{content.missionHeading}</h2>
          <p className="text-xl text-muted-foreground">
            {content.mission}
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">{content.perksBadge}</Badge>
            <h2 className="mb-4 text-foreground">{content.perksHeading}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {content.perksSubtitle}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {content.perks.map((perk, index) => {
              const IconComponent = PERK_ICONS[index] ?? Users;
              return (
                <div key={index}>
                  <Card className="h-full p-6 transition-all hover:shadow-lg">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-foreground">{perk.title}</h3>
                    <p className="text-sm text-muted-foreground">{perk.description}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="border-y border-border bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4">{content.valuesBadge}</Badge>
            <h2 className="mb-4 text-foreground">{content.valuesHeading}</h2>
            <p className="text-muted-foreground">{content.valuesSubtitle}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {content.values.map((value, index) => {
              const IconComponent =
                index === 0 ? Shield :
                index === 1 ? Heart :
                Target;

              return (
                <div key={index}>
                  <Card className="h-full p-8 text-center transition-all hover:shadow-lg">
                    <div className="mb-6 flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="mb-3 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">{content.faqBadge}</Badge>
            <h2 className="mb-4 text-foreground">{content.faqHeading}</h2>
            <p className="text-muted-foreground">{content.faqSubtitle}</p>
          </div>

          <div className="space-y-4">
            {content.faq.map((item, index) => (
              <div key={index}>
                <Card className="p-6 transition-all hover:shadow-lg">
                  <h4 className="mb-2 text-foreground">{item.q}</h4>
                  <p className="text-muted-foreground">{item.a}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
