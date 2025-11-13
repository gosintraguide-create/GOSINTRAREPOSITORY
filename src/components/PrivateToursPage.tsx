import { ArrowRight, Check, Star, Users, Clock, MapPin, Sparkles, Shield, Heart, Camera, Award, MessageCircle, Car, Rocket } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { featureFlags } from "../lib/featureFlags";
import { getTranslation } from "../lib/translations";

interface PrivateToursPageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function PrivateToursPage({ onNavigate, language = "en" }: PrivateToursPageProps) {
  const content = getTranslation(language);
  const t = content.privateTours;
  
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

  if (!getFeatureFlag()) {
    return (
      <div className="flex-1">
        {/* Coming Soon Hero */}
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
            
            <h1 className="mb-6 text-white">
              {t.comingSoon.title}
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90 sm:text-2xl">
              {t.comingSoon.subtitle}
            </p>
            
            <div className="mb-12 space-y-4">
              <p className="text-lg text-white/80">
                {t.comingSoon.stayTunedText}
              </p>
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

            <p className="text-sm text-white/70">
              {t.comingSoon.footerText}
            </p>
          </div>
        </section>

        {/* Why Wait Section */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-foreground">{t.whyWait.title}</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {t.whyWait.subtitle}
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">{t.whyWait.card1Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyWait.card1Description}
                </p>
              </Card>
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">{t.whyWait.card2Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyWait.card2Description}
                </p>
              </Card>
              <Card className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2">{t.whyWait.card3Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyWait.card3Description}
                </p>
              </Card>
            </div>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigate("buy-ticket")}
              >
                {t.whyWait.bookDayPassButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Full Private Tours Page (when enabled)
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm text-white">{t.hero.badge}</span>
            </div>
            
            <h1 className="mb-6 text-white">
              {t.hero.title}
            </h1>
            
            <p className="mx-auto mb-8 max-w-3xl text-lg text-white/90 sm:text-xl">
              {t.hero.subtitle}
            </p>
            
            <div className="mb-10 flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
                <span className="text-sm text-white">{t.hero.pill1}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-sm text-white">{t.hero.pill2}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-white" />
                <span className="text-sm text-white">{t.hero.pill3}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
                onClick={() => onNavigate("live-chat")}
              >
                {t.hero.requestQuoteButton}
                <MessageCircle className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                onClick={() => {
                  const element = document.getElementById("packages");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t.hero.viewPackagesButton}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section id="packages" className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">{t.packages.title}</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t.packages.subtitle}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Half Day Tour */}
            <Card className="relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">{t.packages.halfDay.title}</h3>
                  <p className="text-muted-foreground">{t.packages.halfDay.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-primary">{t.packages.halfDay.price}</span>
                    <span className="text-muted-foreground">{t.packages.halfDay.priceSubtext}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.packages.halfDay.duration}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.halfDay.feature1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.halfDay.feature2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.halfDay.feature3}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.halfDay.feature4}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.halfDay.feature5}</span>
                  </li>
                </ul>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => onNavigate("live-chat")}
                >
                  {t.packages.halfDay.bookButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Full Day Tour - Popular */}
            <Card className="relative overflow-hidden border-2 border-accent shadow-xl">
              <div className="absolute right-4 top-4">
                <Badge className="bg-accent">{t.packages.fullDay.badge}</Badge>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">{t.packages.fullDay.title}</h3>
                  <p className="text-muted-foreground">{t.packages.fullDay.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-accent">{t.packages.fullDay.price}</span>
                    <span className="text-muted-foreground">{t.packages.fullDay.priceSubtext}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.packages.fullDay.duration}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature3}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature4}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature5}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <span className="text-sm">{t.packages.fullDay.feature6}</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => onNavigate("live-chat")}
                >
                  {t.packages.fullDay.bookButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Custom Tour */}
            <Card className="relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="mb-4">
                  <h3 className="mb-2">{t.packages.custom.title}</h3>
                  <p className="text-muted-foreground">{t.packages.custom.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-primary">{t.packages.custom.price}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.packages.custom.duration}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.custom.feature1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.custom.feature2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.custom.feature3}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.custom.feature4}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{t.packages.custom.feature5}</span>
                  </li>
                </ul>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => onNavigate("live-chat")}
                >
                  {t.packages.custom.contactButton}
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t.packages.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Private Tours */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-foreground">{t.whyChoose.title}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Heart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">{t.whyChoose.benefit1Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyChoose.benefit1Description}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">{t.whyChoose.benefit2Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyChoose.benefit2Description}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="mb-1 text-base">{t.whyChoose.benefit3Title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.whyChoose.benefit3Description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">{t.whatsIncluded.title}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">{t.whatsIncluded.item1Title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.whatsIncluded.item1Description}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">{t.whatsIncluded.item2Title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.whatsIncluded.item2Description}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">{t.whatsIncluded.item3Title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.whatsIncluded.item3Description}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg">{t.whatsIncluded.item4Title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.whatsIncluded.item4Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Itineraries */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">{t.sampleItineraries.title}</h2>
            <p className="text-lg text-muted-foreground">
              {t.sampleItineraries.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            {/* Half Day Sample */}
            <Card className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1">{t.sampleItineraries.halfDay.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.sampleItineraries.halfDay.duration}</p>
                </div>
                <Badge variant="outline">{t.sampleItineraries.halfDay.badge}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">1</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.halfDay.stop1Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.halfDay.stop1Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">2</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.halfDay.stop2Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.halfDay.stop2Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">3</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.halfDay.stop3Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.halfDay.stop3Description}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Full Day Sample */}
            <Card className="border-2 border-accent/50 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1">{t.sampleItineraries.fullDay.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.sampleItineraries.fullDay.duration}</p>
                </div>
                <Badge className="bg-accent">{t.sampleItineraries.fullDay.badge}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">1</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.fullDay.stop1Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.fullDay.stop1Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">2</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.fullDay.stop2Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.fullDay.stop2Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">3</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.fullDay.stop3Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.fullDay.stop3Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">4</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.fullDay.stop4Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.fullDay.stop4Description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">5</div>
                  <div>
                    <p className="text-sm">{t.sampleItineraries.fullDay.stop5Title}</p>
                    <p className="text-xs text-muted-foreground">{t.sampleItineraries.fullDay.stop5Description}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">{t.faq.title}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">{t.faq.subtitle}</p>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="mb-2">{t.faq.question1}</h3>
              <p className="text-sm text-muted-foreground">
                {t.faq.answer1}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">{t.faq.question2}</h3>
              <p className="text-sm text-muted-foreground">
                {t.faq.answer2}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">{t.faq.question3}</h3>
              <p className="text-sm text-muted-foreground">
                {t.faq.answer3}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">{t.faq.question4}</h3>
              <p className="text-sm text-muted-foreground">
                {t.faq.answer4}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2">{t.faq.question5}</h3>
              <p className="text-sm text-muted-foreground">
                {t.faq.answer5}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-white">{t.finalCta.title}</h2>
          <p className="mb-8 text-lg text-white/90">
            {t.finalCta.subtitle}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-14 w-full bg-accent px-10 text-lg shadow-2xl hover:scale-105 hover:bg-accent/90 sm:w-auto"
              onClick={() => onNavigate("live-chat")}
            >
              {t.finalCta.requestQuoteButton}
              <MessageCircle className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full border-2 border-white bg-white/10 px-10 text-lg text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
              onClick={() => onNavigate("buy-ticket")}
            >
              {t.finalCta.chatButton}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
