import {
  ArrowRight,
  Users,
  MapPin,
  Clock,
  Shield,
  Star,
  CheckCircle2,
  TrendingUp,
  Ticket,
  Car,
  Bell,
  Heart,
  Camera,
  Zap,
  CheckCircle,
  RefreshCw,
  Download,
  Smartphone,
  Phone,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { SunsetSpecialCarousel } from "./SunsetSpecialCarousel";
import { RouteOverview } from "./RouteOverview";
import { useState, useEffect } from "react";
import {
  loadContentWithLanguage,
  type WebsiteContent,
  DEFAULT_CONTENT,
} from "../lib/contentManager";
import { getUITranslation } from "../lib/translations";
import { useEditableContent } from "../lib/useEditableContent";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface HomePageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function HomePage({
  onNavigate,
  language = "en",
}: HomePageProps) {
  // Check feature flags
  const [sunsetSpecialEnabled, setSunsetSpecialEnabled] = useState(true);

  useEffect(() => {
    const checkFlags = () => {
      try {
        const flags = localStorage.getItem("feature-flags");
        if (flags) {
          const parsed = JSON.parse(flags);
          setSunsetSpecialEnabled(parsed.sunsetSpecialEnabled !== false);
        }
      } catch (e) {
        console.error("Failed to parse feature flags:", e);
      }
    };

    checkFlags();
    window.addEventListener("storage", checkFlags);
    return () => window.removeEventListener("storage", checkFlags);
  }, []);

  // Initialize basePrice from localStorage to prevent flash
  const getInitialPrice = () => {
    try {
      const savedPricing =
        localStorage.getItem("admin-pricing");
      if (savedPricing) {
        const pricing = JSON.parse(savedPricing);
        if (pricing.basePrice) {
          return pricing.basePrice;
        }
      }
    } catch (e) {
      // Use default
    }
    return 25;
  };

  const [basePrice, setBasePrice] = useState(getInitialPrice);
  const [priceLoaded, setPriceLoaded] = useState(false);
  const [legacyContent, setLegacyContent] =
    useState<WebsiteContent>(DEFAULT_CONTENT);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const t = getUITranslation(language);
  // Use editable content from admin panel
  const content = useEditableContent();

  useEffect(() => {
    async function loadPricingFromDB() {
      try {
        const { projectId, publicAnonKey } = await import(
          "../utils/supabase/info"
        );
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/pricing`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.pricing?.basePrice) {
            setBasePrice(data.pricing.basePrice);
            localStorage.setItem(
              "admin-pricing",
              JSON.stringify(data.pricing),
            );
            setPriceLoaded(true);
            return;
          }
        }
      } catch (error) {
        // Silently handle error - backend may not be available
      }

      // Fallback to localStorage
      const savedPricing =
        localStorage.getItem("admin-pricing");
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

      // Mark as loaded even if we used default
      setPriceLoaded(true);
    }

    loadPricingFromDB();

    // Load legacy content for compatibility
    setLegacyContent(loadContentWithLanguage(language));
  }, [language]);

  // Listen for PWA install prompt
  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detect Safari (not Chrome or other browsers on iOS)
    const isSafariBrowser =
      isIOSDevice &&
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|OPiOS|mercury|EdgiOS/.test(
        navigator.userAgent,
      );
    setIsSafari(isSafariBrowser);

    // Check if dismissed recently
    const dismissed = localStorage.getItem(
      "install-card-dismissed",
    );
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed =
        (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        // Don't show again for 24 hours
        return;
      }
    }

    // Show the install card (will be visible for iOS or when prompt is available)
    setShowInstallCard(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallCard(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallCard(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener(
        "appinstalled",
        handleAppInstalled,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt available, scroll to show instructions or alert
      if (isIOS) {
        if (isSafari) {
          alert(
            'To install: Tap the Share button in Safari, then tap "Add to Home Screen"',
          );
        } else {
          alert(
            "To install this app, please open this site in Safari. Chrome on iOS doesn't support installing web apps.",
          );
        }
      } else {
        // Android or other platforms without prompt
        console.log('[HomePage] No install prompt available on this device');
        alert(
          'To install: Open your browser menu and look for "Add to Home screen" or "Install app"',
        );
      }
      return;
    }

    try {
      console.log('[HomePage] Showing install prompt...');
      
      // Show the install prompt
      await deferredPrompt.prompt();
      
      console.log('[HomePage] Prompt shown, waiting for user choice...');

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[HomePage] User choice:', outcome);

      if (outcome === "accepted") {
        console.log("[HomePage] User accepted the install prompt");
      } else {
        console.log("[HomePage] User dismissed the install prompt");
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallCard(false);
    } catch (error) {
      console.error('[HomePage] Error during installation:', error);
      // Show a helpful message
      alert(
        'Unable to show install prompt. Try opening your browser menu and selecting "Add to Home screen".',
      );
    }
  };

  const handleDismissInstallCard = () => {
    setShowInstallCard(false);
    localStorage.setItem(
      "install-card-dismissed",
      Date.now().toString(),
    );
  };

  return (
    <div className="flex-1">
      {/* Hero Section - Visual Impact with Large Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90">
        {/* Large Hero Image Section */}
        <div className="relative">
          {/* Hero Image with Overlay */}
          <div className="relative min-h-[450px] sm:min-h-[500px] lg:min-h-[550px]">
            <div className="absolute inset-0">
              <ImageWithFallback
                src={content.homepage.hero.heroImage || "https://images.unsplash.com/photo-1704312230001-8d9adfc76d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWslMjB0dWslMjBzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MjM2MTE4Nnww&ixlib=rb-4.1.0&q=80&w=1080"}
                alt="Tuk tuk sightseeing in Sintra with colorful Pena Palace"
                className="h-full w-full object-cover object-center"
              />
              {/* Top-to-bottom gradient overlay - lighter to show more image, darker where text appears */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/65" />
            </div>

            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex items-center py-8 sm:py-12">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center lg:mx-0 lg:text-left">
                  {/* Main Heading */}
                  <h1 className="mb-4 text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-[0_8px_32px_rgba(0,0,0,1)] sm:mb-6">
                    {legacyContent.homepage.hero.title}
                  </h1>

                  {/* Subtitle with stronger contrast */}
                  <p className="mb-6 text-base sm:text-lg md:text-xl text-white drop-shadow-[0_6px_20px_rgba(0,0,0,1)] sm:mb-8">
                    {legacyContent.homepage.hero.subtitle}
                  </p>

                  {/* Key Benefits Pills */}
                  <div className="mb-6 flex flex-wrap justify-center gap-2 sm:mb-8 sm:gap-3 lg:justify-start">
                    {legacyContent.homepage.hero.benefitPills.map(
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
                            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-[0_6px_16px_rgba(0,0,0,0.4)] sm:gap-2 sm:px-4 sm:py-2.5"
                          >
                            <IconComponent className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                            <span className="text-xs text-gray-900 sm:text-sm">
                              {benefit.text}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Price Badge and CTA */}
                  <div className="flex flex-col items-center gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-start">
                    {/* Price Badge - more compact on mobile */}
                    {priceLoaded && (
                      <div className="inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-2xl sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-4 lg:px-8 lg:py-5">
                        <div className="flex flex-col gap-0.5">
                          <p className="whitespace-nowrap text-xs text-primary/70 sm:text-sm">
                            {legacyContent.homepage.priceFrom}
                          </p>
                          <p className="whitespace-nowrap text-2xl font-extrabold text-accent sm:text-3xl lg:text-4xl">
                            €{basePrice}
                          </p>
                          <p className="whitespace-nowrap text-xs text-primary/70 sm:text-sm">
                            {legacyContent.homepage.pricePerPerson}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Primary CTA */}
                    <Button
                      size="lg"
                      className="h-12 w-full bg-accent px-6 shadow-2xl hover:scale-105 hover:bg-accent/90 sm:h-14 sm:w-auto sm:px-10 sm:text-lg"
                      onClick={() => onNavigate("buy-ticket")}
                    >
                      {legacyContent.homepage.hero.ctaButton}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What Is Hop On Sintra - Explainer Section */}
        <div className="relative bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              {/* Left: Text Content */}
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                  <Car className="h-5 w-5 text-primary" />
                  <span className="text-primary">{legacyContent.homepage.hopOnHopOffDayPass}</span>
                </div>
                <h2 className="mb-3 text-foreground">
                  {legacyContent.homepage.unlimitedAdventureTitle}
                </h2>
                <p className="mb-3 text-lg text-muted-foreground">
                  {legacyContent.homepage.serviceDescription}
                </p>
                <p className="mb-5 text-lg text-muted-foreground">
                  {legacyContent.homepage.serviceDescription2}
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.unlimitedRidesTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.unlimitedRidesSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.frequentServiceTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.frequentServiceSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.smallGroupsTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.smallGroupsSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.professionalGuidesTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.professionalGuidesSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.requestPickupTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.requestPickupSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                    <div>
                      <p className="text-foreground">{legacyContent.homepage.realTimeTrackingTitle}</p>
                      <p className="text-sm text-muted-foreground">{legacyContent.homepage.realTimeTrackingSubtitle}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Supporting Image */}
              <div className="relative h-[350px] overflow-hidden rounded-2xl shadow-2xl lg:h-[450px]">
                <ImageWithFallback
                  src={content.homepage.hero.explainerImage || "https://images.unsplash.com/photo-1730911454981-545ef4ebdef9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwZW5hJTIwcGFsYWNlJTIwc2NlbmljJTIwdmlld3xlbnwxfHx8fDE3NjIzNjExODZ8MA&ixlib=rb-4.1.0&q=80&w=1080"}
                  alt="Scenic view of Pena Palace and Sintra attractions"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Route Overview Section */}
      <RouteOverview language={language} />

      {/* Today's Special: Sunset Drive Carousel */}
      {sunsetSpecialEnabled && (
        <SunsetSpecialCarousel onNavigate={onNavigate} language={language} />
      )}

      {/* Steps Section - Detailed & Engaging */}
      <section className="relative bg-gradient-to-b from-white via-secondary/20 to-white py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-accent">
                {t.easyAs1234}
              </span>
            </div>
            <h2 className="text-foreground">
              {t.howItWorksTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="space-y-6 sm:space-y-12">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute left-6 top-16 hidden h-full w-1 bg-gradient-to-b from-accent via-primary to-accent opacity-20 md:block" />
              <Card className="relative overflow-hidden border-2 border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                <div className="flex flex-col gap-3 p-4 sm:gap-6 sm:p-8 md:flex-row md:items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                      <span className="text-xl text-white sm:text-2xl">
                        1
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Ticket className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">
                          {t.step1Title}
                        </h3>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {t.step1Description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-1 text-xs text-accent sm:mt-3 sm:px-3 sm:py-1.5 sm:text-sm">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {t.step1Badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-accent/5 to-transparent sm:h-24 sm:w-24" />
              </Card>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute left-6 top-16 hidden h-full w-1 bg-gradient-to-b from-accent via-primary to-accent opacity-20 md:block" />
              <Card className="relative overflow-hidden border-2 border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                <div className="flex flex-col gap-3 p-4 sm:gap-6 sm:p-8 md:flex-row md:items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                      <span className="text-xl text-white sm:text-2xl">
                        2
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <MapPin className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">
                          {t.step2Title}
                        </h3>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {t.step2Description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-1 text-xs text-accent sm:mt-3 sm:px-3 sm:py-1.5 sm:text-sm">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {t.step2Badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-accent/5 to-transparent sm:h-24 sm:w-24" />
              </Card>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute left-6 top-16 hidden h-full w-1 bg-gradient-to-b from-accent via-primary to-accent opacity-20 md:block" />
              <Card className="relative overflow-hidden border-2 border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                <div className="flex flex-col gap-3 p-4 sm:gap-6 sm:p-8 md:flex-row md:items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                      <span className="text-xl text-white sm:text-2xl">
                        3
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Car className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">
                          {t.step3Title}
                        </h3>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {t.step3Description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-1 text-xs text-accent sm:mt-3 sm:px-3 sm:py-1.5 sm:text-sm">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {t.step3Badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-accent/5 to-transparent sm:h-24 sm:w-24" />
              </Card>
            </div>

            {/* Step 4 */}
            <div className="group relative">
              <Card className="relative overflow-hidden border-2 border-border bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-2xl">
                <div className="flex flex-col gap-3 p-4 sm:gap-6 sm:p-8 md:flex-row md:items-start">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                      <span className="text-xl text-white sm:text-2xl">
                        4
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Bell className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">
                          {t.step4Title}
                        </h3>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {t.step4Description}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-1 text-xs text-accent sm:mt-3 sm:px-3 sm:py-1.5 sm:text-sm">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {t.step4Badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-accent/5 to-transparent sm:h-24 sm:w-24" />
              </Card>
            </div>

            {/* Pro Tip: Request a Ride - Small Info Card */}
            <div className="mt-6 sm:mt-8">
              <Card className="border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Smartphone className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">💡 Tip</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">{legacyContent.homepage.cantSeeVehicle}</strong> {legacyContent.homepage.requestPickupTip}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Install App CTA - After Step 4 */}
          {!isInstalled && showInstallCard && (
            <div className="mt-8 flex justify-center sm:mt-12">
              <Card className="relative w-full max-w-2xl overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-white to-accent/10 shadow-xl">
                {/* Dismiss Button */}
                <button
                  onClick={handleDismissInstallCard}
                  className="absolute right-2 top-2 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent sm:right-3 sm:top-3"
                  aria-label="Dismiss"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>

                <div className="p-5 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    {/* Icon */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center self-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl sm:self-start">
                      <Smartphone className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="mb-2 text-foreground">
                        {t.installAppTitle}
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground sm:mb-4 sm:text-base">
                        {t.installAppDescription}
                      </p>

                      {/* Benefits Pills - Simplified */}
                      <div className="mb-3 flex flex-wrap justify-center gap-2 sm:mb-4 sm:justify-start">
                        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent sm:px-3 sm:text-sm">
                          <Zap className="h-3.5 w-3.5" />
                          {t.installAppFaster}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent sm:px-3 sm:text-sm">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t.installAppOffline}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent sm:px-3 sm:text-sm">
                          <Heart className="h-3.5 w-3.5" />
                          {t.installAppSmoother}
                        </div>
                      </div>

                      {/* Install Instructions */}
                      {isIOS && !deferredPrompt ? (
                        isSafari ? (
                          <div className="mb-3 rounded-lg bg-accent/10 p-3 text-left text-xs sm:mb-4 sm:text-sm">
                            <p className="mb-1.5 text-accent sm:mb-2">
                              <strong>
                                {t.iosInstructions}
                              </strong>
                            </p>
                            <ol className="space-y-0.5 text-muted-foreground sm:space-y-1">
                              <li>{t.iosStep1}</li>
                              <li>{t.iosStep2}</li>
                              <li>{t.iosStep3}</li>
                            </ol>
                          </div>
                        ) : (
                          <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-left text-xs sm:mb-4 sm:text-sm">
                            <p className="mb-1.5 text-amber-800">
                              <strong>
                                {t.chromeIosWarning}
                              </strong>
                            </p>
                            <p className="text-amber-700">
                              {t.chromeIosMessage}
                            </p>
                          </div>
                        )
                      ) : null}

                      {/* Install Button */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                        <Button
                          onClick={handleInstallClick}
                          size="lg"
                          className="w-full bg-accent shadow-lg transition-all hover:scale-105 hover:bg-accent/90 sm:w-auto sm:flex-1"
                        >
                          <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {deferredPrompt
                            ? t.installAppButton
                            : isIOS
                              ? t.viewInstructions
                              : t.installAppButtonShort}
                        </Button>
                        <Button
                          onClick={handleDismissInstallCard}
                          size="lg"
                          variant="outline"
                          className="w-full border-accent/30 text-accent hover:bg-accent/10 sm:w-auto"
                        >
                          {t.installAppMaybeLater}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid - Why You'll Love It */}
      <section className="border-y border-border bg-gradient-to-br from-secondary/30 via-white to-primary/5 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-primary">
                {t.whyYouLoveIt}
              </span>
            </div>
            <h2 className="mb-4 text-foreground">
              {legacyContent.homepage.whatMakesDifferentTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {legacyContent.homepage.whatMakesDifferentSubtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {/* Feature 1 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1670261197503-e7745a85707c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGNpdGVkJTIwdG91cmlzdHMlMjBleHBsb3Jpbmd8ZW58MXx8fHwxNzYwODI0MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Intimate Adventures"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-transform group-hover:scale-110">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.intimateAdventuresTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.intimateAdventuresDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 2 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1669908753503-78024f9ddfe9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0dWdhbCUyMHR1ayUyMHR1ayUyMGFkdmVudHVyZXxlbnwxfHx8fDE3NjA4MjQyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Professional Driver-Guides"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform group-hover:scale-110">
                  <Car className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.professionalDriverGuidesTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.professionalDriverGuidesDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 3 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1697394494123-c6c1323a14f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Your Time, Your Way"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-transform group-hover:scale-110">
                  <Camera className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.yourTimeYourWayTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.yourTimeYourWayDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 4 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1576053437997-efe2472c87ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBjYXN0bGUlMjBhZXJpYWwlMjB2aWV3fGVufDF8fHx8MTc2MDgyNDI0M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Never Rush Again"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform group-hover:scale-110">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.neverRushTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.neverRushDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 5 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1673515335086-c762bbd7a7cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHRyYXZlbGVyJTIwcGhvbmUlMjBib29raW5nfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Guaranteed Seats"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-transform group-hover:scale-110">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.guaranteedSeatsTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.guaranteedSeatsDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 6 - Request a Ride */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjByZXF1ZXN0JTIwdHJhbnNwb3J0fGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Request a Ride On Demand"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg transition-transform group-hover:scale-110">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">
                  {legacyContent.homepage.onDemandPickupTitle}
                </h3>
                <p className="text-muted-foreground">
                  {legacyContent.homepage.onDemandPickupDescription}
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-white">{legacyContent.homepage.quickLinks.title}</h2>
            <p className="text-white/90">{legacyContent.homepage.quickLinks.subtitle}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {/* Attractions Link */}
            <button
              onClick={() => onNavigate("attractions")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/60 hover:bg-white/20 hover:shadow-2xl"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=200&h=200&fit=crop"
                  alt="Attractions"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="mb-1 text-white">
                  {legacyContent.homepage.quickLinks.attractions.title}
                </p>
                <p className="text-sm text-white/80">
                  {legacyContent.homepage.quickLinks.attractions.subtitle}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </button>

            {/* Travel Guide Link */}
            <button
              onClick={() => onNavigate("blog")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/60 hover:bg-white/20 hover:shadow-2xl"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop"
                  alt="Travel Guide"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="mb-1 text-white">
                  {legacyContent.homepage.quickLinks.travelGuide.title}
                </p>
                <p className="text-sm text-white/80">
                  {legacyContent.homepage.quickLinks.travelGuide.subtitle}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </button>

            {/* Private Tours Link */}
            <button
              onClick={() => onNavigate("private-tours")}
              className="group flex items-center gap-4 rounded-2xl border-2 border-accent bg-accent/20 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-accent hover:bg-accent/30 hover:shadow-2xl sm:col-span-2 lg:col-span-1"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=200&h=200&fit=crop"
                  alt="Private Tours"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="mb-1 text-white">
                  {legacyContent.homepage.quickLinks.privateTours.title}
                </p>
                <p className="text-sm text-white/80">
                  {legacyContent.homepage.quickLinks.privateTours.subtitle}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA - More Exciting */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-accent py-14 sm:py-20">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute left-1/4 top-10 h-32 w-32 animate-bounce rounded-full bg-white/30 blur-2xl"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-10 right-1/4 h-40 w-40 animate-bounce rounded-full bg-white/30 blur-2xl"
            style={{
              animationDuration: "4s",
              animationDelay: "1s",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
              <Ticket className="h-10 w-10 text-accent" />
            </div>
          </div>

          <h2 className="mb-4 text-white drop-shadow-lg">
            {legacyContent.homepage.finalCtaTitle}
          </h2>
          <p className="mb-8 text-xl text-white/95 drop-shadow-md">
            {legacyContent.homepage.finalCtaSubtitle}
          </p>

          <Button
            size="lg"
            className="bg-accent text-white shadow-2xl transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-accent/50"
            onClick={() => onNavigate("buy-ticket")}
          >
            <Ticket className="mr-2 h-5 w-5" />
            {legacyContent.homepage.finalCtaButton} - €{basePrice}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-4 text-sm text-white/80">
            {legacyContent.homepage.finalCtaSubtext}
          </p>
        </div>
      </section>

      {/* TEMPORARY TESTING ACCESS - REMOVE IN PRODUCTION */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"></div>
    </div>
  );
}