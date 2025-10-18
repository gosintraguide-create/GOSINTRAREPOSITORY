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
    async function loadPricingFromDB() {
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.pricing?.basePrice) {
            setBasePrice(data.pricing.basePrice);
            localStorage.setItem("admin-pricing", JSON.stringify(data.pricing));
            return;
          }
        }
      } catch (error) {
        // Silently handle error - backend may not be available
      }
      
      // Fallback to localStorage
      const savedPricing = localStorage.getItem("admin-pricing");
      if (savedPricing) {
        try {
          const pricing = JSON.parse(savedPricing);
          if (pricing.basePrice) {
            setBasePrice(pricing.basePrice);
          }
        } catch (e) {
          // Use default basePrice (25)
        }
      }
    }
    
    loadPricingFromDB();
    
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
                <div className="relative mx-auto flex h-36 items-center justify-center sm:h-40 md:h-44">
                  {/* Left Photo Card - Almost fully visible */}
                  <div className="absolute -left-24 top-1/2 z-0 w-32 -translate-y-1/2 scale-[0.85] rotate-[-2deg] transform overflow-hidden rounded-xl shadow-xl transition-all hover:z-20 hover:-left-20 hover:rotate-0 hover:scale-95 sm:-left-32 sm:w-40 md:-left-40 md:w-48">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1715616130000-375a7e5fac95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHRvdXJpc3RzJTIwc2lnaHRzZWVpbmclMjBncm91cHxlbnwxfHx8fDE3NjA4MTcwODJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Happy travelers in Sintra"
                      className="h-32 w-full object-cover sm:h-36 md:h-40"
                    />
                  </div>
                  
                  {/* Right Photo Card - Almost fully visible */}
                  <div className="absolute -right-24 top-1/2 z-0 w-32 -translate-y-1/2 scale-[0.85] rotate-[-2deg] transform overflow-hidden rounded-xl shadow-xl transition-all hover:z-20 hover:-right-20 hover:rotate-0 hover:scale-95 sm:-right-32 sm:w-40 md:-right-40 md:w-48">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1759668558962-23ae91b34bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWxlcnMlMjBmcmllbmRzJTIwdmFjYXRpb24lMjB8ZW58MXx8fHwxNzYwODE3MDgyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Friends enjoying their trip"
                      className="h-32 w-full object-cover sm:h-36 md:h-40"
                    />
                  </div>
                  
                  {/* Center Price Card - Front and center */}
                  <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rotate-[-2deg] transform rounded-2xl bg-white shadow-2xl transition-transform hover:rotate-0 hover:scale-105 sm:h-36 sm:w-40 md:h-40 md:w-48">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Starting at</p>
                    <p className="text-4xl font-extrabold text-accent sm:text-5xl">€{basePrice}</p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">per person / full day</p>
                  </div>
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
                Show your pass to our professional guide-driver. Explore attractions, then catch the next ride.
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
                    <h4 className="mb-1">Professional Driver-Guides</h4>
                    <p className="text-muted-foreground">
                      Every vehicle is driven by a certified local guide with deep knowledge of Sintra
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

      {/* TEMPORARY TESTING ACCESS - REMOVE IN PRODUCTION */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <div className="rounded-lg border-2 border-dashed border-yellow-500 bg-yellow-50 p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-yellow-800">🔧 Testing Access</p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onNavigate("admin")}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-white"
            >
              Admin Portal
            </Button>
            <Button
              onClick={() => onNavigate("operations")}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-accent text-accent hover:bg-accent hover:text-white"
            >
              Driver Portal
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-yellow-700">Remove before production</p>
        </div>
      </div>
    </div>
  );
}