import { SunsetSpecialCarousel } from "./SunsetSpecialCarousel";
import { RouteOverview } from "./RouteOverview";
import { ProductCard } from "./ProductCard";
import { HeroSection } from "./HeroSectionNew";
import { useState, useEffect } from "react";
import {
  loadContentWithLanguage,
  type WebsiteContent,
  DEFAULT_CONTENT,
} from "../lib/contentManager";
import { getUITranslation } from "../lib/translations";
import { useEditableContent } from "../lib/useEditableContent";
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

// HomePage component with integrated booking card
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface HomePageProps {
  onNavigate: (page: string) => void;
  language?: string;
  websiteContent?: WebsiteContent;
}

export function HomePage({
  onNavigate,
  language = "en",
  websiteContent,
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
    useState<WebsiteContent>(() => loadContentWithLanguage(language));
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const t = getUITranslation(language);
  // Use editable content from admin panel with language support
  const content = useEditableContent(language);

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
          if (data.success && data.pricing) {
            if (data.pricing.basePrice) {
              setBasePrice(data.pricing.basePrice);
            } else if (data.pricing.dayPass?.adult) {
              setBasePrice(data.pricing.dayPass.adult);
            }
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

    // Update legacy content when language or websiteContent changes
    if (websiteContent) {
      setLegacyContent(websiteContent);
    } else {
      setLegacyContent(loadContentWithLanguage(language));
    }
  }, [language, websiteContent]);

  // Listen for content updates from admin panel
  useEffect(() => {
    const handleContentUpdate = () => {
      setLegacyContent(loadContentWithLanguage(language));
    };

    window.addEventListener('content-updated', handleContentUpdate);
    return () => window.removeEventListener('content-updated', handleContentUpdate);
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

  // Track scroll position to show/hide floating button (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const heroSectionHeight = 700; // Approximate height where main CTAs become out of view
      const scrollPosition = window.scrollY;
      
      // Only show on mobile (< 768px) and when scrolled past hero section
      const isMobile = window.innerWidth < 768;
      const shouldShow = isMobile && scrollPosition > heroSectionHeight;
      
      setShowFloatingButton(shouldShow);
    };

    // Check on mount and scroll
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="flex-1">
      {/* Hero Section - Visual Impact with Large Image */}
      <HeroSection
        language={language}
        onNavigate={onNavigate}
        basePrice={basePrice}
        priceLoaded={priceLoaded}
        legacyContent={legacyContent}
        content={content}
      />

      {/* Route Overview Section */}
      <RouteOverview language={language} onNavigate={onNavigate} />

      {/* Today's Special: Sunset Drive Carousel */}
      {sunsetSpecialEnabled && (
        <SunsetSpecialCarousel onNavigate={onNavigate} language={language} />
      )}

      {/* Quick Links Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-white">{legacyContent.homepage.quickLinks.title}</h2>
            <p className="text-white/90">{legacyContent.homepage.quickLinks.subtitle}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {/* Attractions Link */}
            <button
              onClick={() => onNavigate(legacyContent.homepage.quickLinks.attractions.link)}
              className="group flex items-center gap-4 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/60 hover:bg-white/20 hover:shadow-2xl"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src={legacyContent.homepage.quickLinks.attractions.imageUrl || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=200&h=200&fit=crop"}
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
              onClick={() => onNavigate(legacyContent.homepage.quickLinks.travelGuide.link)}
              className="group flex items-center gap-4 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/60 hover:bg-white/20 hover:shadow-2xl"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src={legacyContent.homepage.quickLinks.travelGuide.imageUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop"}
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
              onClick={() => onNavigate(legacyContent.homepage.quickLinks.privateTours.link)}
              className="group flex items-center gap-4 rounded-2xl border-2 border-accent bg-accent/20 px-6 py-5 backdrop-blur-sm transition-all hover:scale-105 hover:border-accent hover:bg-accent/30 hover:shadow-2xl sm:col-span-2 lg:col-span-1"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <ImageWithFallback
                  src={legacyContent.homepage.quickLinks.privateTours.imageUrl || "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=200&h=200&fit=crop"}
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

      {/* Floating Buy Day Pass Button - Mobile Only */}
      {showFloatingButton && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <Button
            size="lg"
            className="h-12 animate-in slide-in-from-bottom-2 gap-2 bg-accent px-6 text-white shadow-2xl transition-all hover:scale-105 hover:bg-accent/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            <Ticket className="h-4 w-4" />
            Buy Day Pass
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}