import { ArrowRight, Users, MapPin, Clock, Shield, Star, CheckCircle2, TrendingUp, Ticket, Car, Bell, Heart, Camera, Zap, CheckCircle, RefreshCw, Download, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { loadContentWithLanguage, type WebsiteContent, DEFAULT_CONTENT } from "../lib/contentManager";
import { getUITranslation } from "../lib/translations";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface HomePageProps {
  onNavigate: (page: string) => void;
  language?: string;
}

export function HomePage({ onNavigate, language = "en" }: HomePageProps) {
  const [basePrice, setBasePrice] = useState(25);
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showInstallCard, setShowInstallCard] = useState(false);
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

  // Listen for PWA install prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    // Detect Safari (not Chrome or other browsers on iOS)
    const isSafariBrowser = isIOSDevice && 
      /Safari/.test(navigator.userAgent) && 
      !/CriOS|FxiOS|OPiOS|mercury|EdgiOS/.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);

    // Check if dismissed recently
    const dismissed = localStorage.getItem('install-card-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no prompt available, scroll to show instructions or alert
      if (isIOS) {
        if (isSafari) {
          alert('To install: Tap the Share button in Safari, then tap "Add to Home Screen"');
        } else {
          alert('To install this app, please open this site in Safari. Chrome on iOS doesn\'t support installing web apps.');
        }
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallCard(false);
  };

  const handleDismissInstallCard = () => {
    setShowInstallCard(false);
    localStorage.setItem('install-card-dismissed', Date.now().toString());
  };

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
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section - Detailed & Engaging */}
      <section className="relative bg-gradient-to-b from-white via-secondary/20 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-accent">{t.easyAs1234}</span>
            </div>
            <h2 className="text-foreground">{t.howItWorksTitle}</h2>
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
                      <span className="text-xl text-white sm:text-2xl">1</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Ticket className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">{t.step1Title}</h3>
                        <p className="text-sm text-muted-foreground sm:text-base">{t.step1Description}</p>
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
                      <span className="text-xl text-white sm:text-2xl">2</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <MapPin className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">{t.step2Title}</h3>
                        <p className="text-sm text-muted-foreground sm:text-base">{t.step2Description}</p>
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
                      <span className="text-xl text-white sm:text-2xl">3</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Car className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">{t.step3Title}</h3>
                        <p className="text-sm text-muted-foreground sm:text-base">{t.step3Description}</p>
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
                      <span className="text-xl text-white sm:text-2xl">4</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                        <Bell className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-foreground sm:mb-2">{t.step4Title}</h3>
                        <p className="text-sm text-muted-foreground sm:text-base">{t.step4Description}</p>
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
                      <h3 className="mb-2 text-foreground">{t.installAppTitle}</h3>
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
                              <strong>{t.iosInstructions}</strong>
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
                              <strong>{t.chromeIosWarning}</strong>
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
                          {deferredPrompt ? t.installAppButton : isIOS ? t.viewInstructions : t.installAppButtonShort}
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
      <section className="border-y border-border bg-gradient-to-br from-secondary/30 via-white to-primary/5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-primary">{t.whyYouLoveIt}</span>
            </div>
            <h2 className="mb-4 text-foreground">What Makes Us Different</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              This isn't just transportation—it's part of the adventure! ✨
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <h3 className="mb-2 text-foreground">Intimate Adventures</h3>
                <p className="text-muted-foreground">
                  Just 2-6 guests per vehicle means you'll actually enjoy the ride! No tour bus crowds, just cozy exploration.
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
                <h3 className="mb-2 text-foreground">Professional Driver-Guides</h3>
                <p className="text-muted-foreground">
                  Every tuk tuk, vintage jeep, and van is driven by a certified local guide who knows Sintra inside out. Get insights you won't find in any guidebook!
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
                <h3 className="mb-2 text-foreground">Your Time, Your Way</h3>
                <p className="text-muted-foreground">
                  Spotted something Instagram-worthy? Hop off! Take your time, snap those photos, and catch the next ride when you're ready.
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
                <h3 className="mb-2 text-foreground">Never Rush Again</h3>
                <p className="text-muted-foreground">
                  Vehicles pass every 10-15 minutes all day long (9am-8pm). Missed one? No worries, another's coming soon!
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
                <h3 className="mb-2 text-foreground">Guaranteed Seats</h3>
                <p className="text-muted-foreground">
                  Unlike public transport, your seat is waiting for you. Pre-booked, stress-free, comfortable—the way travel should be!
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>

            {/* Feature 6 */}
            <Card className="group relative overflow-hidden border-2 border-border bg-white shadow-md transition-all hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1697394494123-c6c1323a14f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMGNvbG9yZnVsJTIwcGFsYWNlfGVufDF8fHx8MTc2MDgyNDI0MXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Instant Everything"
                  className="h-full w-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
              </div>
              <div className="relative p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform group-hover:scale-110">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-2 text-foreground">Instant Everything</h3>
                <p className="text-muted-foreground">
                  Book now, ride now! Digital tickets mean no waiting in lines. Just point, scan, and you're on your way to adventure.
                </p>
              </div>
              <div className="absolute inset-0 border-2 border-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA - More Exciting */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-accent py-20 sm:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-10 h-32 w-32 animate-bounce rounded-full bg-white/30 blur-2xl" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-10 right-1/4 h-40 w-40 animate-bounce rounded-full bg-white/30 blur-2xl" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl">
              <Ticket className="h-10 w-10 text-accent" />
            </div>
          </div>
          
          <h2 className="mb-4 text-white drop-shadow-lg">
            Ready for the Best Day Ever?
          </h2>
          <p className="mb-8 text-xl text-white/95 drop-shadow-md">
            Book your full day pass now—adventure awaits! 🚗✨
          </p>
          
          <Button
            size="lg"
            className="bg-accent text-white shadow-2xl transition-all hover:scale-105 hover:bg-accent/90 hover:shadow-accent/50"
            onClick={() => onNavigate("buy-ticket")}
          >
            <Ticket className="mr-2 h-5 w-5" />
            Get Your Day Pass Now - €{basePrice}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="mt-4 text-sm text-white/80">
            ⚡ Instant confirmation • 📱 Mobile-friendly • 💳 Secure payment
          </p>
        </div>
      </section>

      {/* TEMPORARY TESTING ACCESS - REMOVE IN PRODUCTION */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">

      </div>
    </div>
  );
}