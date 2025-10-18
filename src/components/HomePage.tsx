import { ArrowRight, Users, MapPin, Clock, Shield, Star, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { loadContentWithLanguage, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import { getUITranslation } from "../lib/translations";

interface HomePageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function HomePage({ onNavigate, language = "en" }: HomePageProps) {
  const [basePrice, setBasePrice] = useState(25);
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const t = getUITranslation(language);

  useEffect(() => {
    const savedPricing = localStorage.getItem("admin-pricing");
    if (savedPricing) {
      const pricing = JSON.parse(savedPricing);
      setBasePrice(pricing.basePrice);
    }
    
    // Load website content with language
    setContent(loadContentWithLanguage(language));
  }, [language]);

  return (
    <div className="flex-1">
      {/* Hero Section - Clear and Direct */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-12 sm:py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              {content.homepage.heroTitle}
            </h1>
            
            <p className="mx-auto mb-6 max-w-2xl text-base sm:text-xl text-white/90">
              {content.homepage.heroSubtitle}
            </p>
            
            {/* Key Benefits Pills */}
            <div className="mb-10 flex flex-wrap justify-center gap-2 sm:gap-3">
              {content.homepage.benefitPills.map((benefit, index) => {
                const IconComponent = 
                  benefit.icon === "Users" ? Users :
                  benefit.icon === "Clock" ? Clock :
                  benefit.icon === "MapPin" ? MapPin :
                  Shield;
                
                return (
                  <div key={index} className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 backdrop-blur-sm sm:gap-2 sm:px-5 sm:py-3">
                    <IconComponent className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                    <span className="text-sm text-white sm:text-base">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Tilted Price Card */}
            <div className="mb-8 flex justify-center sm:mb-10">
              <div className="relative">
                <div className="rotate-[-2deg] transform rounded-2xl bg-white px-6 py-4 shadow-2xl transition-transform hover:rotate-0 hover:scale-105 sm:px-8 sm:py-6">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Starting at</p>
                  <p className="text-4xl font-extrabold text-accent sm:text-5xl">€{basePrice}</p>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">per person / full day</p>
                </div>
              </div>
            </div>
            
            {/* Primary CTA */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button
                size="lg"
                className="h-12 w-full bg-accent px-8 text-base shadow-2xl hover:scale-105 hover:bg-accent/90 sm:h-16 sm:w-auto sm:px-12 sm:text-xl"
                onClick={() => onNavigate("buy-ticket")}
              >
                {content.homepage.heroCallToAction}
                <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-2 border-white bg-transparent px-6 text-base text-white hover:bg-white hover:text-primary sm:h-16 sm:w-auto sm:px-8 sm:text-lg"
                onClick={() => onNavigate("how-it-works")}
              >
                {t.howItWorks}
              </Button>
            </div>
            
            {/* Social Proof */}
            <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8 sm:gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-primary bg-gradient-to-br from-accent to-white sm:h-10 sm:w-10 sm:border-4" />
                ))}
              </div>
              <div className="text-left">
                <div className="flex gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-accent text-accent sm:h-4 sm:w-4" />
                  ))}
                </div>
                <p className="text-xs text-white/80 sm:text-sm">10,000+ happy travelers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included - Simple & Clear */}
      <section className="border-b border-border bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center">What's Included</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2">Unlimited Rides</h3>
              <p className="text-muted-foreground">
                Hop on and off all day. Visit all major attractions at your own pace.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2">Guaranteed Seating</h3>
              <p className="text-muted-foreground">
                Small vehicles (2-6 passengers max). Everyone gets a comfortable seat.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2">Frequent Service</h3>
              <p className="text-muted-foreground">
                New departure every 10-15 minutes from each stop. No long waits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Not Tour Buses - Direct Comparison */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-center">Why Choose Go Sintra?</h2>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Premium experience vs. traditional tour buses
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Go Sintra */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="mb-6">
                <h3 className="mb-1 text-primary">Go Sintra</h3>
                <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">Premium</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Guaranteed comfortable seat",
                  "Every 10-15 minutes",
                  "Small groups (2-6 people)",
                  "Authentic tuk tuks & jeeps",
                  "Optional guided commentary",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Tour Buses */}
            <div className="rounded-2xl bg-muted/30 p-8">
              <div className="mb-6">
                <h3 className="mb-1 text-muted-foreground">Traditional Buses</h3>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Standing room often required",
                  "Hourly departures or less",
                  "Large groups (30-50+ people)",
                  "Standard tour buses",
                  "Fixed commentary for all",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-muted" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center">How It Works</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-white">
                1
              </div>
              <h3 className="mb-2">Buy Your Pass</h3>
              <p className="text-muted-foreground">
                Purchase online in 2 minutes. Get instant confirmation on your phone.
              </p>
            </div>
            
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-white">
                2
              </div>
              <h3 className="mb-2">Hop On & Off</h3>
              <p className="text-muted-foreground">
                Show your pass at any stop. Explore attractions, then catch the next ride.
              </p>
            </div>
            
            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-white">
                3
              </div>
              <h3 className="mb-2">Enjoy Sintra</h3>
              <p className="text-muted-foreground">
                Visit palaces, castles, and gardens. Valid all day with unlimited rides.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90"
              onClick={() => onNavigate("how-it-works")}
            >
              See Full Details
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof - Real Travelers */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80"
                alt="Happy travelers on vintage jeep in Sintra"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="mb-4">Real Travelers, Real Experiences</h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Join thousands of visitors who've discovered Sintra the comfortable way. Small groups, 
                authentic vehicles, and the freedom to explore at your own pace.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="mb-1">Vintage UMM Jeeps</h4>
                    <p className="text-muted-foreground">
                      Experience Sintra in these iconic Portuguese vehicles
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="mb-1">Small Group Comfort</h4>
                    <p className="text-muted-foreground">
                      Maximum 4-6 people per vehicle for a personal experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="mb-1">Local Knowledge</h4>
                    <p className="text-muted-foreground">
                      Optional guided commentary from drivers who know Sintra best
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => onNavigate("buy-ticket")}
                >
                  Book Your Adventure
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Big and Clear */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-white">
            Ready to Explore?
          </h2>
          <p className="mb-8 text-xl text-white/90">
            Book now and start your Sintra adventure
          </p>
          <Button
            size="lg"
            className="h-16 bg-accent px-12 text-xl shadow-2xl hover:scale-105 hover:bg-accent/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            Buy Day Pass - €{basePrice}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-6 text-white/80">
            Valid until 8:00 PM • Unlimited rides • Instant confirmation
          </p>
        </div>
      </section>
    </div>
  );
}